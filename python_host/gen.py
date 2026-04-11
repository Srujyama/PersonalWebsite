#!/usr/bin/env python3
"""
StippleGen — Convert images to stippled grayscale dot art.
Exports dot positions as JSON for web animations.
"""

import sys
import json
import math
import random
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QRectF
from PyQt6.QtGui import (
    QPixmap, QPainter, QColor, QPen, QBrush, QImage, QFont, QIcon
)
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QSlider, QFileDialog, QSpinBox, QGroupBox,
    QProgressBar, QSplitter, QFrame, QComboBox, QCheckBox, QDoubleSpinBox,
    QMessageBox, QSizePolicy, QScrollArea
)


# ─── Stippling Engine ───────────────────────────────────────────────────────

def load_and_prepare(path, max_dim=800):
    """Load image, convert to grayscale numpy array (0=white, 255=black)."""
    img = Image.open(path).convert("L")
    # Resize if too large
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    # Optional slight blur for smoother stipple
    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
    arr = np.array(img, dtype=np.float64)
    # Invert: 0 = white bg, 255 = darkest
    arr = 255.0 - arr
    return arr, img.size


def generate_stipple_dots(
    darkness_map,
    num_dots=15000,
    min_dot_size=0.8,
    max_dot_size=2.5,
    size_varies=True,
    gamma=1.0,
    seed=42,
    progress_cb=None,
):
    """
    Generate stipple dot positions using weighted rejection sampling.
    
    Returns list of dicts: {x, y, r} where x,y are in pixel coords
    and r is the dot radius.
    """
    rng = np.random.RandomState(seed)
    h, w = darkness_map.shape

    # Apply gamma to control contrast
    density = np.clip(darkness_map / 255.0, 0, 1)
    density = np.power(density, gamma)

    # Normalize to probability
    total = density.sum()
    if total < 1e-6:
        return []

    # Flatten for weighted sampling
    flat_density = density.ravel()
    prob = flat_density / flat_density.sum()

    # Sample dot positions using weighted random choice
    indices = rng.choice(len(flat_density), size=num_dots, replace=True, p=prob)

    dots = []
    for idx_i, idx in enumerate(indices):
        row = idx // w
        col = idx % w
        # Add sub-pixel jitter for natural look
        jx = rng.uniform(-0.5, 0.5)
        jy = rng.uniform(-0.5, 0.5)
        x = col + jx
        y = row + jy

        # Dot size based on local darkness
        local_dark = density[row, col]
        if size_varies:
            r = min_dot_size + (max_dot_size - min_dot_size) * local_dark
        else:
            r = (min_dot_size + max_dot_size) / 2

        dots.append({"x": float(x), "y": float(y), "r": float(r)})

        if progress_cb and idx_i % 500 == 0:
            progress_cb(int(100 * idx_i / num_dots))

    if progress_cb:
        progress_cb(100)

    return dots


def dots_to_json(dots, img_width, img_height):
    """Convert dots to normalized JSON-friendly format (0-1 range)."""
    normalized = []
    for d in dots:
        normalized.append({
            "x": round(d["x"] / img_width, 5),
            "y": round(d["y"] / img_height, 5),
            "r": round(d["r"], 3),
        })
    return {
        "width": img_width,
        "height": img_height,
        "dotCount": len(dots),
        "dots": normalized,
    }


def render_stipple_image(dots, width, height, bg_color=(255, 255, 255), dot_color=(0, 0, 0)):
    """Render dots to a PIL Image."""
    img = Image.new("RGB", (width, height), bg_color)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    for d in dots:
        x, y, r = d["x"], d["y"], d["r"]
        draw.ellipse(
            [x - r, y - r, x + r, y + r],
            fill=dot_color
        )
    return img


# ─── Worker Thread ───────────────────────────────────────────────────────────

class StippleWorker(QThread):
    progress = pyqtSignal(int)
    finished = pyqtSignal(list)

    def __init__(self, darkness_map, num_dots, min_size, max_size,
                 size_varies, gamma, seed):
        super().__init__()
        self.darkness_map = darkness_map
        self.num_dots = num_dots
        self.min_size = min_size
        self.max_size = max_size
        self.size_varies = size_varies
        self.gamma = gamma
        self.seed = seed

    def run(self):
        dots = generate_stipple_dots(
            self.darkness_map,
            num_dots=self.num_dots,
            min_dot_size=self.min_size,
            max_dot_size=self.max_size,
            size_varies=self.size_varies,
            gamma=self.gamma,
            seed=self.seed,
            progress_cb=lambda v: self.progress.emit(v),
        )
        self.finished.emit(dots)


# ─── Preview Widget ──────────────────────────────────────────────────────────

class StipplePreview(QWidget):
    """Widget that renders the stipple preview."""

    def __init__(self):
        super().__init__()
        self.dots = []
        self.img_w = 0
        self.img_h = 0
        self.setMinimumSize(300, 300)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

    def set_dots(self, dots, w, h):
        self.dots = dots
        self.img_w = w
        self.img_h = h
        self.update()

    def clear(self):
        self.dots = []
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # White background
        painter.fillRect(self.rect(), QColor(255, 255, 255))

        if not self.dots or self.img_w == 0:
            painter.setPen(QColor(180, 180, 180))
            painter.setFont(QFont("sans-serif", 13))
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter,
                             "Load an image to begin")
            painter.end()
            return

        # Scale to fit widget
        widget_w = self.width()
        widget_h = self.height()
        scale_x = widget_w / self.img_w
        scale_y = widget_h / self.img_h
        scale = min(scale_x, scale_y) * 0.95
        off_x = (widget_w - self.img_w * scale) / 2
        off_y = (widget_h - self.img_h * scale) / 2

        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(0, 0, 0))

        for d in self.dots:
            x = d["x"] * scale + off_x
            y = d["y"] * scale + off_y
            r = d["r"] * scale
            painter.drawEllipse(QRectF(x - r, y - r, r * 2, r * 2))

        painter.end()


# ─── Main Window ─────────────────────────────────────────────────────────────

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("StippleGen — Image to Dot Art")
        self.setMinimumSize(1100, 750)

        self.darkness_map = None
        self.img_size = (0, 0)
        self.dots = []
        self.source_path = None
        self.worker = None

        self._build_ui()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(16)

        # ── Left panel: controls ──
        left_panel = QWidget()
        left_panel.setFixedWidth(320)
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0, 0, 0, 0)
        left_layout.setSpacing(12)

        # Title
        title = QLabel("StippleGen")
        title.setFont(QFont("sans-serif", 20, QFont.Weight.Bold))
        left_layout.addWidget(title)

        subtitle = QLabel("Convert images to stippled dot art\nExport as JSON for web animations")
        subtitle.setStyleSheet("color: #666; font-size: 12px;")
        left_layout.addWidget(subtitle)

        # Load button
        self.load_btn = QPushButton("📂  Load Image")
        self.load_btn.setFixedHeight(44)
        self.load_btn.setStyleSheet("""
            QPushButton {
                background: #111; color: white; border: none;
                border-radius: 8px; font-size: 14px; font-weight: bold;
            }
            QPushButton:hover { background: #333; }
        """)
        self.load_btn.clicked.connect(self._load_image)
        left_layout.addWidget(self.load_btn)

        # Source image preview
        self.source_label = QLabel()
        self.source_label.setFixedHeight(180)
        self.source_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.source_label.setStyleSheet(
            "background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px;"
        )
        self.source_label.setText("No image loaded")
        left_layout.addWidget(self.source_label)

        # Parameters group
        params_group = QGroupBox("Parameters")
        params_group.setStyleSheet("QGroupBox { font-weight: bold; }")
        params_layout = QVBoxLayout(params_group)

        # Dot count
        row = QHBoxLayout()
        row.addWidget(QLabel("Dot Count:"))
        self.dot_count_spin = QSpinBox()
        self.dot_count_spin.setRange(1000, 100000)
        self.dot_count_spin.setValue(20000)
        self.dot_count_spin.setSingleStep(1000)
        row.addWidget(self.dot_count_spin)
        params_layout.addLayout(row)

        # Min dot size
        row = QHBoxLayout()
        row.addWidget(QLabel("Min Size:"))
        self.min_size_spin = QDoubleSpinBox()
        self.min_size_spin.setRange(0.1, 5.0)
        self.min_size_spin.setValue(0.6)
        self.min_size_spin.setSingleStep(0.1)
        row.addWidget(self.min_size_spin)
        params_layout.addLayout(row)

        # Max dot size
        row = QHBoxLayout()
        row.addWidget(QLabel("Max Size:"))
        self.max_size_spin = QDoubleSpinBox()
        self.max_size_spin.setRange(0.5, 8.0)
        self.max_size_spin.setValue(2.5)
        self.max_size_spin.setSingleStep(0.1)
        row.addWidget(self.max_size_spin)
        params_layout.addLayout(row)

        # Gamma
        row = QHBoxLayout()
        row.addWidget(QLabel("Gamma:"))
        self.gamma_spin = QDoubleSpinBox()
        self.gamma_spin.setRange(0.1, 3.0)
        self.gamma_spin.setValue(1.0)
        self.gamma_spin.setSingleStep(0.1)
        self.gamma_spin.setToolTip("Higher = more contrast, darker areas get even more dots")
        row.addWidget(self.gamma_spin)
        params_layout.addLayout(row)

        # Size varies checkbox
        self.size_varies_cb = QCheckBox("Vary dot size by darkness")
        self.size_varies_cb.setChecked(True)
        params_layout.addWidget(self.size_varies_cb)

        left_layout.addWidget(params_group)

        # Generate button
        self.generate_btn = QPushButton("▶  Generate Stipple")
        self.generate_btn.setFixedHeight(44)
        self.generate_btn.setEnabled(False)
        self.generate_btn.setStyleSheet("""
            QPushButton {
                background: #2563eb; color: white; border: none;
                border-radius: 8px; font-size: 14px; font-weight: bold;
            }
            QPushButton:hover { background: #1d4ed8; }
            QPushButton:disabled { background: #93c5fd; }
        """)
        self.generate_btn.clicked.connect(self._generate)
        left_layout.addWidget(self.generate_btn)

        # Progress
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        self.progress_bar.setFixedHeight(8)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setStyleSheet("""
            QProgressBar { background: #e5e7eb; border: none; border-radius: 4px; }
            QProgressBar::chunk { background: #2563eb; border-radius: 4px; }
        """)
        left_layout.addWidget(self.progress_bar)

        # Export buttons
        export_row = QHBoxLayout()
        self.export_json_btn = QPushButton("💾 Export JSON")
        self.export_json_btn.setEnabled(False)
        self.export_json_btn.setFixedHeight(38)
        self.export_json_btn.setStyleSheet("""
            QPushButton {
                background: #059669; color: white; border: none;
                border-radius: 8px; font-size: 13px; font-weight: bold;
            }
            QPushButton:hover { background: #047857; }
            QPushButton:disabled { background: #6ee7b7; }
        """)
        self.export_json_btn.clicked.connect(self._export_json)
        export_row.addWidget(self.export_json_btn)

        self.export_img_btn = QPushButton("🖼 Export PNG")
        self.export_img_btn.setEnabled(False)
        self.export_img_btn.setFixedHeight(38)
        self.export_img_btn.setStyleSheet("""
            QPushButton {
                background: #7c3aed; color: white; border: none;
                border-radius: 8px; font-size: 13px; font-weight: bold;
            }
            QPushButton:hover { background: #6d28d9; }
            QPushButton:disabled { background: #c4b5fd; }
        """)
        self.export_img_btn.clicked.connect(self._export_png)
        export_row.addWidget(self.export_img_btn)
        left_layout.addLayout(export_row)

        # Stats
        self.stats_label = QLabel("")
        self.stats_label.setStyleSheet("color: #666; font-size: 11px;")
        left_layout.addWidget(self.stats_label)

        left_layout.addStretch()
        main_layout.addWidget(left_panel)

        # ── Right panel: preview ──
        self.preview = StipplePreview()
        self.preview.setStyleSheet(
            "background: white; border: 1px solid #ddd; border-radius: 8px;"
        )
        main_layout.addWidget(self.preview, 1)

    def _load_image(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "Open Image", "",
            "Images (*.png *.jpg *.jpeg *.bmp *.tiff *.webp);;All Files (*)"
        )
        if not path:
            return

        self.source_path = path
        self.darkness_map, self.img_size = load_and_prepare(path)

        # Show source preview
        pixmap = QPixmap(path)
        scaled = pixmap.scaled(
            self.source_label.size(),
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        )
        self.source_label.setPixmap(scaled)
        self.generate_btn.setEnabled(True)
        self.preview.clear()
        self.dots = []
        self.stats_label.setText(
            f"Loaded: {Path(path).name}  ({self.img_size[0]}×{self.img_size[1]})"
        )

    def _generate(self):
        if self.darkness_map is None:
            return

        self.generate_btn.setEnabled(False)
        self.export_json_btn.setEnabled(False)
        self.export_img_btn.setEnabled(False)
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)

        self.worker = StippleWorker(
            self.darkness_map,
            num_dots=self.dot_count_spin.value(),
            min_size=self.min_size_spin.value(),
            max_size=self.max_size_spin.value(),
            size_varies=self.size_varies_cb.isChecked(),
            gamma=self.gamma_spin.value(),
            seed=42,
        )
        self.worker.progress.connect(self._on_progress)
        self.worker.finished.connect(self._on_finished)
        self.worker.start()

    def _on_progress(self, val):
        self.progress_bar.setValue(val)

    def _on_finished(self, dots):
        self.dots = dots
        w, h = self.img_size
        self.preview.set_dots(dots, w, h)
        self.generate_btn.setEnabled(True)
        self.export_json_btn.setEnabled(True)
        self.export_img_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        self.stats_label.setText(
            f"{len(dots):,} dots generated  •  "
            f"{self.img_size[0]}×{self.img_size[1]}px"
        )

    def _export_json(self):
        if not self.dots:
            return
        path, _ = QFileDialog.getSaveFileName(
            self, "Save JSON", "stipple_data.json", "JSON (*.json)"
        )
        if not path:
            return

        w, h = self.img_size
        data = dots_to_json(self.dots, w, h)
        with open(path, "w") as f:
            json.dump(data, f)

        QMessageBox.information(
            self, "Exported",
            f"Saved {len(self.dots):,} dots to:\n{path}"
        )

    def _export_png(self):
        if not self.dots:
            return
        path, _ = QFileDialog.getSaveFileName(
            self, "Save PNG", "stipple_output.png", "PNG (*.png)"
        )
        if not path:
            return

        w, h = self.img_size
        img = render_stipple_image(self.dots, w, h)
        img.save(path, "PNG")

        QMessageBox.information(
            self, "Exported",
            f"Saved stipple image to:\n{path}"
        )


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    # Dark-ish palette
    app.setStyleSheet("""
        QMainWindow { background: #fafafa; }
        QGroupBox { 
            border: 1px solid #ddd; border-radius: 8px; 
            margin-top: 12px; padding-top: 20px;
            background: white;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 12px; padding: 0 6px;
        }
        QLabel { font-size: 13px; }
        QSpinBox, QDoubleSpinBox {
            border: 1px solid #ccc; border-radius: 4px;
            padding: 4px 8px; min-width: 80px;
        }
        QCheckBox { font-size: 13px; }
    """)

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

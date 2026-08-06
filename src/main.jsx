import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
// One face, both cuts. JetBrains Mono sets the entire site — headings, prose
// and labels — so the variable weight axis carries the hierarchy on its own.
// Italic stays reserved for species names, gene names and venue titles, which
// is what italic means in this field, and it needs a real cut: with only the
// upright file loaded the browser skews the roman and the reservation stops
// reading as a decision.
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/jetbrains-mono/wght-italic.css";
import "./style.css";
import monoWoff2 from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";

// Preload the upright cut, which is what every heading and paragraph is set
// in; the italic is only needed further down a page and can arrive late.
{
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = monoWoff2;
    document.head.appendChild(link);
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

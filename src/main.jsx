import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
// Both cuts. Roman carries the headings; italic is reserved for species
// names, gene names and venue titles, which is what italic means in this
// field. Loading only the italic file meant `font-style: normal` silently
// rendered italic anyway, because there was no upright face to fall back to.
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./style.css";
import newsreaderWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2?url";

// Preload the roman cut, which is what the name and every heading are set in;
// the italic is only needed further down a page and can arrive late.
{
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = newsreaderWoff2;
    document.head.appendChild(link);
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

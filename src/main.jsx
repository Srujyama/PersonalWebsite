import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "@fontsource-variable/newsreader/opsz-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./style.css";
import newsreaderWoff2 from "@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2?url";

// Preload the display font so the giant hero name doesn't flash a fallback
// serif (most visible for reduced-motion users, who skip the intro).
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

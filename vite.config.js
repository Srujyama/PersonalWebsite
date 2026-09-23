import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Every page is a plain HTML file. `mpa` turns off the SPA fallback, so an
// unknown path is a real 404 instead of silently rendering the home page.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    appType: "mpa",
    build: {
        rollupOptions: {
            input: {
                home: resolve(root, "index.html"),
                drosophila: resolve(root, "research/drosophila.html"),
                redcarpet: resolve(root, "research/redcarpet.html"),
                notfound: resolve(root, "404.html"),
            },
        },
    },
});

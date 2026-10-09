// Server statis minimal untuk hasil build Vite (folder dist/).
// Tanpa dependency tambahan — cukup Node.js bawaan.
// Dipakai oleh script "start" dan Procfile (web: node server.mjs)
// agar container PaaS bisa langsung menyajikan web dan mendapat domain.
// Port dibaca dari env PORT (default 3000), ala standar platform PaaS.

import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist");
const indexHtml = path.join(root, "index.html");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function contentType(file) {
  return MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

const server = createServer(async (req, res) => {
  try {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      pathname = "/";
    }
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.normalize(path.join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = indexHtml;
    } catch {
      // File tidak ditemukan → SPA fallback ke index.html
      target = indexHtml;
    }

    if (!existsSync(target)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType(target),
      "Cache-Control": "no-cache",
    });
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Serving dist/ on http://${host}:${port}`);
});
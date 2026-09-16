/**
 * Serves site/ over HTTP so the single-file page can actually run.
 *
 * It cannot be opened over file:// — the page is an ES module, and browsers
 * refuse module scripts from a file URL — so viewing it needs a server. Node's
 * own http.server equivalents mostly do, but Python's does not answer Range
 * requests, and a <video> that is handed 200 with the whole body instead of a
 * 206 is aborted by Chromium: the seven plates come up blank. Hence this
 * rather than a one-liner in the README.
 *
 *   npm run site            → http://localhost:8000
 *   npm run site -- 3000    → a port of your choosing
 *
 * No dependencies: node's http and fs only.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".hdr": "image/vnd.radiance",
  ".glb": "model/gltf-binary",
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || "/").split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, rel);

  /* Never serve outside site/, whatever the path climbs through. */
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`404 ${rel}\n`);
    return;
  }

  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const size = fs.statSync(file).size;
  const range = req.headers.range;

  /* A media element asks for bytes, not a file. Answering 200 with the whole
     body makes Chromium drop the request and the plate stays on its poster. */
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? Number(m[1]) : 0;
    const end = m && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": end - start + 1,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Content-Length": size,
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is busy. Try:  npm run site -- ${PORT + 1}`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n  AMW / GRIDO1 — serving site/ at  http://localhost:${PORT}\n`);
  console.log("  The hero's helmet, the studio HDR and the logos come from the");
  console.log("  project's asset bucket, and three.js and Lenis from jsDelivr, so");
  console.log("  this needs a working internet connection. Ctrl-C to stop.\n");
});

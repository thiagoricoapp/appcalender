import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png" };

const server = createServer(async (req,res) => {
  try {
    const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = normalize(join(root, requestPath === "/" ? "index.html" : requestPath));
    const rel = relative(root, safePath);
    if (rel === ".." || rel.startsWith("../") || rel.startsWith("..\\")) { res.writeHead(403); res.end("Forbidden"); return; }
    let body;
    try { body = await readFile(safePath); } catch { body = await readFile(join(root, "index.html")); }
    res.writeHead(200, { "Content-Type": mime[extname(safePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (error) { res.writeHead(500); res.end(String(error?.message || "Server error")); }
});
server.listen(port,"127.0.0.1",() => console.log("Rotina test server: http://127.0.0.1:" + port));

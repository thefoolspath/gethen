import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

export function createStaticServer(port = 4173) {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
    let filePath = join(root, requestedPath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (extname(filePath) === "" || !existsSync(filePath)) {
      const modulePath = [".js", ".mjs"].map((extension) => `${filePath}${extension}`).find((path) => existsSync(path));

      if (modulePath) {
        filePath = modulePath;
      }
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath) && (url.pathname === "/docs" || url.pathname.startsWith("/docs/"))) {
      filePath = join(root, "apps", "docs-site", "index.html");
    }

    if (!existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? 4173);
  const server = createStaticServer(port);

  server.listen(port, "127.0.0.1", () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`);
  });
}

import { spawn } from "node:child_process";
import { join } from "node:path";

import { createStaticServer } from "./serve-static.mjs";

const server = createStaticServer(0);

await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();

if (!address || typeof address === "string") {
  throw new Error("Browser test server did not bind to a TCP port.");
}

const port = address.port;

const playwrightCli = join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
const playwrightArgs = process.argv.slice(2);

try {
  const child = spawn(process.execPath, [playwrightCli, "test", ...playwrightArgs], {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      GETHEN_BASE_URL: `http://127.0.0.1:${port}`
    }
  });

  process.exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

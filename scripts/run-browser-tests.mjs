import { spawn } from "node:child_process";
import { join } from "node:path";

import { createStaticServer } from "./serve-static.mjs";

const port = 4173;
const server = createStaticServer(port);

await new Promise((resolve) => {
  server.listen(port, "127.0.0.1", resolve);
});

const playwrightCli = join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");

try {
  const child = spawn(process.execPath, [playwrightCli, "test"], {
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

import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;
const environment = {
  ...process.env,
  PORT: String(port),
  HOSTNAME: "127.0.0.1",
  LUNAS_SESSION_SECRET:
    process.env.LUNAS_SESSION_SECRET || "lunas-playwright-isolated-session-secret-only",
  LUNAS_API_URL: process.env.LUNAS_API_URL || "http://127.0.0.1:5119/api/v1",
};

const server = spawn(process.execPath, [join(root, ".next", "standalone", "server.js")], {
  cwd: root,
  env: environment,
  stdio: "inherit",
});

let serverExit;
const serverExited = new Promise((resolve) => {
  server.once("exit", (code, signal) => {
    serverExit = { code, signal };
    resolve(serverExit);
  });
});

async function waitUntilReady() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (serverExit) {
      throw new Error(`Standalone server exited before readiness (${JSON.stringify(serverExit)}).`);
    }
    try {
      const response = await fetch(`${baseURL}/login`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The server may still be binding or compiling its first request.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Standalone server did not become ready at ${baseURL}.`);
}

async function stopServer() {
  if (serverExit) return;
  server.kill("SIGTERM");
  await Promise.race([
    serverExited,
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (!serverExit) server.kill("SIGKILL");
  await serverExited;
}

let exitCode = 1;
try {
  await waitUntilReady();
  const playwright = spawn(
    process.execPath,
    [join(root, "node_modules", "@playwright", "test", "cli.js"), "test"],
    { cwd: root, env: environment, stdio: "inherit" },
  );
  exitCode = await new Promise((resolve, reject) => {
    playwright.once("error", reject);
    playwright.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await stopServer();
}

process.exitCode = exitCode;

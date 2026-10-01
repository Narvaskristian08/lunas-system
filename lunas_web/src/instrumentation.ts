export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateWebServerEnvironment } = await import("@/lib/config/runtime");
    try {
      validateWebServerEnvironment();
    } catch (error) {
      console.error("LUNAS web server configuration is invalid:", error);
      process.exit(1);
    }
  }
}

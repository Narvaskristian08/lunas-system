const placeholderSecret = /(replace|change[_-]?this|your[_-]|example|minimum[_-]?32)/i;

function productionValue(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} must be configured in production.`);
  return value;
}

export function sessionSecret(environment: NodeJS.ProcessEnv = process.env) {
  const configured = environment.LUNAS_SESSION_SECRET?.trim();
  if (environment.NODE_ENV !== "production") {
    return configured || "lunas-local-development-session-secret";
  }
  const value = productionValue(environment, "LUNAS_SESSION_SECRET");
  if (value.length < 32 || placeholderSecret.test(value)) {
    throw new Error(
      "LUNAS_SESSION_SECRET must be a non-placeholder, high-entropy secret of at least 32 characters.",
    );
  }
  return value;
}

export function validateWebServerEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  if (environment.NODE_ENV !== "production") return;
  sessionSecret(environment);

  const configuredApiUrl = productionValue(environment, "LUNAS_API_URL");
  let parsed: URL;
  try {
    parsed = new URL(configuredApiUrl);
  } catch {
    throw new Error("LUNAS_API_URL must be a valid absolute URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("LUNAS_API_URL must use http or https.");
  }
}

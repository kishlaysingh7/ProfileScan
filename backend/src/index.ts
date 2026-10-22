import { createApp } from "./app.js";
import { config } from "./config.js";

if (config.isProd && config.corsOrigins.length === 0) {
  console.error("CORS_ORIGIN must be set in production.");
  process.exit(1);
}

const server = createApp().listen(config.port, () => {
  console.log(
    JSON.stringify({ event: "listening", port: config.port, webSearch: !!config.braveApiKey, githubToken: !!config.githubToken }),
  );
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

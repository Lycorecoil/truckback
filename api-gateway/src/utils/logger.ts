import pino from "pino";

const SERVICE_NAME = process.env["SERVICE_NAME"] ?? "service";

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? (process.env["NODE_ENV"] === "production" ? "info" : "debug"),
  base: { service: SERVICE_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) { return { level: label }; },
  },
  // En dev : sortie lisible. En prod : JSON pur pour l'agrégateur.
  transport: process.env["NODE_ENV"] !== "production" && process.env["NODE_ENV"] !== "test"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
});

import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number =
    typeof (err as { statusCode?: number }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;

  const message: string =
    err instanceof Error ? err.message : "Erreur interne du serveur";

  res.status(status).json({ error: message });
};

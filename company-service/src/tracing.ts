import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const serviceName = process.env["SERVICE_NAME"] ?? "unknown-service";

const sdk = new NodeSDK({
  resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: serviceName }),
  traceExporter: new OTLPTraceExporter({
    url: `${process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://jaeger:4318"}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();
process.on("SIGTERM", () => { void sdk.shutdown(); });


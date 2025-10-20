import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

export const OtelLive = NodeSdk.layer(() => ({
	resource: { serviceName: "boombox" },
	spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}));

import { createFileRoute } from "@tanstack/react-router";
import { TelemetryDashboard } from "@/components/TelemetryDashboard";

export const Route = createFileRoute("/telemetry")({
  component: TelemetryDashboard,
});

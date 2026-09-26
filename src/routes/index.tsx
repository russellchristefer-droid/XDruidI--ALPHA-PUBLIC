import { createFileRoute } from "@tanstack/react-router";
import { AssayGame } from "@/components/AssayGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AssayGame />;
}

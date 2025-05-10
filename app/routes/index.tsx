import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "./-components/hero";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {},
});

function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <HeroSection />
    </main>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { getConfiguration } from "~/data-access/configuration";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const getConfigurationFn = createServerFn().handler(async () => {
  return await getConfiguration();
});

export const Route = createFileRoute("/about/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["configuration"],
      queryFn: getConfigurationFn,
    });
  },
});

function RouteComponent() {
  const configuration = useQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  return (
    <main className="mt-12 container mx-auto px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="prose max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: configuration.data?.about || "",
            }}
          />
        </div>
      </div>
    </main>
  );
}

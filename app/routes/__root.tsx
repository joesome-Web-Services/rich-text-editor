import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { HeadContent, Scripts } from "@tanstack/react-router";
import * as React from "react";
import { type QueryClient } from "@tanstack/react-query";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { getConfigurationFn, Header } from "~/routes/-components/header";
import { FooterSection } from "~/routes/-components/footer";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Toaster } from "~/components/ui/toaster";
import { Configuration } from "~/db/schema";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: ({ loaderData }) => {
      const typedConfiguration = (loaderData as any)
        .configuration as Configuration;
      const title = typedConfiguration.name;
      const description = typedConfiguration.name; // TODO: this should be the general site description
      const base64EncodedFavIcon = typedConfiguration.favicon;

      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          ...seo({
            title,
            description,
          }),
        ],
        links: [
          { rel: "stylesheet", href: appCss },
          {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: base64EncodedFavIcon,
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: base64EncodedFavIcon,
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "16x16",
            href: base64EncodedFavIcon,
          },
          {
            rel: "icon",
            href: base64EncodedFavIcon,
          },
        ],
        scripts: [
          {
            src: "https://umami-production-101d.up.railway.app/script.js",
            defer: true,
            "data-website-id": "a40cba1d-b3d3-430f-9174-58ef5ecf69ae",
          },
        ],
      };
    },
    loader: async ({ context }) => {
      const configuration = await context.queryClient.ensureQueryData({
        queryKey: ["configuration"],
        queryFn: getConfigurationFn,
      });

      return {
        configuration,
      };
    },
    errorComponent: (props) => {
      return (
        <RootDocument>
          <DefaultCatchBoundary {...props} />
        </RootDocument>
      );
    },
    notFoundComponent: () => <NotFound />,
    component: RootComponent,
  }
);

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const prevPathnameRef = React.useRef("");

  React.useEffect(() => {
    const currentPathname = routerState.location.pathname;
    const pathnameChanged = prevPathnameRef.current !== currentPathname;

    if (pathnameChanged && routerState.status === "pending") {
      NProgress.start();
      prevPathnameRef.current = currentPathname;
    }

    if (routerState.status === "idle") {
      NProgress.done();
    }
  }, [routerState.status, routerState.location.pathname]);

  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
        <style>{`
          #nprogress .bar {
            background: #fb7185 !important;
            height: 3px;
          }
          #nprogress .peg {
            box-shadow: 0 0 10px #fb7185, 0 0 5px #fb7185;
          }
          #nprogress .spinner-icon {
            display: none;
          }
        `}</style>
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <Toaster />
        <main className="pt-[80px] bg-gray-50 min-h-screen">{children}</main>
        <FooterSection />
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}

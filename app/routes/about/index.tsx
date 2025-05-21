import { createServerFn } from "@tanstack/react-start";
import {
  getConfiguration,
  updateConfiguration,
} from "~/data-access/configuration";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { isAdminFn } from "~/fn/auth";
import { createFileRoute } from "@tanstack/react-router";
import { EditableContent } from "./-EditableContent";

export const getConfigurationFn = createServerFn().handler(async () => {
  return await getConfiguration();
});

export const updateConfigurationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      about: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Sanitize the HTML content
    const sanitizedContent = sanitizeHtml(data.about, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "nl",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "table",
        "thead",
        "caption",
        "tbody",
        "tr",
        "th",
        "td",
        "pre",
        "span",
      ],
      allowedAttributes: {
        a: ["href", "name", "target", "class"],
        img: ["src", "alt", "title", "class"],
        "*": ["class"],
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
      transformTags: {
        a: (tagName, attribs) => {
          // Ensure external links open in new tab
          if (attribs.href && !attribs.href.startsWith("/")) {
            return {
              tagName,
              attribs: {
                ...attribs,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            };
          }
          return { tagName, attribs };
        },
      },
    });

    return await updateConfiguration({ about: sanitizedContent });
  });

export const Route = createFileRoute("/about/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["configuration"],
      queryFn: getConfigurationFn,
    });

    await context.queryClient.ensureQueryData({
      queryKey: ["isAdmin"],
      queryFn: isAdminFn,
    });
  },
});

function RouteComponent() {
  const configuration = useQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  const handleSave = async (content: string) => {
    await updateConfigurationFn({ data: { about: content } });
  };

  return (
    <main className="mt-12 container mx-auto px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <EditableContent
          onSave={handleSave}
          onSaveSuccess={() => configuration.refetch()}
          content={configuration.data?.about || ""}
        />
      </div>
    </main>
  );
}

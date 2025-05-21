import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  getConfiguration,
  updateConfiguration,
} from "~/data-access/configuration";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAdminFn } from "~/fn/auth";
import { useToast } from "~/hooks/use-toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Loader2 } from "lucide-react";
import React from "react";
import { ContentEditor } from "~/routes/books/$bookId/chapters/-components/content-editor";
import sanitizeHtml from "sanitize-html";

const configurationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  heading: z.string().min(1, "Heading is required"),
  subHeading: z.string().min(1, "Subheading is required"),
  email: z.string().email("Invalid email address"),
  about: z.string().min(1, "About section is required"),
  company: z.string().min(1, "Company name is required"),
});

type ConfigurationFormValues = z.infer<typeof configurationSchema>;

export const getConfigurationFn = createServerFn().handler(async () => {
  return await getConfiguration();
});

export const updateConfigurationFn = createServerFn({ method: "POST" })
  .validator(configurationSchema)
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

    return await updateConfiguration({ ...data, about: sanitizedContent });
  });

export const Route = createFileRoute("/admin")({
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const configuration = useQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  const updateMutation = useMutation({
    mutationFn: updateConfigurationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuration"] });
      toast({
        title: "Success",
        description: "Configuration updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      name: "",
      heading: "",
      subHeading: "",
      email: "",
      about: "",
      company: "",
    },
  });

  // Update form values when configuration data is loaded
  React.useEffect(() => {
    if (configuration.data) {
      form.reset({
        name: configuration.data.name,
        heading: configuration.data.heading,
        subHeading: configuration.data.subHeading,
        email: configuration.data.email,
        about: configuration.data.about,
        company: configuration.data.company,
      });
    }
  }, [configuration.data, form]);

  if (!isAdmin.data) {
    return <div>Access denied</div>;
  }

  if (configuration.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = (data: ConfigurationFormValues) => {
    updateMutation.mutate({ data });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Site Configuration</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Heading</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subHeading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subheading</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Section</FormLabel>
                  <FormControl>
                    <ContentEditor
                      content={field.value}
                      onContentChange={(content) => {
                        field.onChange(content);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}

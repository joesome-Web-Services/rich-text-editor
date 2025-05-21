import { createFileRoute, Link } from "@tanstack/react-router";
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
import React, { useCallback, useState } from "react";
import { ContentEditor } from "~/routes/books/$bookId/chapters/-components/content-editor";
import sanitizeHtml from "sanitize-html";
import { useDropzone } from "react-dropzone";

const configurationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  heading: z.string().min(1, "Heading is required"),
  subHeading: z.string().min(1, "Subheading is required"),
  email: z.string().email("Invalid email address"),
  about: z.string().min(1, "About section is required"),
  company: z.string().min(1, "Company name is required"),
  favicon: z.string().optional(),
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

export const Route = createFileRoute("/admin/")({
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

function FaviconUpload({
  value,
  onChange,
  isUploading,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  isUploading: boolean;
}) {
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange(base64);
      };
      reader.readAsDataURL(file);
    },
    [onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".ico"],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024, // 1MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"}`}
    >
      <input {...getInputProps()} />
      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="Current favicon"
            className="w-16 h-16 mx-auto"
          />
          <p className="text-sm text-gray-500">
            {isDragActive
              ? "Drop the new favicon here"
              : "Drag and drop a new favicon, or click to select"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {isDragActive
            ? "Drop the favicon here"
            : "Drag and drop a favicon, or click to select"}
        </p>
      )}
      {isUploading && (
        <p className="text-sm text-gray-500 mt-2">Uploading...</p>
      )}
    </div>
  );
}

function RouteComponent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

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
      favicon: "",
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
        favicon: configuration.data.favicon,
      });
    }
  }, [configuration.data, form]);

  if (!isAdmin.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl font-semibold">Access Denied</div>
        <Link
          to="/"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Return to Homepage
        </Link>
      </div>
    );
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
                    <div className="max-h-[400px] overflow-y-auto">
                      <ContentEditor
                        content={field.value}
                        onContentChange={(content) => {
                          field.onChange(content);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormControl>
                    <FaviconUpload
                      value={field.value}
                      onChange={(value) => {
                        setIsUploading(true);
                        field.onChange(value);
                        setIsUploading(false);
                      }}
                      isUploading={isUploading}
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

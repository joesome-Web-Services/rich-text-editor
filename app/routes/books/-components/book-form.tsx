import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ImageDropzone } from "~/components/ui/image-dropzone";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "@tanstack/react-router";

export const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  image: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface BookFormProps {
  mode: "create" | "edit";
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BookForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: BookFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: initialValues,
    defaultValues: {
      title: "",
      description: "",
      image: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error(`Failed to ${mode} book:`, error);
      toast({
        title: "Error",
        description: `Failed to ${mode} book. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <main className="py-8 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {mode === "create" ? "Create New Book" : "Edit Book"}
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side - Book Cover */}
              <div className="w-full md:w-1/3">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Cover Image
                      </FormLabel>
                      <FormControl>
                        <div className="aspect-[2/3] w-full relative">
                          {field.value ? (
                            <div className="relative w-full h-full group">
                              <img
                                src={field.value}
                                alt="Book cover"
                                className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <p className="text-white text-sm">
                                  Click or drop to change image
                                </p>
                              </div>
                              <ImageDropzone
                                value={field.value}
                                onChange={field.onChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          ) : (
                            <ImageDropzone
                              value={field.value}
                              onChange={field.onChange}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a cover image for your book. This is optional.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right side - Form Fields */}
              <div className="w-full md:w-2/3 space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your book title"
                          className="bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a compelling title for your book.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description for your book"
                          className="min-h-[200px] bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Write a brief description to give readers an idea of
                        what your book is about.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:w-auto"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={form.formState.isSubmitting || isLoading}
              >
                {form.formState.isSubmitting || isLoading
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Create Book"
                    : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { books } from "~/db/schema";
import { useToast } from "~/hooks/use-toast";
import { isAuthenticatedFn } from "~/fn/auth";

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const createBookFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(formSchema)
  .handler(async ({ data }) => {
    const [book] = await database
      .insert(books)
      .values({
        title: data.title,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { book };
  });

export const Route = createFileRoute("/books/create")({
  component: CreateBook,
  beforeLoad: async () => {
    if (!(await isAuthenticatedFn())) {
      return redirect({
        to: "/unauthorized",
      });
    }
  },
});

function CreateBook() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { book } = await createBookFn({
        data: values,
      });

      toast({
        title: "Success",
        description: "Book created successfully!",
      });

      navigate({
        to: "/books/$bookId",
        params: { bookId: book.id.toString() },
      });
    } catch (error) {
      console.error("Failed to create book:", error);
      toast({
        title: "Error",
        description: "Failed to create book. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create New Book
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your book title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for your book"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a brief description to give readers an idea of what
                    your book is about.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Book"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}

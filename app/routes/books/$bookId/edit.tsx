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
import { isAdminFn } from "~/fn/auth";
import { eq } from "drizzle-orm";
import { useQuery } from "@tanstack/react-query";

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

const getBookFn = createServerFn()
  .validator(z.object({ bookId: z.string() }))
  .handler(async ({ data: { bookId } }) => {
    const book = await database.query.books.findFirst({
      where: eq(books.id, parseInt(bookId)),
    });

    if (!book) {
      throw new Error("Book not found");
    }

    return { book };
  });

const updateBookFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      bookId: z.string(),
      ...formSchema.shape,
    })
  )
  .handler(async ({ data }) => {
    const [book] = await database
      .update(books)
      .set({
        title: data.title,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(books.id, parseInt(data.bookId)))
      .returning();

    return { book };
  });

export const Route = createFileRoute("/books/$bookId/edit")({
  component: EditBook,
  beforeLoad: async () => {
    if (!(await isAdminFn())) {
      throw redirect({
        to: "/unauthorized",
      });
    }
  },
});

function EditBook() {
  const { bookId } = Route.useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: data?.book
      ? {
          title: data.book.title,
          description: data.book.description,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { book } = await updateBookFn({
        data: {
          ...values,
          bookId,
        },
      });

      toast({
        title: "Success",
        description: "Book updated successfully!",
      });

      navigate({
        to: "/books/$bookId",
        params: { bookId: book.id.toString() },
      });
    } catch (error) {
      console.error("Failed to update book:", error);
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Book</h1>

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

            <div className="flex gap-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
                onClick={() =>
                  navigate({
                    to: "/books/$bookId",
                    params: { bookId },
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

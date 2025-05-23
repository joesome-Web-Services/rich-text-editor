import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { books, images } from "~/db/schema";
import { useToast } from "~/hooks/use-toast";
import { isAdminFn } from "~/fn/auth";
import { eq } from "drizzle-orm";
import { useQuery } from "@tanstack/react-query";
import {
  BookForm,
  FormValues,
  formSchema,
} from "~/routes/books/-components/book-form";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getBookFn } from "./chapters/-funs";

const updateBookFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      bookId: z.string(),
      ...formSchema.shape,
    })
  )
  .handler(async ({ data }) => {
    let imageId: number | null = null;

    if (data.image) {
      const [image] = await database
        .insert(images)
        .values({
          data: data.image,
        })
        .returning();
      imageId = image.id;
    }

    const [book] = await database
      .update(books)
      .set({
        title: data.title,
        description: data.description,
        coverImageId: imageId,
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

  const bookQuery = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

  const handleSubmit = async (values: FormValues) => {
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
  };

  if (bookQuery.isLoading) {
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
    <BookForm
      mode="edit"
      initialValues={
        bookQuery.data?.book
          ? {
              title: bookQuery.data.book.title,
              description: bookQuery.data.book.description,
              image: bookQuery.data.book.coverImage?.data,
            }
          : undefined
      }
      onSubmit={handleSubmit}
      onCancel={() =>
        navigate({
          to: "/books/$bookId",
          params: { bookId },
        })
      }
      isLoading={bookQuery.isLoading}
    />
  );
}

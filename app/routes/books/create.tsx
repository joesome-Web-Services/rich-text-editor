import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { books, images } from "~/db/schema";
import { useToast } from "~/hooks/use-toast";
import { isAuthenticatedFn } from "~/fn/auth";
import {
  BookForm,
  FormValues,
  formSchema,
} from "~/routes/books/-components/book-form";
import { useNavigate } from "@tanstack/react-router";

const createBookFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(formSchema)
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
      .insert(books)
      .values({
        title: data.title,
        description: data.description,
        coverImageId: imageId,
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

  const handleSubmit = async (values: FormValues) => {
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
  };

  return (
    <BookForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/books" })}
    />
  );
}

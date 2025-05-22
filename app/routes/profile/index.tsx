import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { database } from "~/db";
import { profiles, images } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ImageDropzone } from "~/components/ui/image-dropzone";
import { authenticatedMiddleware } from "~/lib/auth";

const formSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const getProfileFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const profile = await database.query.profiles.findFirst({
      where: eq(profiles.userId, context.userId),
      with: {
        image: true,
      },
    });
    return { profile };
  });

const updateProfileFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(formSchema)
  .handler(async ({ data, context }) => {
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

    const [profile] = await database
      .update(profiles)
      .set({
        displayName: data.displayName,
        image: data.image,
        imageRefId: imageId,
      })
      .where(eq(profiles.userId, context.userId))
      .returning();

    return { profile };
  });

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const updateProfile = useMutation({
    mutationFn: (values: FormValues) => updateProfileFn({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateProfile.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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

  // Get the image data from either the image relation or the direct image field
  const currentImage = data?.profile?.image?.data || data?.profile?.image || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...form.register("displayName")}
                  defaultValue={data?.profile?.displayName ?? ""}
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ImageDropzone
                  value={currentImage}
                  onChange={(value) => form.setValue("image", value)}
                />
              </div>

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

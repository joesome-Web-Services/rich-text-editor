import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { profiles } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useQuery } from "@tanstack/react-query";
import { unauthenticatedMiddleware } from "~/lib/auth";
import type { Profile } from "~/db/schema";
import { useAuth } from "~/hooks/use-auth";

export const getUserProfileFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const profile = await database.query.profiles.findFirst({
      where: eq(profiles.userId, context.userId!),
      with: {
        image: true,
      },
    });
    return { profile };
  });

export function AvatarDropdown() {
  const user = useAuth();
  const userProfile = useQuery<{ profile: Profile | undefined }>({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfileFn(),
    enabled: !!user,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={
                userProfile.data?.profile?.image?.data ||
                userProfile.data?.profile?.image
              }
              alt={userProfile.data?.profile?.displayName || "User"}
            />
            <AvatarFallback>
              {userProfile.data?.profile?.displayName?.[0]?.toUpperCase() ||
                user.email?.[0]?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="/api/logout"
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

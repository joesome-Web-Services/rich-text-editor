import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "~/utils/session";
import type { User } from "~/db/schema";

export const getUserInfoFn = createServerFn().handler(async () => {
  const user = await getCurrentUser();
  return { user };
});

export function useAuth(): User | undefined {
  const userInfo = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfoFn(),
  });

  return userInfo.data?.user;
}

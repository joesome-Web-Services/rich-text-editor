import { getUserInfoFn } from "./hooks/use-auth";

export const userInfoOption = {
  queryKey: ["userInfo"],
  queryFn: () => getUserInfoFn(),
};

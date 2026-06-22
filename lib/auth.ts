import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type CurrentUser = {
  id: number;
  email: string;
} | null;

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      id: true,
      email: true,
    },
  });

  return user;
}
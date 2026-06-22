import DeliveryApp from "./components/DeliveryApp";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      menus: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const user = await getCurrentUser();

  return <DeliveryApp restaurants={restaurants} user={user} />;
}
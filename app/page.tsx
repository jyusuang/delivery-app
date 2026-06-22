import DeliveryApp from "./components/DeliveryApp";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const restaurantsFromDb = await prisma.restaurant.findMany({
    include: {
      menus: {
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const restaurants = restaurantsFromDb.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    menus: restaurant.menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      restaurantId: menu.restaurantId,
    })),
  }));

  const user = await getCurrentUser();

  return <DeliveryApp restaurants={restaurants} user={user} />;
}
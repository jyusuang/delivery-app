import DeliveryApp from "./components/DeliveryApp";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MenuFromDb = {
  id: number;
  name: string;
  price: number;
  restaurantId: number;
};

type RestaurantFromDb = {
  id: number;
  name: string;
  category: string;
  menus: MenuFromDb[];
};

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

  const restaurants = restaurantsFromDb.map((restaurant: RestaurantFromDb) => ({
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    menus: restaurant.menus.map((menu: MenuFromDb) => ({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      restaurantId: menu.restaurantId,
    })),
  }));

  const user = await getCurrentUser();

  return <DeliveryApp restaurants={restaurants} user={user} />;
}
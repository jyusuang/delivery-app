import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type OrderRequestItem = {
  menuId: number;
  quantity: number;
};

type OrderRequestBody = {
  items?: OrderRequestItem[];
};

type MenuForPrice = {
  id: number;
  price: number;
};

function isValidOrderItem(item: OrderRequestItem): boolean {
  return (
    typeof item.menuId === "number" &&
    Number.isInteger(item.menuId) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: Number(userId),
      },
      include: {
        items: {
          include: {
            menu: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeOrders = orders.map((order) => ({
      id: order.id,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        menu: {
          id: item.menu.id,
          name: item.menu.name,
          price: item.menu.price,
          restaurant: {
            id: item.menu.restaurant.id,
            name: item.menu.restaurant.name,
            category: item.menu.restaurant.category,
          },
        },
      })),
    }));

    return NextResponse.json({
      orders: safeOrders,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "주문 내역을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as OrderRequestBody;
    const items = body.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(
        { message: "장바구니가 비어 있습니다." },
        { status: 400 }
      );
    }

    const hasInvalidItem = items.some((item) => !isValidOrderItem(item));

    if (hasInvalidItem) {
      return NextResponse.json(
        { message: "주문 데이터가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const menuIds = items.map((item) => item.menuId);

    const menus: MenuForPrice[] = await prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
      },
      select: {
        id: true,
        price: true,
      },
    });

    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { message: "존재하지 않는 메뉴가 포함되어 있습니다." },
        { status: 400 }
      );
    }

    const totalPrice = items.reduce((sum: number, item: OrderRequestItem) => {
      const menu = menus.find((menuItem: MenuForPrice) => {
        return menuItem.id === item.menuId;
      });

      return sum + (menu?.price ?? 0) * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        userId: Number(userId),
        totalPrice,
        items: {
          create: items.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "주문 성공",
      order: {
        id: order.id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          menu: {
            id: item.menu.id,
            name: item.menu.name,
            price: item.menu.price,
          },
        })),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "주문 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
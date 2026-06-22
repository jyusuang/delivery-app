import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type OrderRequestItem = {
  menuId: number;
  quantity: number;
};

type MenuForOrder = {
  id: number;
  price: number;
};

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

    return NextResponse.json({ orders });
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

    const body = await request.json();
    const items: OrderRequestItem[] = body.items;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "장바구니가 비어 있습니다." },
        { status: 400 }
      );
    }

    const menuIds = items.map((item) => item.menuId);

    const menus: MenuForOrder[] = await prisma.menu.findMany({
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

    const totalPrice = items.reduce((sum, item) => {
      const menu = menus.find((m: MenuForOrder) => m.id === item.menuId);
      return sum + (menu?.price || 0) * item.quantity;
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
      order,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "주문 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
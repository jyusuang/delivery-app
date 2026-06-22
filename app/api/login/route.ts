import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 틀렸습니다." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: "로그인 성공",
      user: {
        id: user.id,
        email: user.email,
      },
    });

    response.cookies.set("userId", String(user.id), {
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
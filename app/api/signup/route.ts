import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "회원가입 실패: 이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { message: "회원가입 실패: 올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { message: "회원가입 실패: 비밀번호는 4자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "회원가입 실패: 이미 가입된 이메일입니다. 로그인해주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        password,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const response = NextResponse.json({
      message: "회원가입 성공",
      user,
    });

    response.cookies.set("userId", String(user.id), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);

    return NextResponse.json(
      { message: "회원가입 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
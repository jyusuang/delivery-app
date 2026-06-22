import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "로그아웃 성공",
  });

  response.cookies.delete("userId");

  return response;
}
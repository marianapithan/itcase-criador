import { NextResponse } from "next/server";
import { COOKIE, USER_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(USER_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

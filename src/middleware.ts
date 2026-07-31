import { NextRequest, NextResponse } from "next/server";
import { verificarSessao, COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/api/auth/login", "/api/auth/cadastro", "/api/auth/esqueci-senha", "/api/auth/redefinir-senha", "/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;

  // Painel admin — separado do app
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      if (sessao?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }
    if (!sessao || sessao.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // App normal
  if (!sessao && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (sessao && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

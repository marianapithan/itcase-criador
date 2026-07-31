import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-please-change"
);

const COOKIE = "itcase_session";
const USER_COOKIE = "itcase_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type Role = "admin" | "user";
export { COOKIE, USER_COOKIE };

export async function assinarSessao(
  nome: string,
  email: string,
  role: Role = "user",
  userId = "admin-default"
): Promise<string> {
  return new SignJWT({ nome, email, role, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verificarSessao(
  token: string
): Promise<{ nome: string; email: string; role: Role; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      nome: payload.nome as string,
      email: payload.email as string,
      role: (payload.role as Role) ?? "user",
      userId: (payload.userId as string) ?? "admin-default",
    };
  } catch {
    return null;
  }
}

export function cookieOpts(maxAge = MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

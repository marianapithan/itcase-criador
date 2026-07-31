import { NextRequest } from "next/server";
import { verificarSessao } from "@/lib/session";

export const ADMIN_USER_ID = "admin-default";

export async function getSessionInfo(req: NextRequest) {
  const token = req.cookies.get("itcase_session")?.value;
  if (!token) return null;
  return verificarSessao(token);
}

export async function requireAuth(req: NextRequest) {
  const sessao = await getSessionInfo(req);
  if (!sessao?.userId) return null;
  return sessao;
}

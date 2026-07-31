import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Cria Para Mim <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://itcase-conteudo.vercel.app";

export async function enviarEmailRedefinicaoSenha(email: string, nome: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const link = `${APP_URL}/redefinir-senha?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Redefinir sua senha — Cria Para Mim",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d2b1e;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2b1e;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#122a1d;border:1px solid #1e4535;border-radius:16px;overflow:hidden">
        <tr>
          <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1e4535">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#c8d92a,#9b8fd4);margin-bottom:16px">
              <span style="font-size:22px">✦</span>
            </div>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#e4f0de">Cria Para Mim</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#6a9a78">Estúdio de Conteúdo Inteligente</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#e4f0de">Olá, ${nome}!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#8ab89a;line-height:1.6">
              Recebemos uma solicitação para redefinir a senha da sua conta.<br>
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#c8d92a">1 hora</strong>.
            </p>
            <div style="text-align:center;margin-bottom:24px">
              <a href="${link}"
                style="display:inline-block;padding:12px 32px;background:#c8d92a;color:#0d2b1e;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">
                Redefinir minha senha
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#4a7055;line-height:1.6">
              Se você não solicitou isso, pode ignorar este email com segurança. Sua senha permanece a mesma.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #1e4535;text-align:center">
            <p style="margin:0;font-size:11px;color:#2d5a3d">
              Ou copie este link: <span style="color:#6a9a78;word-break:break-all">${link}</span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

import { NextRequest, NextResponse } from "next/server"

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@netnext.site"
const FROM_NAME = "NetNext"

export async function POST(req: NextRequest) {
  try {
    const { to, name, projectType } = await req.json()

    if (!to || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    if (!SMTP_USER || !SMTP_PASS) {
      // SMTP not configured -- log and return success silently
      console.log("[email] SMTP not configured, skipping email send to:", to)
      return NextResponse.json({ ok: true, configured: false })
    }

    const projectTypeLabels: Record<string, string> = {
      website: "Разработка сайта",
      app: "Мобильное приложение",
      design: "UI/UX Дизайн",
      other: "Другое",
    }

    const typeLabel = projectTypeLabels[projectType] || "Проект"
    const html = buildEmailHTML(name, typeLabel)

    // Use fetch-based SMTP via Resend API if SMTP_USER looks like Resend key,
    // otherwise fall back to nodemailer-compatible approach via API
    if (SMTP_USER.startsWith("re_")) {
      // Resend API
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SMTP_USER}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [to],
          subject: `${name}, мы получили вашу заявку!`,
          html,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error("[email] Resend error:", data)
        return NextResponse.json({ error: "Email send failed" }, { status: 502 })
      }

      return NextResponse.json({ ok: true })
    }

    // Generic SMTP via node's built-in modules won't work in edge,
    // so we use a simple HTTP-based approach. For production, configure Resend.
    // For now, log the email content.
    console.log(`[email] Would send to ${to}:`, { subject: `${name}, мы получили вашу заявку!` })
    return NextResponse.json({ ok: true, configured: false })

  } catch (error) {
    console.error("[email] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

/* ── Beautiful branded HTML email template ── */
function buildEmailHTML(name: string, projectType: string): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Заявка принята - NetNext</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0a0f14;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#14b8a6,#0ea5e9);border-radius:14px;padding:12px 14px;">
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">NN</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">NetNext</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#111820;border-radius:20px;border:1px solid #1e293b;overflow:hidden;">
              
              <!-- Accent top bar -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#14b8a6,#0ea5e9,#8b5cf6);"></td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:40px 36px;">
                    
                    <!-- Success icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:60px;height:60px;background-color:rgba(34,197,94,0.1);border-radius:50%;text-align:center;vertical-align:middle;line-height:60px;">
                                <span style="font-size:28px;line-height:60px;">&#10003;</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;line-height:1.3;">
                      ${escHtml(name)}, ваша заявка принята!
                    </h1>
                    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;line-height:1.6;">
                      Мы получили вашу заявку на <strong style="color:#e2e8f0;">${escHtml(projectType)}</strong> и уже начинаем работу. Наш специалист свяжется с вами в ближайшее время.
                    </p>

                    <!-- Info cards -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td style="padding:16px 20px;background-color:#0a0f14;border-radius:12px;border:1px solid #1e293b;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="50%" style="padding:8px 0;">
                                <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Время ответа</p>
                                <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#14b8a6;">~2 часа</p>
                              </td>
                              <td width="50%" style="padding:8px 0;">
                                <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Тип проекта</p>
                                <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#e2e8f0;">${escHtml(projectType)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Steps -->
                    <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#e2e8f0;text-transform:uppercase;letter-spacing:0.5px;">
                      Что дальше?
                    </h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                      ${buildStepRow(1, "Анализ заявки", "Наша команда изучит детали вашего проекта", "#14b8a6")}
                      ${buildStepRow(2, "Связь с вами", "Специалист свяжется для уточнения деталей", "#0ea5e9")}
                      ${buildStepRow(3, "Коммерческое предложение", "Подготовим детальное КП с оценкой и сроками", "#8b5cf6")}
                    </table>

                    <!-- CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="https://t.me/netnext_team" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#14b8a6,#0ea5e9);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
                            Написать в Telegram
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 20px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                <a href="tel:+375291414555" style="color:#94a3b8;text-decoration:none;">+375 (29) 14-14-555</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:hello@netnext.site" style="color:#94a3b8;text-decoration:none;">hello@netnext.site</a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#475569;">
                Минск, ул. Фабрициуса 9
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                &copy; ${year} NetNext. Все права защищены.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildStepRow(num: number, title: string, desc: string, color: string): string {
  return `<tr>
    <td style="padding:10px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="36" valign="top">
            <div style="width:28px;height:28px;border-radius:50%;background-color:${color}20;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:${color};">
              ${num}
            </div>
          </td>
          <td style="padding-left:12px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">${title}</p>
            <p style="margin:2px 0 0;font-size:13px;color:#94a3b8;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

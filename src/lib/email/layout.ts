import { appUrl } from "./client";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailLayout(options: {
  preheader?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
}) {
  const preheader = options.preheader
    ? escapeHtml(options.preheader)
    : "";
  const title = escapeHtml(options.title);
  const cta = options.cta
    ? `
      <tr>
        <td style="padding:28px 0 0;">
          <a href="${escapeHtml(options.cta.href)}"
             style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.02em;padding:14px 22px;border-radius:999px;">
            ${escapeHtml(options.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#111111;">
                Gootunes
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:700;color:#111111;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#444444;">
              ${options.bodyHtml}
            </td>
          </tr>
          ${cta}
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#999999;">
                Direct-to-fan · Afrique<br/>
                <a href="${appUrl()}" style="color:#999999;text-decoration:underline;">gootunes</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function p(text: string) {
  return `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`;
}

export function strongLine(label: string, value: string) {
  return `<p style="margin:0 0 8px;"><span style="color:#888888;">${escapeHtml(label)}</span><br/><strong style="color:#111111;font-weight:600;">${escapeHtml(value)}</strong></p>`;
}

export { escapeHtml };

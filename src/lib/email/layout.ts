import { appUrl } from "./client";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const INK = "#0a0a0a";
const BODY = "#3d3d3d";
const MUTED = "#8a8a8a";
const LINE = "#ececec";
const BG = "#f2f2f0";

/**
 * Bouton « à toute épreuve » (Gmail, Outlook, Apple Mail) :
 * une table qui s'adapte à son texte, jamais plus large que la carte.
 */
function button(label: string, href: string) {
  const safeHref = escapeHtml(href);
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0;border-collapse:separate;max-width:100%;">
    <tr>
      <td align="center" bgcolor="${INK}" style="border-radius:999px;background:${INK};">
        <a href="${safeHref}" target="_blank"
           style="display:inline-block;padding:15px 28px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;white-space:normal;word-break:break-word;mso-padding-alt:0;">
          ${escapeHtml(label)}&nbsp;&rarr;
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailLayout(options: {
  preheader?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
}) {
  const preheader = options.preheader ? escapeHtml(options.preheader) : "";
  const title = escapeHtml(options.title);
  const home = appUrl();
  const logo = appUrl("/logo-gootunes-dark.png");
  const cta = options.cta
    ? `
          <tr>
            <td class="px" style="padding:30px 40px 0;">
              ${button(options.cta.label, options.cta.href)}
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
    a { color:${INK}; }
    @media only screen and (max-width:600px) {
      .outer { padding:20px 10px !important; }
      .px { padding-left:24px !important; padding-right:24px !important; }
      .title { font-size:24px !important; line-height:30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG};">
    <tr>
      <td class="outer" align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:20px;border:1px solid ${LINE};">
          <tr>
            <td class="px" style="padding:32px 40px 0;">
              <a href="${home}" target="_blank" style="text-decoration:none;">
                <img src="${logo}" width="132" height="32" alt="Gootunes"
                     style="display:block;width:132px;height:auto;max-width:132px;border:0;outline:none;text-decoration:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 40px 0;">
              <h1 class="title" style="margin:0;font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.02em;color:${INK};">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 0;font-family:${FONT};font-size:16px;line-height:26px;color:${BODY};word-break:break-word;">
              ${options.bodyHtml}
            </td>
          </tr>
          ${cta}
          <tr>
            <td class="px" style="padding:36px 40px 0;">
              <div style="height:1px;line-height:1px;font-size:1px;background:${LINE};">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:20px 40px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
              Gootunes · La musique directement auprès des artistes.<br/>
              <a href="${home}" target="_blank" style="color:${MUTED};text-decoration:underline;">gootunes.com</a>
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

/** Bloc de détails (titre, prix, montant…) : une ligne par information. */
export function strongLine(label: string, value: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0;border-top:1px solid ${LINE};">
  <tr>
    <td width="34%" style="width:34%;padding:12px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${MUTED};vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
    <td align="right" style="padding:12px 0 12px 16px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:${INK};vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
  </tr>
</table>`;
}

/** Code à usage unique, bien lisible et facile à copier. */
export function codeBlock(code: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 18px;">
  <tr>
    <td align="center" style="padding:20px 12px;background:${BG};border-radius:14px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:32px;line-height:38px;font-weight:700;letter-spacing:0.3em;color:${INK};">
      ${escapeHtml(code)}
    </td>
  </tr>
</table>`;
}

export { escapeHtml };

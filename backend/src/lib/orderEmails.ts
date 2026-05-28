import type { RowDataPacket } from "mysql2";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatOrderTotal(total: unknown): string {
  const n = Number(total);
  return Number.isFinite(n) ? n.toFixed(2) : String(total ?? "");
}

export function customerDisplayName(row: RowDataPacket): string {
  const full = typeof row.full_name === "string" ? row.full_name.trim() : "";
  if (full) return full;
  const user = typeof row.username === "string" ? row.username.trim() : "";
  return user || "Cliente";
}

export function buildCustomerOrderEmail(
  orderId: number,
  total: unknown,
  customerEmail: string,
  row: RowDataPacket
): { subject: string; text: string; html: string } {
  const name = escapeHtml(customerDisplayName(row));
  const email = escapeHtml(customerEmail);
  const totalStr = escapeHtml(formatOrderTotal(total));
  const id = String(orderId);

  const text = [
    `Hola ${customerDisplayName(row)},`,
    "",
    "Confirmamos tu pedido en ProFruit.",
    "",
    `Pedido: #${orderId}`,
    `Total: $${formatOrderTotal(total)} COP`,
    `Correo: ${customerEmail}`,
    "",
    "Pronto te enviaremos novedades sobre el envío.",
    "",
    "Gracias,",
    "Equipo ProFruit",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pedido confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f2;font-family:Segoe UI,Arial,sans-serif;color:#1a2e1f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8e6d9;">
          <tr>
            <td style="background:#12481c;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">ProFruit</p>
              <p style="margin:8px 0 0;font-size:13px;color:#c8e6c9;">Tu pedido fue confirmado</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hola <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3d5243;">
                Recibimos y validamos tu compra. Te avisaremos cuando tengamos novedades del envío.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f9f4;border-radius:12px;border:1px solid #e0ede1;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#5c7362;font-weight:600;">Resumen</p>
                    <p style="margin:0 0 8px;font-size:15px;"><span style="color:#5c7362;">Pedido</span> &nbsp; <strong>#${id}</strong></p>
                    <p style="margin:0 0 8px;font-size:15px;"><span style="color:#5c7362;">Total</span> &nbsp; <strong>$${totalStr} COP</strong></p>
                    <p style="margin:0;font-size:15px;"><span style="color:#5c7362;">Correo</span> &nbsp; <strong>${email}</strong></p>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#5c7362;">
                Si no reconoces este pedido, contáctanos respondiendo a este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafcfa;border-top:1px solid #e8f0e9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a8f80;">Equipo ProFruit · Campo a tu mesa</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `ProFruit — Pedido #${orderId} confirmado`,
    text,
    html,
  };
}

export function buildAdminOrderEmail(
  orderId: number,
  total: unknown,
  customerEmail: string,
  row: RowDataPacket
): { subject: string; text: string } {
  const name = customerDisplayName(row);
  const text = [
    "Nuevo pedido pagado en ProFruit.",
    "",
    `Pedido: #${orderId}`,
    `Total: $${formatOrderTotal(total)} COP`,
    `Cliente: ${name}`,
    `Correo: ${customerEmail}`,
  ].join("\n");

  return {
    subject: `ProFruit — Nuevo pago #${orderId}`,
    text,
  };
}

// ─── Base layout ─────────────────────────────────────────────────────────────

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #F8F7F5; font-family: Arial, Helvetica, sans-serif; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; display: block; }
    .wrapper { width: 100%; background-color: #F8F7F5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
    .header { background-color: #0A0A0A; padding: 32px 40px; text-align: center; }
    .header-brand { color: #FFFFFF; font-size: 22px; font-weight: bold; letter-spacing: 6px; text-decoration: none; }
    .header-tagline { color: #B8960C; font-size: 11px; letter-spacing: 3px; margin-top: 6px; }
    .body { padding: 48px 40px; }
    .body h1 { color: #0A0A0A; font-size: 26px; font-weight: bold; margin: 0 0 16px; letter-spacing: 1px; }
    .body p { color: #2D2D2D; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .divider { border: none; border-top: 1px solid #DDDDDD; margin: 32px 0; }
    .cta-wrapper { text-align: center; margin: 32px 0; }
    .cta { display: inline-block; background-color: #0A0A0A; color: #FFFFFF; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-decoration: none; padding: 16px 36px; border: 1px solid #0A0A0A; }
    .cta:hover { background-color: #B8960C; border-color: #B8960C; }
    .highlight { color: #B8960C; font-weight: bold; }
    .footer { background-color: #0A0A0A; padding: 32px 40px; text-align: center; }
    .footer p { color: #6B6B6B; font-size: 12px; line-height: 1.6; margin: 0 0 8px; }
    .footer a { color: #B8960C; text-decoration: none; }
    .unsubscribe { margin-top: 16px; }
    @media (max-width: 600px) {
      .body { padding: 32px 24px; }
      .header { padding: 24px; }
      .footer { padding: 24px; }
    }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;&#8204;&nbsp;</span>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-brand">${process.env.BRAND_NAME ?? "LEATHER CO."}</div>
        <div class="header-tagline">PREMIUM LEATHER GOODS</div>
      </div>
      ${content}
      <div class="footer">
        <p>${process.env.BRAND_NAME ?? "Leather E-Commerce"} · Pakistan</p>
        <p>
          <a href="${process.env.FRONTEND_URL ?? "#"}">Visit our store</a>
          &nbsp;·&nbsp;
          <a href="${process.env.FRONTEND_URL ?? "#"}/account">My Account</a>
          &nbsp;·&nbsp;
          <a href="mailto:${process.env.SUPPORT_EMAIL ?? "support@yourdomain.com"}">Contact Us</a>
        </p>
        <p class="unsubscribe">
          You received this email because you created an account with us.<br/>
          <a href="${process.env.FRONTEND_URL ?? "#"}/account/profile">Manage email preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export function welcomeEmail(opts: { name: string; email: string }): {
  subject: string;
  html: string;
} {
  const subject = `Welcome to ${process.env.BRAND_NAME ?? "Leather Co."}, ${opts.name.split(" ")[0]}`;

  const html = baseLayout(
    `<div class="body">
      <h1>Welcome, ${opts.name.split(" ")[0]}.</h1>
      <p>
        Thank you for creating an account with us. You now have access to your personal account
        where you can track orders, manage your addresses, and shop our full collection of
        premium leather goods.
      </p>
      <hr class="divider" />
      <p>
        We craft each piece with the same care our artisans have brought to leather since
        the early 1900s. Whether it's your first purchase or your tenth, we're glad you're here.
      </p>
      <div class="cta-wrapper">
        <a class="cta" href="${process.env.FRONTEND_URL ?? "#"}/products">EXPLORE THE COLLECTION</a>
      </div>
      <hr class="divider" />
      <p style="font-size:13px;color:#6B6B6B;">
        Registered with: <span class="highlight">${opts.email}</span><br/>
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>`,
    `Welcome to ${process.env.BRAND_NAME ?? "Leather Co."}`,
  );

  return { subject, html };
}

// ─── Order confirmation email ─────────────────────────────────────────────────

export function orderConfirmationEmail(opts: {
  name: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    color?: string | null;
    size?: string | null;
    image?: string;
  }[];
}): { subject: string; html: string } {
  const subject = `Order Confirmed — ${opts.orderId.slice(0, 8).toUpperCase()}`;

  const itemRows = opts.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #DDDDDD;">
          <strong style="color:#0A0A0A;">${item.name}</strong>
          ${item.color ? `<br/><span style="font-size:13px;color:#6B6B6B;">Colour: ${item.color}${item.size ? ` / ${item.size}` : ""}</span>` : ""}
          <br/><span style="font-size:13px;color:#6B6B6B;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #DDDDDD;text-align:right;color:#B8960C;font-weight:bold;">
          RS. ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>`,
    )
    .join("");

  const html = baseLayout(
    `<div class="body">
      <h1>Order Confirmed.</h1>
      <p>
        Thank you, ${opts.name.split(" ")[0]}. We've received your order and it's being prepared.
        You'll receive another email when it ships.
      </p>
      <hr class="divider" />
      <p style="font-size:13px;color:#6B6B6B;margin-bottom:8px;">ORDER REFERENCE</p>
      <p style="font-size:18px;font-weight:bold;color:#0A0A0A;letter-spacing:2px;margin-bottom:24px;">
        ${opts.orderId.slice(0, 8).toUpperCase()}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:16px 0;font-weight:bold;color:#0A0A0A;">Total</td>
            <td style="padding:16px 0;text-align:right;font-size:20px;font-weight:bold;color:#B8960C;">
              RS. ${opts.totalAmount.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
      <p style="font-size:13px;color:#6B6B6B;">
        Payment method: <strong>${
          opts.paymentMethod === "cod"
            ? "Cash on Delivery"
            : opts.paymentMethod === "jazzcash"
              ? "JazzCash"
              : opts.paymentMethod === "easypaisa"
                ? "Easypaisa"
                : "PayFast"
        }</strong>
      </p>
      <div class="cta-wrapper">
        <a class="cta" href="${process.env.FRONTEND_URL ?? "#"}/account/orders">VIEW ORDER</a>
      </div>
    </div>`,
    `Your order has been confirmed`,
  );

  return { subject, html };
}

// ─── Newsletter promotional email ─────────────────────────────────────────────

export function newsletterEmail(opts: {
  name: string;
  subject: string;
  heading: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const html = baseLayout(
    `<div class="body">
      <h1>${opts.heading}</h1>
      <p>${opts.body}</p>
      <div class="cta-wrapper">
        <a class="cta" href="${opts.ctaUrl}">${opts.ctaText}</a>
      </div>
    </div>`,
    opts.subject,
  );

  // Replace the generic unsubscribe link with the personalised one
  return {
    subject: opts.subject,
    html: html.replace(
      `${process.env.FRONTEND_URL ?? "#"}/account/profile`,
      opts.unsubscribeUrl,
    ),
  };
}

// pages/api/qrcode.js
// Generates a QR code image (PNG) for a given join link.
// Usage: /api/qrcode?code=AB12CD

const QRCode = require("qrcode");

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  // Build the full join URL using the request's own host,
  // so it works both on localhost and once deployed.
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const joinUrl = `${protocol}://${host}/join/${code}`;

  try {
    const buffer = await QRCode.toBuffer(joinUrl, { width: 240 });
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate QR code");
  }
}

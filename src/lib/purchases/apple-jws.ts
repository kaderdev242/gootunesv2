import { X509Certificate, createVerify } from "crypto";
import { logServerError } from "@/lib/errors";

export type AppleTransactionPayload = {
  transactionId: string;
  originalTransactionId?: string;
  bundleId: string;
  productId: string;
  purchaseDate?: number;
  environment?: string;
  inAppOwnershipType?: string;
  type?: string;
};

function b64urlToBuf(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/** Convertit une signature JWS ECDSA raw (r||s) en DER pour Node verify. */
function joseEcdsaToDer(raw: Buffer) {
  const half = raw.length / 2;
  let r = raw.subarray(0, half);
  let s = raw.subarray(half);
  while (r.length > 1 && r[0] === 0) r = r.subarray(1);
  while (s.length > 1 && s[0] === 0) s = s.subarray(1);
  if (r[0] & 0x80) r = Buffer.concat([Buffer.from([0]), r]);
  if (s[0] & 0x80) s = Buffer.concat([Buffer.from([0]), s]);
  const seq = Buffer.concat([
    Buffer.from([0x02, r.length]),
    r,
    Buffer.from([0x02, s.length]),
    s,
  ]);
  return Buffer.concat([Buffer.from([0x30, seq.length]), seq]);
}

/**
 * Vérifie un JWS StoreKit 2 (x5c + ES256).
 * La chaîne x5c Apple est exigée ; on contrôle que le CN feuille mentionne Apple.
 */
export async function verifyAppleTransactionJws(
  jws: string,
): Promise<AppleTransactionPayload | null> {
  try {
    const parts = jws.split(".");
    if (parts.length !== 3) return null;
    const [hB64, pB64, sB64] = parts;
    const header = JSON.parse(b64urlToBuf(hB64).toString("utf8")) as {
      alg?: string;
      x5c?: string[];
    };
    if (header.alg !== "ES256" || !header.x5c?.[0]) return null;

    const leafDer = Buffer.from(header.x5c[0], "base64");
    const leaf = new X509Certificate(leafDer);
    const subject = leaf.subject.toLowerCase();
    if (!subject.includes("apple") && !leaf.issuer.toLowerCase().includes("apple")) {
      logServerError("apple.jws.cert", new Error("Certificat non Apple"), {
        subject: leaf.subject,
      });
      return null;
    }

    const signed = Buffer.from(`${hB64}.${pB64}`);
    const derSig = joseEcdsaToDer(b64urlToBuf(sB64));
    const verify = createVerify("SHA256");
    verify.update(signed);
    verify.end();
    const ok = verify.verify(leaf.publicKey, derSig);
    if (!ok) return null;

    const payload = JSON.parse(
      b64urlToBuf(pB64).toString("utf8"),
    ) as AppleTransactionPayload;
    if (!payload.transactionId || !payload.productId || !payload.bundleId) {
      return null;
    }
    return payload;
  } catch (e) {
    logServerError("apple.jws.verify", e);
    return null;
  }
}

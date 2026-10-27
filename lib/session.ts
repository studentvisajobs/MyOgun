import { SignJWT, jwtVerify } from "jose";

const ISSUER = "myogun";
const AUDIENCE = "myogun-users";

function getSessionKey(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured");
  }

  const key = Buffer.from(secret, "base64");

  if (key.length !== 32) {
    throw new Error("AUTH_SESSION_SECRET must be 256 bits");
  }

  return new Uint8Array(key);
}

export async function createSessionToken(
  userId: string
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSessionKey());
}

export async function verifySessionToken(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSessionKey(),
      {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: AUDIENCE,
      }
    );

    return typeof payload.sub === "string"
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

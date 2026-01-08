import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = "secret-key-para-demo-cambiar-en-prod";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession() {
  // --- CORRECCIÓN NEXT.JS 15/16: Esperar la cookie ---
  const sessionCookie = (await cookies()).get("session");
  const session = sessionCookie?.value;
  // ---------------------------------------------------
  
  if (!session) return null;
  return await decrypt(session);
}
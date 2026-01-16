'use server'

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await compare(password, user.password))) return { error: "Credenciales inválidas" };
  if (!user.isActive) return { error: "Usuario desactivado." };

  const sessionData = {
    user: { id: user.id, email: user.email, name: user.firstName, role: user.role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const token = await encrypt(sessionData);
  (await cookies()).set("session", token, { expires: sessionData.expires, httpOnly: true, sameSite: "lax" });

  if (user.role === 'ADMIN') redirect("/admin/dashboard");
  else if (user.role === 'CORREDOR') redirect("/corredor/dashboard");
  else redirect("/login");
}

export async function logout() {
  await registrarLog("LOGOUT", "Cierre de sesión", "SISTEMA");
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}
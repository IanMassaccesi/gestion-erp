'use server'

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log(`🔒 INTENTO DE LOGIN: ${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await compare(password, user.password))) {
    console.log("❌ Credenciales inválidas");
    return { error: "Credenciales inválidas" };
  }

  if (!user.isActive) {
    return { error: "Usuario desactivado." };
  }

  console.log(`✅ LOGIN EXITOSO. Rol en BD: ${user.role}`);

  const sessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.firstName,
      role: user.role
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const token = await encrypt(sessionData);

  (await cookies()).set("session", token, {
    expires: sessionData.expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // REDIRECCIÓN EXPLÍCITA
  if (user.role === 'ADMIN') {
    console.log("↪ Redirigiendo a ADMIN Dashboard");
    redirect("/admin/dashboard");
  } else if (user.role === 'CORREDOR') {
    console.log("↪ Redirigiendo a CORREDOR Dashboard");
    redirect("/corredor/dashboard");
  } else {
    // Si el rol es raro o nulo, por seguridad al home o login
    console.log("⚠ Rol desconocido, redirigiendo a login");
    redirect("/login");
  }
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}
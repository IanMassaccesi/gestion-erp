const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. LOGIN CON DIAGNÓSTICO ---
  'src/actions/auth-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log(\`🔒 INTENTO DE LOGIN: \${email}\`);

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await compare(password, user.password))) {
    console.log("❌ Credenciales inválidas");
    return { error: "Credenciales inválidas" };
  }

  if (!user.isActive) {
    return { error: "Usuario desactivado." };
  }

  console.log(\`✅ LOGIN EXITOSO. Rol en BD: \${user.role}\`);

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
}`,

  // --- 2. MIDDLEWARE BLINDADO (Si falla, bloquea) ---
  'src/middleware.ts': `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const currentPath = request.nextUrl.pathname;

  // 1. RUTAS PÚBLICAS (Login y estáticos no se tocan)
  if (currentPath.startsWith("/login") || currentPath.startsWith("/_next")) {
    // Pero si ya tiene sesión y quiere ir a login, lo mandamos a su casa
    if (session && currentPath.startsWith("/login")) {
      try {
        const payload = await decrypt(session);
        const role = payload.user.role;
        return NextResponse.redirect(new URL(role === 'ADMIN' ? "/admin/dashboard" : "/corredor/dashboard", request.url));
      } catch (e) {
        // Si el token es inválido, dejamos que entre al login para arreglarlo
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. RUTAS PROTEGIDAS (/admin y /corredor)
  // Si no hay sesión, BLOQUEAR y mandar a login
  if (!session) {
    if (currentPath.startsWith("/admin") || currentPath.startsWith("/corredor")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. VALIDACIÓN DE ROL
  try {
    const payload = await decrypt(session);
    const role = payload.user.role;
    
    // CASO A: Corredor intentando entrar a Admin -> BLOQUEAR
    if (role === 'CORREDOR' && currentPath.startsWith("/admin")) {
      console.log(\`⛔ ACCESO DENEGADO: Corredor intentando entrar a \${currentPath}\`);
      return NextResponse.redirect(new URL("/corredor/dashboard", request.url));
    }

    // CASO B: Admin entrando a Corredor -> PERMITIR (Modo Dios) o Redirigir según prefieras
    // Por ahora lo dejamos pasar para que puedas probar la vista móvil

    return NextResponse.next();

  } catch (error) {
    // SI ALGO FALLA EN LA VERIFICACIÓN (Token corrupto, error de librería)
    // SEGURIDAD: Mejor bloquear que lamentar.
    console.error("⚠ Error de sesión en middleware:", error);
    
    // Borramos la cookie corrupta (opcional, pero buena práctica redirigir a login)
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/corredor/:path*", "/login"],
};`
};

function createFiles() {
  console.log('🚀 Aplicando PARCHE DE SEGURIDAD (Login + Middleware)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
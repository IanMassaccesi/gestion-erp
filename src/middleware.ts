import { NextResponse } from "next/server";
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
      console.log(`⛔ ACCESO DENEGADO: Corredor intentando entrar a ${currentPath}`);
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
};
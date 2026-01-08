const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. LIBRERÍA DE TOKENS (JWT) ---
  'src/lib/auth.ts': `import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = "secret-key-para-demo-cambiar-en-prod";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // La sesión dura 24 horas
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}`,

  // --- 2. SERVER ACTION (LOGIN & LOGOUT) ---
  'src/actions/auth-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Buscar usuario
  const user = await prisma.user.findUnique({ where: { email } });
  
  // 2. Validar contraseña
  if (!user || !(await compare(password, user.password))) {
    return { error: "Credenciales inválidas" };
  }

  if (!user.isActive) {
    return { error: "Usuario desactivado. Contacte al admin." };
  }

  // 3. Crear sesión
  const sessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.firstName,
      role: user.role
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 día
  };

  const token = await encrypt(sessionData);

  cookies().set("session", token, {
    expires: sessionData.expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // 4. Redirigir según rol
  if (user.role === 'ADMIN') {
    redirect("/admin/dashboard");
  } else {
    // Por ahora los choferes también van al dashboard, luego les haremos su panel
    redirect("/admin/dashboard"); 
  }
}

export async function logout() {
  cookies().set("session", "", { expires: new Date(0) });
  redirect("/login");
}`,

  // --- 3. PANTALLA DE LOGIN (Estética Azul) ---
  'src/app/login/page.tsx': `'use client'
import { login } from "@/actions/auth-actions";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Truck } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-brand-light rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-accent rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-brand-primary rounded-full shadow-lg mb-4 text-white">
            <Truck size={32} />
          </div>
          <h1 className="text-3xl font-bold font-heading text-white">Bienvenido</h1>
          <p className="text-gray-300 mt-2">Sistema de Gestión ERP</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Corporativo</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-gray-400"><Mail size={20} /></span>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-light outline-none transition-all"
                placeholder="usuario@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-gray-400"><Lock size={20} /></span>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-light outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-light hover:bg-brand-accent text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/50 transition-all flex justify-center items-center gap-2 group"
          >
            {loading ? "Ingresando..." : <>Iniciar Sesión <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          © 2026 TodoKiosco Gestión
        </div>
      </div>
    </div>
  );
}`,

  // --- 4. MIDDLEWARE (EL PORTERO) ---
  'src/middleware.ts': `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // 1. Obtener la cookie de sesión
  const session = request.cookies.get("session")?.value;

  // 2. Si NO hay sesión y trata de entrar a /admin, lo mandamos al login
  if (!session && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Si YA hay sesión y trata de entrar al login, lo mandamos al dashboard
  if (session && request.nextUrl.pathname.startsWith("/login")) {
    try {
       await decrypt(session); // Validamos que no sea una cookie falsa
       return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } catch (e) {
       // Si falla la validación (token expirado), dejamos que entre al login para que se reloguee
       return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};`,

  // --- 5. ACTUALIZAR SIDEBAR (LOGOUT FUNCIONAL) ---
  'src/components/layout/Sidebar.tsx': `'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, LogOut, Contact } from 'lucide-react';
import { logout } from '@/actions/auth-actions';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Choferes', href: '/admin/choferes', icon: Contact },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-brand-dark text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-brand-primary">
        <h1 className="text-2xl font-bold font-heading text-brand-teal">GESTIÓN</h1>
        <p className="text-xs text-gray-400 mt-1">Panel Administrativo</p>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}\`}>
              <Icon size={20} className={isActive ? 'text-brand-light' : 'text-gray-400 group-hover:text-white'} />
              <span className="font-medium font-heading">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-brand-primary">
        <button 
          onClick={() => logout()} 
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}`
};

function createFiles() {
  console.log('🚀 Implementando Sistema de Login y Seguridad...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. CONFIGURACIÓN BASE (Tailwind & Globals)
  // ==========================================
  'tailwind.config.ts': `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#020617',    // Fondo Principal (Slate 950)
          card: '#0f172a',    // Tarjetas (Slate 900) - Más suave que el fondo
          border: '#1e293b',  // Bordes (Slate 800)
          input: '#1e293b',   // Inputs de formulario
          
          primary: '#22d3ee', // Cyan Neon (Acción Principal)
          accent: '#d946ef',  // Fuchsia Neon (Destacados)
          success: '#22c55e', // Verde Matrix
          warning: '#fb923c', // Naranja Alerta
          
          text: '#f8fafc',    // Blanco Hielo (Texto Principal)
          muted: '#94a3b8',   // Gris Azulado (Texto Secundario)
          
          // Compatibilidad con código viejo (mapeamos a los nuevos)
          teal: '#22d3ee',    
          light: '#f8fafc',
        }
      },
      fontFamily: {
        heading: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(34, 211, 238, 0.2)',
        'neon-hover': '0 0 20px rgba(34, 211, 238, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;`,

  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 248, 250, 252;
  --background-start-rgb: 2, 6, 23;
  --background-end-rgb: 2, 6, 23;
}

body {
  color: rgb(var(--foreground-rgb));
  background: #020617; /* Fondo Slate 950 Sólido para evitar saltos */
}

/* Scrollbar estilo Hacker */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #020617;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 5px;
  border: 2px solid #020617;
}
::-webkit-scrollbar-thumb:hover {
  background: #22d3ee;
}

/* Inputs oscuros globales */
input, select, textarea {
  color-scheme: dark;
}`,

  'src/app/layout.tsx': `import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Todo Kiosco | Tech Dashboard",
  description: "Sistema de gestión comercial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={\`\${outfit.variable} \${inter.variable} font-sans bg-brand-dark text-brand-text antialiased selection:bg-brand-primary selection:text-brand-dark\`}>
        {children}
      </body>
    </html>
  );
}`,

  // ==========================================
  // 2. LAYOUTS Y NAVEGACIÓN (Dark Mode)
  // ==========================================
  
  // LOGIN PAGE
  'src/app/login/page.tsx': `'use client'
import { login } from "@/actions/auth-actions";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Zap } from "lucide-react";

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
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-[100px]"></div>

      <div className="bg-brand-card/50 backdrop-blur-xl p-8 md:p-12 rounded-2xl border border-brand-border shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-brand-dark border border-brand-primary/30 rounded-full shadow-neon mb-4 text-brand-primary">
            <Zap size={32} />
          </div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Todo<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Kiosco</span></h1>
          <p className="text-brand-muted mt-2">Acceso al Sistema</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text ml-1">Email</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-brand-muted group-focus-within:text-brand-primary transition-colors"><Mail size={20} /></span>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-brand-input border border-brand-border rounded-xl text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                placeholder="usuario@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-text ml-1">Contraseña</label>
            <div className="relative group">
              <span className="absolute left-3 top-3.5 text-brand-muted group-focus-within:text-brand-primary transition-colors"><Lock size={20} /></span>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-brand-input border border-brand-border rounded-xl text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-primary to-blue-600 hover:to-blue-500 text-brand-dark font-bold py-3.5 rounded-xl shadow-neon transition-all flex justify-center items-center gap-2 group active:scale-95"
          >
            {loading ? "Iniciando..." : <>Ingresar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}`,

  // SIDEBAR & ADMIN LAYOUT CLIENT
  'src/components/layout/AdminLayoutClient.tsx': `'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Truck, Briefcase, Menu, X, LogOut 
} from "lucide-react";
import { logout } from "@/actions/auth-actions";

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Equipo', href: '/admin/equipo', icon: Briefcase },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-dark flex font-sans">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={\`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border text-brand-text shadow-2xl transform transition-transform duration-300 ease-in-out
        \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-auto
      \`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-brand-border flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">GESTIÓN</h1>
              <p className="text-xs text-brand-muted">Panel Administrativo</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-brand-muted hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-neon' : 'text-brand-muted hover:bg-brand-dark hover:text-white'}\`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-brand-muted group-hover:text-white'} />
                  <span className="font-medium font-heading">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-border">
            <button 
              onClick={async () => await logout()} 
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-brand-muted hover:text-red-400 hover:bg-brand-dark rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="bg-brand-card border-b border-brand-border text-white p-4 flex items-center gap-4 md:hidden sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={28} className="text-brand-primary" />
          </button>
          <h1 className="font-bold font-heading text-lg">Panel de Control</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINAS PRINCIPALES (Estética Dark)
  // ==========================================

  // DASHBOARD
  'src/app/admin/dashboard/page.tsx': `import { prisma } from "@/lib/prisma";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const [totalOrders, totalProducts, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.order.aggregate({ _sum: { total: true } })
  ]);

  const revenue = totalRevenue._sum.total || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-heading text-white">Dashboard</h1>
        <p className="text-brand-muted">Visión general del negocio</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-primary">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Ventas Totales</p>
              <h3 className="text-2xl font-bold text-white font-heading">\$\${revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-accent/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-accent">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Pedidos</p>
              <h3 className="text-2xl font-bold text-white font-heading">{totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-warning/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-warning/5 rounded-full blur-2xl group-hover:bg-brand-warning/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-warning">
              <Package size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Productos</p>
              <h3 className="text-2xl font-bold text-white font-heading">{totalProducts}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  // LISTADO CLIENTES (Tabla Dark)
  'src/app/admin/clientes/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { deleteClient } from "@/actions/clients-actions";

export default async function ClientesPage() {
  const clients = await prisma.customer.findMany({ 
    where: { isDeleted: false }, 
    orderBy: { createdAt: 'desc' },
    include: { createdBy: true } 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">Clientes</h1>
          <p className="text-brand-muted">Base de datos de compradores</p>
        </div>
        <Link href="/admin/clientes/nuevo" className="bg-brand-primary hover:bg-cyan-400 text-brand-dark px-4 py-2 rounded-lg flex gap-2 font-bold shadow-neon transition-all">
          <Plus size={20} /> Nuevo
        </Link>
      </div>

      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-brand-text">
          <thead className="bg-brand-dark text-brand-muted font-heading font-semibold uppercase tracking-wider text-xs border-b border-brand-border">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Vendedor</th>
              <th className="p-4">DNI/CUIT</th>
              <th className="p-4">Dirección</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-brand-border/30 transition-colors">
                <td className="p-4 font-medium text-white">{c.firstName} {c.lastName}</td>
                <td className="p-4">
                  {c.createdBy ? (
                    <span className="flex items-center gap-1 text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded w-fit border border-brand-primary/20">
                       <User size={12} /> {c.createdBy.firstName}
                    </span>
                  ) : (
                    <span className="text-xs text-brand-muted">Sistema</span>
                  )}
                </td>
                <td className="p-4 text-brand-muted font-mono">{c.dniCuit}</td>
                <td className="p-4 text-brand-muted">{c.address}</td>
                <td className="p-4 flex justify-end gap-2">
                  <Link href={\`/admin/clientes/\${c.id}\`} className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded transition-colors"><Edit size={16} /></Link>
                  <form action={async () => { 'use server'; await deleteClient(c.id); }}>
                    <button className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"><Trash2 size={16} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

  // FORMULARIO CLIENTE (Cards Dark)
  'src/app/admin/clientes/nuevo/page.tsx': `import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClientePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="p-2 hover:bg-brand-card rounded-full transition-colors text-brand-muted">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Nuevo Cliente</h1>
        </div>
      </div>

      <form 
        action={async (formData) => { 'use server'; await createClient(formData); }} 
        className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6"
      >
        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Nombre *</label>
                <input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Ej: Juan" />
            </div>
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Apellido *</label>
                <input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Ej: Perez" />
            </div>
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">DNI / CUIT *</label>
            <input name="dniCuit" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Sin guiones" />
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Teléfono</label>
                <input name="phone" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="WhatsApp" />
            </div>
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Email</label>
                <input name="email" type="email" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Opcional" />
            </div>
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">Dirección *</label>
            <input name="address" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Calle y Altura" />
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">Tipo de Cliente *</label>
            <select name="type" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none">
                <option value="FINAL">Consumidor Final</option>
                <option value="MINORISTA">Minorista</option>
                <option value="MAYORISTA">Mayorista</option>
            </select>
        </div>

        <input type="hidden" name="origin" value="admin" />

        <div className="pt-4">
            <button type="submit" className="w-full bg-brand-primary hover:bg-cyan-400 text-brand-dark px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-neon">
                <Save size={20} /> Guardar Cliente
            </button>
        </div>
      </form>
    </div>
  );
}`,
};

function createFiles() {
  console.log('🚀 INYECTANDO ESTÉTICA CYBERPUNK (Dark Mode Total)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Estilizado: ${filePath}`);
  }
}
createFiles();
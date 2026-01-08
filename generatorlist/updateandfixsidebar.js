const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. NUEVO COMPONENTE: ADMIN LAYOUT (Client Side)
  // Maneja el estado del Menú Hamburguesa
  // ==========================================
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

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* --- SIDEBAR MÓVIL (Overlay + Menu) --- */}
      {/* 1. Fondo Oscuro (Overlay) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* 2. El Menú Deslizante */}
      <aside className={\`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark text-white shadow-2xl transform transition-transform duration-300 ease-in-out
        \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-auto
      \`}>
        <div className="flex flex-col h-full">
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-brand-primary flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-heading text-brand-teal">GESTIÓN</h1>
              <p className="text-xs text-gray-400">Panel Administrativo</p>
            </div>
            {/* Botón Cerrar (Solo móvil) */}
            <button onClick={closeSidebar} className="md:hidden text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={closeSidebar} // Cierra el menú al hacer click en móvil
                  className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}\`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-light' : 'text-gray-400 group-hover:text-white'} />
                  <span className="font-medium font-heading">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Sidebar (Logout) */}
          <div className="p-4 border-t border-brand-primary">
            <button 
              onClick={async () => await logout()} 
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-white/5 hover:text-red-200 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        
        {/* Header Móvil (Solo visible en pantallas chicas) */}
        <header className="bg-brand-primary text-white p-4 flex items-center gap-4 md:hidden shadow-md sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={28} />
          </button>
          <h1 className="font-bold text-lg">Panel de Control</h1>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 2. ACTUALIZAR ADMIN LAYOUT (Server)
  // Para usar el nuevo componente cliente
  // ==========================================
  'src/app/admin/layout.tsx': `import AdminLayoutClient from "@/components/layout/AdminLayoutClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}`,

  // ==========================================
  // 3. ACTUALIZAR CORREDOR LAYOUT
  // Logout más robusto y visible
  // ==========================================
  'src/app/corredor/layout.tsx': `import { LogOut, Menu } from "lucide-react";
import { logout } from "@/actions/auth-actions";
import Link from "next/link";

export default function CorredorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Móvil Fijo */}
      <header className="bg-brand-primary text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Logo o Icono */}
          <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary font-bold">
            T
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight">TuEmpresa</h1>
            <p className="text-[10px] text-brand-light opacity-90">App Corredores</p>
          </div>
        </div>
        
        {/* BOTÓN LOGOUT MEJORADO */}
        <form action={logout}>
          <button 
            type="submit"
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-2 rounded-lg transition-colors text-xs font-bold border border-red-500/20"
          >
            <LogOut size={16} />
            Salir
          </button>
        </form>
      </header>
      
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <Link href="/corredor/dashboard" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>
        <Link href="/corredor/pedidos" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🛒</span>
          <span className="text-[10px] font-bold">Vender</span>
        </Link>
        <Link href="/corredor/rutas" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🚚</span>
          <span className="text-[10px] font-bold">Rutas</span>
        </Link>
      </nav>
    </div>
  );
}`,

  // ==========================================
  // 4. LIMPIEZA (El Sidebar viejo ya no se usa directo)
  // Pero lo dejamos o lo borramos, el nuevo AdminLayoutClient lo reemplaza.
  // ==========================================
};

function createFiles() {
  console.log('🚀 Actualizando LAYOUTS: Hamburguesa Admin + Logout Corredor...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
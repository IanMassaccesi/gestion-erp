'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Truck, Briefcase, Menu, X, LogOut, Container,
  DollarSign, PieChart
} from "lucide-react";
import { logout } from "@/actions/auth-actions";

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Estadísticas', href: '/admin/estadisticas', icon: PieChart }, // <--- NUEVO
  { name: 'Caja Diaria', href: '/admin/caja', icon: DollarSign },        // <--- NUEVO
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Envíos', href: '/admin/envios', icon: Container },
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
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border text-brand-text shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-auto
      `}>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-neon' : 'text-brand-muted hover:bg-brand-dark hover:text-white'}`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-brand-muted group-hover:text-white'} />
                  <span className="font-medium font-heading">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-border">
            <button onClick={async () => await logout()} className="flex items-center gap-3 px-4 py-3 w-full text-left text-brand-muted hover:text-red-400 hover:bg-brand-dark rounded-lg transition-colors">
              <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="bg-brand-card border-b border-brand-border text-white p-4 flex items-center gap-4 md:hidden sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)}><Menu size={28} className="text-brand-primary" /></button>
          <h1 className="font-bold font-heading text-lg">Panel de Control</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
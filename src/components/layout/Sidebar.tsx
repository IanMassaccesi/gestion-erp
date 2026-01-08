'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, LogOut, Briefcase } from 'lucide-react';
import { logout } from '@/actions/auth-actions';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Equipo', href: '/admin/equipo', icon: Briefcase }, // <-- CAMBIO AQUÍ
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-brand-primary text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={20} className={isActive ? 'text-brand-light' : 'text-gray-400 group-hover:text-white'} />
              <span className="font-medium font-heading">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-brand-primary">
        <button onClick={() => logout()} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-white/5 rounded-lg transition-colors">
          <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SIDEBAR COMPLETO (Aseguramos todos los items)
  // ==========================================
  'src/components/layout/AdminLayoutClient.tsx': `'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Truck, Briefcase, Menu, X, LogOut, Container 
} from "lucide-react";
import { logout } from "@/actions/auth-actions";

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart }, // <--- Aquí está Pedidos
  { name: 'Envíos', href: '/admin/envios', icon: Container },      // <--- Nuevo Módulo
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
}`,

  // ==========================================
  // 2. DASHBOARD CORREDOR (Con botón Envíos)
  // ==========================================
  'src/app/corredor/dashboard/page.tsx': `import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ShoppingCart, Truck, UserPlus, PackageSearch } from "lucide-react";

export default async function CorredorDashboard() {
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return <div>Error</div>;

  return (
    <div className="space-y-6">
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold font-heading relative z-10">Hola, {user.firstName}</h2>
        <p className="text-brand-muted text-sm relative z-10">Panel de Corredor</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* VENDEDOR */}
        {user.isRunner && (
          <>
            <Link href="/corredor/pedidos" className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28 shadow-lg">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full"><ShoppingCart size={24} /></div>
                <span className="font-bold text-white text-xs text-center">Nueva Venta</span>
            </Link>
            <Link href="/corredor/clientes/nuevo" className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28 shadow-lg">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-full"><UserPlus size={24} /></div>
                <span className="font-bold text-white text-xs text-center">Crear Cliente</span>
            </Link>
            
            {/* NUEVO BOTÓN: MIS ENVÍOS */}
            <Link href="/corredor/envios" className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28 shadow-lg col-span-2">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-full"><PackageSearch size={24} /></div>
                <span className="font-bold text-white text-xs text-center">Seguimiento de Mis Envíos</span>
            </Link>
          </>
        )}

        {/* CHOFER */}
        {user.isDriver && (
          <Link href="/corredor/rutas" className="bg-brand-card p-4 rounded-2xl border border-brand-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28 col-span-2 shadow-lg">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-full"><Truck size={24} /></div>
            <span className="font-bold text-white text-xs text-center">Mis Rutas de Entrega</span>
          </Link>
        )}
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. PAGINA "MIS ENVÍOS" (Para el corredor)
  // ==========================================
  'src/app/corredor/envios/page.tsx': `import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Box, ExternalLink } from "lucide-react";

export default async function MisEnviosPage() {
  const session = await getSession();
  
  // Buscar envíos de pedidos generados por ESTE usuario
  const shipments = await prisma.shipment.findMany({
    where: {
      order: {
        userId: session.user.id // Filtramos por el creador del pedido
      }
    },
    include: {
      order: { include: { customer: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6 bg-brand-card p-4 sticky top-0 z-10 border-b border-brand-border shadow-lg">
        <Link href="/corredor/dashboard" className="p-2 hover:bg-brand-dark rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold font-heading text-white">Mis Envíos</h1>
      </div>

      <div className="px-4 space-y-4">
        {shipments.length === 0 ? (
          <div className="text-center text-brand-muted py-10">No tienes envíos activos.</div>
        ) : (
          shipments.map(shipment => (
            <div key={shipment.id} className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-white text-lg">{shipment.trackingCode}</p>
                  <p className="text-xs text-brand-muted">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${shipment.status === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}\`}>
                  {shipment.status}
                </span>
              </div>
              
              <div className="bg-brand-dark/50 p-3 rounded-lg mb-3">
                <p className="text-sm text-brand-primary font-bold">{shipment.order.customer.firstName} {shipment.order.customer.lastName}</p>
                <p className="text-xs text-brand-muted truncate">{shipment.order.shippingAddress || "Retiro en sucursal"}</p>
              </div>

              {/* Enlace simulado de seguimiento público */}
              <div className="flex justify-end">
                 <button className="text-xs flex items-center gap-1 text-brand-accent hover:underline">
                    Ver Tracking Web <ExternalLink size={12}/>
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Actualizando UI: Sidebar Admin + Mis Envíos Corredor...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
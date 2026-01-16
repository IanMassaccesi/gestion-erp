import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Truck, Calendar } from "lucide-react";

export default async function RutasPage() {
  const routes = await prisma.deliveryRoute.findMany({
    orderBy: { createdAt: 'desc' },
    include: { driver: true, _count: { select: { orders: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold font-heading text-white">Rutas de Entrega</h1><p className="text-brand-muted">Logística y despachos</p></div>
        <Link href="/admin/rutas/nueva" className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-neon"><Plus size={20} /> Nueva Ruta</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => (
          <Link key={route.id} href={`/admin/rutas/${route.id}`} className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border hover:border-brand-primary transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-dark rounded-lg text-brand-primary group-hover:text-white transition-colors"><Truck size={24} /></div>
              <span className={`px-3 py-1 rounded text-xs font-bold ${route.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{route.status}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{route.routeNumber || "Sin Nombre"}</h3>
            <div className="text-sm text-brand-muted space-y-1">
              <p className="flex items-center gap-2"><Calendar size={14} /> {route.date.toLocaleDateString()}</p>
              {/* CORRECCIÓN: Usamos Optional Chaining (?.) y Fallback (||) */}
              <p>Chofer: <span className="font-medium text-white">{route.driver?.firstName || "Sin"} {route.driver?.lastName || "Asignar"}</span></p>
              <p className="text-brand-accent font-medium">{route._count.orders} pedidos asignados</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
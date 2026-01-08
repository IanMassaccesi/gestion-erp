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
        <div><h1 className="text-3xl font-bold font-heading text-brand-primary">Rutas de Entrega</h1><p className="text-gray-500">Logística y despachos</p></div>
        <Link href="/admin/rutas/nueva" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={20} /> Nueva Ruta</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => (
          <Link key={route.id} href={`/admin/rutas/${route.id}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-light/10 text-brand-primary rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors"><Truck size={24} /></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${route.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{route.status}</span>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-1">{route.routeNumber}</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="flex items-center gap-2"><Calendar size={14} /> {route.date.toLocaleDateString()}</p>
              <p>Chofer: <span className="font-medium text-brand-dark">{route.driver.firstName} {route.driver.lastName}</span></p>
              <p className="text-brand-accent font-medium">{route._count.orders} pedidos asignados</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
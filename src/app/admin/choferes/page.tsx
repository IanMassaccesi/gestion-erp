import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, User, Truck } from "lucide-react";

export default async function ChoferesPage() {
  // Buscamos solo los usuarios con rol CORREDOR
  const drivers = await prisma.user.findMany({
    where: { role: 'CORREDOR' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { routes: true } } } // Contamos cuántas rutas han hecho
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Choferes</h1>
          <p className="text-gray-500">Gestión de personal logístico</p>
        </div>
        <Link 
          href="/admin/choferes/nuevo" 
          className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Nuevo Chofer
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.length === 0 ? (
           <div className="col-span-3 p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed">
             No hay choferes registrados.
           </div>
        ) : (
          drivers.map((driver) => (
            <div key={driver.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-brand-bg rounded-full text-brand-primary">
                <User size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-brand-dark">{driver.firstName} {driver.lastName}</h3>
                <p className="text-sm text-gray-500 mb-2">{driver.email}</p>
                <div className="flex items-center gap-2 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                  <Truck size={12} />
                  {driver._count.routes} Rutas asignadas
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
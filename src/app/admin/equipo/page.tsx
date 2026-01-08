import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, User, ShoppingBag, Truck, Edit } from "lucide-react";

export default async function EquipoPage() {
  const staff = await prisma.user.findMany({
    where: { role: 'CORREDOR' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold font-heading text-white">Equipo</h1><p className="text-brand-muted">Gestión de personal</p></div>
        <Link href="/admin/equipo/nuevo" className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-neon"><Plus size={20} /> Nuevo</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((user) => (
          <div key={user.id} className="bg-brand-card p-6 rounded-xl border border-brand-border relative group hover:border-brand-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-dark rounded-full text-brand-muted"><User size={24} /></div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-brand-muted mb-2">{user.email}</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {user.isRunner && <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex gap-1"><ShoppingBag size={12} /> {user.commissionRate}% Com.</span>}
                  {user.isDriver && <span className="text-xs font-bold bg-green-500/20 text-green-300 px-2 py-1 rounded flex gap-1"><Truck size={12} /> Chofer</span>}
                </div>
              </div>
            </div>
            {/* Botón Editar (Simplificado: lleva a una página de edición que deberíamos crear, por ahora reutilizamos el concepto) */}
            <Link href={`/admin/equipo/${user.id}`} className="absolute top-4 right-4 p-2 text-brand-muted hover:text-white"><Edit size={16} /></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
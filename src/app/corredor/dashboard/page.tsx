import { prisma } from "@/lib/prisma";
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
}
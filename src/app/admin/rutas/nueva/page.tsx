import { prisma } from "@/lib/prisma";
import { createRoute } from "@/actions/routes-actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default async function NuevaRutaPage() {
  const drivers = await prisma.user.findMany({ where: { role: 'CORREDOR' } });
  
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'CONFIRMED', deliveryRouteId: null },
    include: { customer: true }
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Armar Nueva Ruta</h1>
      </div>

      <form action={createRoute} className="space-y-6">
        
        {/* Configuración General */}
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-muted mb-2">Nombre / Zona *</label>
            <input 
                name="name" 
                required 
                placeholder="Ej: Ruta Norte - Mañana"
                className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-muted mb-2">Fecha de Entrega *</label>
            <input 
                type="date" 
                name="date" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary outline-none" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-brand-muted mb-2">Chofer Asignado</label>
            <select name="driverId" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary outline-none">
              <option value="null">-- Sin Chofer --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>

        {/* Selección de Pedidos */}
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
          <h3 className="font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">Seleccionar Pedidos</h3>
          
          {pendingOrders.length === 0 ? (
            <p className="text-brand-muted italic">No hay pedidos pendientes de asignar.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {pendingOrders.map(order => (
                <label key={order.id} className="flex items-center gap-4 p-4 hover:bg-brand-dark/30 rounded-lg border border-brand-border cursor-pointer transition-colors">
                  <input type="checkbox" name="orderIds" value={order.id} className="w-5 h-5 accent-brand-primary" />
                  <div className="flex-1">
                    <span className="font-bold text-white block">{order.customer.firstName} {order.customer.lastName}</span>
                    <span className="text-xs text-brand-muted block">{order.shippingAddress}</span>
                  </div>
                  <span className="font-bold text-brand-accent">$${order.total}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-brand-primary text-brand-dark px-8 py-4 rounded-xl font-bold flex gap-2 shadow-neon hover:bg-cyan-400 transition-all">
            <Save size={20} /> Guardar y Crear Ruta
          </button>
        </div>
      </form>
    </div>
  );
}
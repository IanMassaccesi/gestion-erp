import { prisma } from "@/lib/prisma";
import { createShipment } from "@/actions/shipping-actions";
import { Truck, MapPin, Package, User } from "lucide-react";

export default async function EnviosPage() {
  const ordersReadyToShip = await prisma.order.findMany({
    where: { 
      status: { in: ['NO_PAGO', 'PAGO', 'FIADO', 'CONFIRMED'] }, // Incluimos CONFIRMED por si acaso
      shippingAddress: { not: null }, 
      shipment: null
    },
    include: { customer: true }, // FIX: Include customer
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 text-slate-200">
      <h1 className="text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gestión de Envíos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ordersReadyToShip.map(order => (
          <div key={order.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-start mb-4">
               <div><h3 className="font-bold text-white text-lg">#{order.orderNumber}</h3><p className="text-slate-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p></div>
               <span className="bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded text-xs font-bold border border-cyan-800">{order.status}</span>
            </div>
            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300"><User size={16}/><span className="font-bold">{order.customer.firstName} {order.customer.lastName}</span></div>
                <div className="flex items-start gap-2 text-slate-400 text-sm"><MapPin size={16} className="mt-1 shrink-0"/><span>{order.shippingAddress}</span></div>
            </div>
            <form action={async (formData) => { 'use server'; await createShipment(formData); }}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"><Truck size={20} /> Generar Etiqueta</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
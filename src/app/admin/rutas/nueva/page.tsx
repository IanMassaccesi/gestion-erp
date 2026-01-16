import { prisma } from "@/lib/prisma";
import { createRoute } from "@/actions/routes-actions";
import Link from "next/link";
import { ArrowLeft, Truck, Save, MapPin } from "lucide-react";

export default async function NuevaRutaPage() {
  const drivers = await prisma.user.findMany({ where: { isDriver: true, isActive: true } });
  
  const orders = await prisma.order.findMany({ 
    where: { 
        status: { in: ['NO_PAGO', 'FIADO', 'CONFIRMED'] },
        deliveryRouteId: null,
        shippingAddress: { not: null }
    },
    include: { customer: true }, // FIX
    orderBy: { customer: { address: 'asc' } }
  });

  return (
    <div className="max-w-4xl mx-auto pb-20 text-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Nueva Hoja de Ruta</h1>
      </div>
      <form action={async (formData) => { 'use server'; await createRoute(formData); }} className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Nombre Ruta</label><input name="name" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"/></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Chofer</label><select name="driverId" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"><option value="null">-- Sin Chofer --</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"/></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg space-y-2">
            <h3 className="font-bold text-cyan-400 mb-4">Pedidos Disponibles</h3>
            {orders.map(order => (
                <label key={order.id} className="flex items-center gap-4 p-4 border border-slate-800 rounded-lg hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="orderIds" value={order.id} className="w-5 h-5 accent-cyan-500"/>
                    <div className="flex-1 flex justify-between">
                        <div><span className="font-bold text-cyan-400">#{order.orderNumber}</span> <span className="text-slate-300 ml-2">{order.customer.firstName} {order.customer.lastName}</span></div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {order.shippingAddress}</div>
                    </div>
                </label>
            ))}
        </div>
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2"><Save size={24} /> Crear Ruta</button>
      </form>
    </div>
  );
}
import { prisma } from "@/lib/prisma";
import { completeRoute, deliverOrder, toggleOrderInRoute } from "@/actions/routes-actions";
import Link from "next/link";
import { ArrowLeft, Truck, CheckCircle, Package, AlertCircle } from "lucide-react";

export default async function DetalleRutaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = await prisma.deliveryRoute.findUnique({
    where: { id },
    include: { driver: true, orders: { include: { customer: true } } } // FIX
  });

  if (!route) return <div className="text-white p-8">Ruta no encontrada</div>;

  const availableOrders = await prisma.order.findMany({
    where: { status: { in: ['NO_PAGO', 'FIADO', 'CONFIRMED'] }, deliveryRouteId: null, shippingAddress: { not: null } },
    include: { customer: true } // FIX
  });

  return (
    <div className="space-y-6 pb-20 text-slate-200">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/rutas" className="p-2 hover:bg-slate-800 rounded-full"><ArrowLeft/></Link>
            <h1 className="text-2xl font-bold font-heading text-cyan-400">{route.routeNumber}</h1>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold border border-slate-600">{route.status}</span>
        </div>
        {route.status !== 'COMPLETED' && (
            <form action={async () => { 'use server'; await completeRoute(id); }}>
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"><CheckCircle size={20} /> Finalizar Ruta</button>
            </form>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Truck className="text-cyan-400"/> Carga Actual</h2>
            {route.orders.map(order => (
                <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm relative">
                    <div className="flex justify-between mb-2"><span className="font-bold text-cyan-400">#{order.orderNumber}</span><span className="font-bold text-white">$${order.total}</span></div>
                    <p className="text-sm font-bold text-slate-300">{order.customer.firstName} {order.customer.lastName}</p>
                    <p className="text-xs text-slate-500 mb-3">{order.shippingAddress}</p>
                    <div className="flex gap-2">
                        {route.status !== 'COMPLETED' && (
                            <>
                            <form action={async () => { 'use server'; await deliverOrder(order.id); }} className="flex-1"><button className="w-full bg-slate-800 text-cyan-400 py-2 rounded font-bold text-xs border border-slate-700">Entregado</button></form>
                            <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, null); }}><button className="bg-red-900/30 text-red-400 p-2 rounded border border-red-900"><AlertCircle size={16}/></button></form>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
        {route.status !== 'COMPLETED' && (
             <div className="space-y-4 opacity-75">
                <h2 className="font-bold text-slate-500 flex items-center gap-2"><Package/> Pendientes</h2>
                {availableOrders.map(order => (
                    <div key={order.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center border-dashed">
                        <div><span className="font-bold text-slate-400">#{order.orderNumber}</span><p className="text-xs text-slate-600">{order.customer.firstName}</p></div>
                        <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, id); }}><button className="bg-slate-800 text-cyan-400 px-3 py-1 rounded font-bold text-xs border border-slate-700">+ Cargar</button></form>
                    </div>
                ))}
             </div>
        )}
      </div>
    </div>
  );
}
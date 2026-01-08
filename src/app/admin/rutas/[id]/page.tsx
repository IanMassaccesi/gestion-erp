import { prisma } from "@/lib/prisma";
import { toggleOrderInRoute, completeRoute, deliverOrder } from "@/actions/routes-actions";
import { getWhatsAppLink } from "@/utils/whatsapp";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle, MapPin, Lock, 
  MinusCircle, PlusCircle, Truck, Package, MessageCircle 
} from "lucide-react";

export default async function DetalleRutaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Obtener Datos de la Ruta
  const route = await prisma.deliveryRoute.findUnique({
    where: { id },
    include: { 
      driver: true, 
      orders: { 
        include: { customer: true }, 
        orderBy: { createdAt: 'desc' } 
      } 
    }
  });

  if (!route) return <div className="p-10 text-white">Ruta no encontrada</div>;

  // 2. Obtener Pedidos Sueltos (En Depósito)
  const availableOrders = await prisma.order.findMany({
    where: { status: "CONFIRMED", deliveryRouteId: null },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });

  const isCompleted = route.status === "COMPLETED";

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-card p-6 rounded-xl border border-brand-border">
        <div className="flex items-center gap-4">
            <Link href="/admin/rutas" className="p-2 hover:bg-brand-dark rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
            <div>
                <h1 className="text-2xl font-bold font-heading text-white">{route.routeNumber || "Ruta Sin Nombre"}</h1>
                <div className="flex gap-2 text-brand-muted text-sm mt-1">
                    <span className="flex items-center gap-1"><Truck size={14}/> {route.driver?.firstName || "Sin Chofer"} {route.driver?.lastName}</span>
                    <span>• {new Date(route.date).toLocaleDateString()}</span>
                    <span className={`px-2 rounded text-xs font-bold border ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                        {route.status}
                    </span>
                </div>
            </div>
        </div>
        {!isCompleted && (
            <form action={async () => { 'use server'; await completeRoute(id); }}>
                <button className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-neon transition-all">
                    <CheckCircle size={18} /> Finalizar Ruta
                </button>
            </form>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* === COLUMNA IZQUIERDA: EL CAMIÓN (Lista de Envíos con Mapa) === */}
        <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-brand-primary flex items-center gap-2 mb-4">
                <Truck /> Envíos en Curso ({route.orders.length})
            </h2>

            {route.orders.length === 0 && <p className="text-brand-muted italic">No hay pedidos asignados al camión.</p>}

            {route.orders.map((order, index) => {
                const isDelivered = order.status === 'DELIVERED';
                
                // Mensaje WhatsApp
                const msg = `Hola ${order.customer.firstName}, tu pedido llega hoy 🚚. \n\n🔒 Tu código de seguridad es: *${order.deliveryCode}* \n\nPor favor indícalo al chofer al recibir.`;
                const waLink = getWhatsAppLink(order.customer.phone, msg);
                
                // URL Mapa (Embed simple)
                const addressQuery = encodeURIComponent(order.shippingAddress || order.customer.address || order.customer.city || 'Argentina');
                const mapUrl = `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

                return (
                  <div key={order.id} className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-8 transition-all ${isDelivered ? 'border-green-500 opacity-80' : 'border-brand-primary'}`}>
                    
                    {/* Header Card */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parada #{index + 1}</span>
                            <h3 className="text-lg font-bold text-gray-800">{order.customer.firstName} {order.customer.lastName}</h3>
                        </div>
                        <div className="text-right">
                            <span className="font-mono font-bold text-brand-primary block">{order.orderNumber}</span>
                            {isDelivered && <span className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end"><CheckCircle size={12}/> ENTREGADO</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Info y Acciones */}
                        <div className="p-5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-red-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Dirección de Entrega</p>
                                        <p className="text-gray-600 text-sm">{order.shippingAddress || "Retiro en local"}</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 flex-wrap">
                                    <a href={waLink} target="_blank" className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-green-100 transition-colors">
                                        <MessageCircle size={16}/> Avisar por WhatsApp
                                    </a>
                                    
                                    {/* Botón para BAJAR pedido (Desasignar) */}
                                    {!isDelivered && !isCompleted && (
                                        <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, null); }}>
                                            <button className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors" title="Quitar de la ruta">
                                                <MinusCircle size={16}/> Quitar
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Formulario de Entrega */}
                            {!isDelivered && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <form action={async (fd) => { 'use server'; await deliverOrder(order.id, fd.get('code') as string); }}>
                                        {order.requiresCode && (
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Lock size={12}/> Código de Seguridad</label>
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 rounded">Admin: {order.deliveryCode}</span>
                                                </div>
                                                <input name="code" type="text" placeholder="####" className="w-full p-2 border border-gray-300 rounded text-center font-mono text-black text-lg tracking-widest bg-gray-50 focus:bg-white transition-colors outline-none focus:border-brand-primary" required />
                                            </div>
                                        )}
                                        <button className="w-full bg-brand-primary hover:bg-cyan-500 text-brand-dark py-3 rounded-lg font-bold shadow-sm transition-all text-sm uppercase tracking-wide">
                                            Confirmar Entrega
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Mapa Embed */}
                        <div className="h-64 md:h-auto bg-gray-200 relative min-h-[250px] border-t md:border-t-0 md:border-l border-gray-100">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0, position: 'absolute', inset: 0 }}
                                loading="lazy"
                                src={mapUrl}
                            ></iframe>
                        </div>
                    </div>
                  </div>
                );
            })}
        </div>

        {/* === COLUMNA DERECHA: DEPÓSITO (Agregar más pedidos) === */}
        {!isCompleted && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-brand-muted flex items-center gap-2 mb-4">
                    <Package /> Depósito ({availableOrders.length})
                </h2>
                
                <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    {availableOrders.length === 0 && (
                        <div className="p-8 border border-brand-border rounded-xl text-center">
                            <p className="text-brand-muted text-sm">No hay pedidos pendientes.</p>
                        </div>
                    )}
                    
                    {availableOrders.map(order => (
                        <div key={order.id} className="bg-brand-card/40 border border-brand-border p-4 rounded-xl flex justify-between items-center hover:bg-brand-card hover:opacity-100 transition-all group">
                            <div>
                                <h3 className="font-bold text-white text-sm">{order.customer.firstName} {order.customer.lastName}</h3>
                                <p className="text-xs text-brand-muted truncate max-w-[150px]">{order.shippingAddress || "Sin dirección"}</p>
                                <p className="text-xs text-brand-primary font-bold mt-1">${order.total.toLocaleString()}</p>
                            </div>
                            <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, id); }}>
                                <button className="text-brand-muted group-hover:text-brand-primary p-2 hover:bg-brand-dark rounded-full transition-colors" title="Subir al camión">
                                    <PlusCircle size={24} />
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
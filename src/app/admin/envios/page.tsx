import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Truck, Package, Printer, ArrowRight, MapPin } from "lucide-react";
import { createShipment } from "@/actions/shipping-actions";

export default async function EnviosPage() {
  // 1. Pedidos LISTOS para despachar (Confirmados pero sin envío)
  const pendingOrders = await prisma.order.findMany({
    where: { 
      status: "CONFIRMED",
      shipment: null // Que no tengan envío creado aún
    },
    include: { customer: true }
  });

  // 2. Envíos Activos
  const activeShipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      order: { include: { customer: true } } 
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">Centro de Envíos</h1>
        <p className="text-brand-muted">Despacho y etiquetado de paquetes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA 1: POR DESPACHAR */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-primary flex items-center gap-2">
            <Package /> Pendientes de Despacho
          </h2>
          {pendingOrders.length === 0 ? (
            <div className="p-8 bg-brand-card border border-brand-border rounded-xl text-center text-brand-muted">
              No hay pedidos confirmados pendientes.
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="bg-brand-card p-4 rounded-xl border border-brand-border flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{order.customer.firstName} {order.customer.lastName}</p>
                  <p className="text-sm text-brand-muted">Pedido #{order.orderNumber}</p>
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-1"><MapPin size={12}/> {order.shippingAddress || "Sin dirección"}</p>
                </div>
                <form action={async () => { 'use server'; await createShipment(order.id); }}>
                  <button className="bg-brand-primary text-brand-dark px-3 py-2 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2">
                    Generar Etiqueta <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA 2: EN SEGUIMIENTO */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2">
            <Truck /> Envíos Activos
          </h2>
          {activeShipments.map(shipment => (
            <div key={shipment.id} className="bg-brand-card p-4 rounded-xl border border-brand-border group hover:border-brand-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">{shipment.trackingCode}</span>
                  <p className="text-sm text-brand-muted">{shipment.order.customer.firstName} {shipment.order.customer.lastName}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${shipment.status === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end pt-3 border-t border-brand-border">
                <Link 
                  href={`/admin/envios/${shipment.id}/etiqueta`} 
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-brand-text hover:text-brand-primary transition-colors"
                >
                  <Printer size={16} /> Imprimir Etiqueta
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
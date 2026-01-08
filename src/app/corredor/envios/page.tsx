import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Box, ExternalLink } from "lucide-react";

export default async function MisEnviosPage() {
  const session = await getSession();
  
  // Buscar envíos de pedidos generados por ESTE usuario
  const shipments = await prisma.shipment.findMany({
    where: {
      order: {
        userId: session.user.id // Filtramos por el creador del pedido
      }
    },
    include: {
      order: { include: { customer: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6 bg-brand-card p-4 sticky top-0 z-10 border-b border-brand-border shadow-lg">
        <Link href="/corredor/dashboard" className="p-2 hover:bg-brand-dark rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold font-heading text-white">Mis Envíos</h1>
      </div>

      <div className="px-4 space-y-4">
        {shipments.length === 0 ? (
          <div className="text-center text-brand-muted py-10">No tienes envíos activos.</div>
        ) : (
          shipments.map(shipment => (
            <div key={shipment.id} className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-white text-lg">{shipment.trackingCode}</p>
                  <p className="text-xs text-brand-muted">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${shipment.status === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {shipment.status}
                </span>
              </div>
              
              <div className="bg-brand-dark/50 p-3 rounded-lg mb-3">
                <p className="text-sm text-brand-primary font-bold">{shipment.order.customer.firstName} {shipment.order.customer.lastName}</p>
                <p className="text-xs text-brand-muted truncate">{shipment.order.shippingAddress || "Retiro en sucursal"}</p>
              </div>

              {/* Enlace simulado de seguimiento público */}
              <div className="flex justify-end">
                 <button className="text-xs flex items-center gap-1 text-brand-accent hover:underline">
                    Ver Tracking Web <ExternalLink size={12}/>
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
import { prisma } from "@/lib/prisma";
import { InvoiceButton } from "@/components/orders/InvoiceButton";
import { cancelOrder } from "@/actions/orders-actions";
import Link from "next/link";
// Agregué iconos nuevos para la sección de cliente
import { ArrowLeft, Trash2, User, MapPin, Phone, Mail, Calendar } from "lucide-react";

export default async function DetallePedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) return <div className="text-white">Pedido no encontrado</div>;

  const canEdit = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'DRAFT';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* --- ENCABEZADO SUPERIOR --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Link href="/admin/pedidos" className="p-2 bg-brand-card rounded-full text-brand-muted hover:text-white transition-colors">
                <ArrowLeft />
            </Link>
            <div>
                <h1 className="text-2xl font-bold font-heading text-white">Pedido #{order.orderNumber}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded border border-brand-primary/20">
                        {order.status}
                    </span>
                    <span className="text-xs text-brand-muted flex items-center gap-1">
                        <Calendar size={12} />
                        {order.createdAt.toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2 items-center w-full md:w-auto">
            {canEdit && (
                <form action={async () => { 'use server'; await cancelOrder(id); }}>
                    <button className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-red-500/50 transition-all text-sm">
                        <Trash2 size={16} /> Cancelar
                    </button>
                </form>
            )}
            <InvoiceButton orderId={order.id} />
        </div>
      </div>

      {/* --- TARJETA PRINCIPAL --- */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
        
        {/* --- NUEVA SECCIÓN: DATOS DEL CLIENTE Y ENVÍO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-brand-border/50">
            
            {/* Columna 1: Datos del Cliente */}
            <div className="space-y-4">
                <h3 className="text-brand-primary font-bold flex items-center gap-2">
                    <User size={18} /> Datos del Cliente
                </h3>
                <div className="text-sm space-y-2 text-brand-text">
                    <p className="flex justify-between">
                        <span className="text-brand-muted">Nombre:</span> 
                        <span className="text-white font-medium">{order.customer.firstName} {order.customer.lastName}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-brand-muted">DNI/CUIT:</span> 
                        <span className="text-white">{order.customer.dniCuit || '-'}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-brand-muted flex items-center gap-1"><Mail size={12}/> Email:</span> 
                        <span className="text-white">{order.customer.email || '-'}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-brand-muted flex items-center gap-1"><Phone size={12}/> Teléfono:</span> 
                        <span className="text-white">{order.customer.phone || '-'}</span>
                    </p>
                </div>
            </div>

            {/* Columna 2: Datos de Envío / Entrega */}
            <div className="space-y-4">
                <h3 className="text-brand-primary font-bold flex items-center gap-2">
                    <MapPin size={18} /> Dirección de Entrega
                </h3>
                <div className="bg-black/20 p-4 rounded-lg border border-brand-border/30">
                    <p className="text-white text-sm leading-relaxed">
                        {order.shippingAddress 
                            ? order.shippingAddress 
                            : <span className="text-brand-muted italic">Retiro en local / Sin dirección especificada</span>
                        }
                    </p>
                </div>
                {/* Puedes agregar info extra aquí si tienes notas del pedido */}
            </div>
        </div>

        {/* --- SECCIÓN ARTÍCULOS (Lo que ya tenías) --- */}
        <h3 className="text-white font-bold mb-4 text-lg">Detalle de Artículos</h3>
        
        {/* Encabezado de Tabla */}
        <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-brand-muted font-bold mb-2 px-2">
            <div className="col-span-6">Producto</div>
            <div className="col-span-2 text-center">Cant.</div>
            <div className="col-span-2 text-right">Precio U.</div>
            <div className="col-span-2 text-right">Subtotal</div>
        </div>

        <div className="space-y-2">
            {order.items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-brand-border/30 text-sm hover:bg-white/5 px-2 rounded transition-colors">
                    <div className="col-span-6 font-medium text-white truncate">
                        {item.product.name}
                    </div>
                    <div className="col-span-2 text-center text-brand-text">
                        {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-brand-text">
                        ${item.unitPrice.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-bold text-brand-primary">
                        ${item.subtotal.toFixed(2)}
                    </div>
                </div>
            ))}
        </div>

        {/* --- TOTALES --- */}
        <div className="mt-6 flex flex-col items-end gap-2 pt-4">
            <div className="flex justify-between w-full md:w-1/3 text-brand-text">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
            </div>
            
            {/* Si tienes costo de envío o adminFee lo agregas aquí */}
            {order.adminFee > 0 && (
                <div className="flex justify-between w-full md:w-1/3 text-brand-text">
                    <span>Cargos de Servicio</span>
                    <span>${order.adminFee.toFixed(2)}</span>
                </div>
            )}

            <div className="flex justify-between w-full md:w-1/3 text-xl font-bold text-white border-t border-brand-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand-primary">${order.total.toFixed(2)}</span>
            </div>
        </div>

      </div>
    </div>
  );
}
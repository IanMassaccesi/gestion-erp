import { prisma } from "@/lib/prisma";
import { InvoiceButton } from "@/components/orders/InvoiceButton";
import { cancelOrder } from "@/actions/orders-actions";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export default async function DetallePedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) return <div>No encontrado</div>;

  const canEdit = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/admin/pedidos" className="p-2 bg-brand-card rounded-full text-brand-muted"><ArrowLeft /></Link>
            <div>
                <h1 className="text-2xl font-bold font-heading text-white">Pedido {order.orderNumber}</h1>
                <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded border border-brand-primary/30">{order.status}</span>
            </div>
        </div>
        <div className="flex gap-2">
            {/* Solo mostramos botón borrar si no está en viaje/entregado */}
            {canEdit && (
                <form action={async () => { 'use server'; await cancelOrder(id); }}>
                    <button className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-red-500/50 transition-all">
                        <Trash2 size={18} /> Cancelar y Reponer Stock
                    </button>
                </form>
            )}
            <InvoiceButton order={order} />
        </div>
      </div>

      <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
        {/* ... (Resto de tu detalle visual igual que antes) ... */}
        <h3 className="text-brand-primary font-bold mb-4 border-b border-brand-border pb-2">Items</h3>
        {order.items.map(item => (
            <div key={item.id} className="flex justify-between py-2 border-b border-brand-border/50 text-brand-text">
                <span>{item.quantity} x {item.product.name}</span>
                <span>$${item.subtotal}</span>
            </div>
        ))}
        <div className="mt-4 flex justify-end text-xl font-bold text-white">
            Total: $${order.total}
        </div>
      </div>
    </div>
  );
}
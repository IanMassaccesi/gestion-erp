import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, Printer } from "lucide-react";

export default async function PedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Pedidos</h1>
          <p className="text-gray-500">Gestión de ventas</p>
        </div>
        <Link 
          href="/admin/pedidos/nuevo" 
          className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} /> Nuevo Pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b">
            <tr>
              <th className="p-4">N° Orden</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Total</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-brand-accent">{o.orderNumber}</td>
                <td className="p-4 font-medium text-brand-dark">{o.customer.firstName} {o.customer.lastName}</td>
                <td className="p-4">{o.createdAt.toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-4 font-bold text-brand-dark">$${o.total.toFixed(2)}</td>
                <td className="p-4 flex justify-end gap-2">
                   {/* Botón Imprimir (Abre en pestaña nueva) */}
                   <a href={`/admin/pedidos/${o.id}/imprimir`} target="_blank" className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Imprimir Remito">
                      <Printer size={20} />
                   </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
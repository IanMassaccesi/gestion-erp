import { prisma } from "@/lib/prisma";
import { markOrdersAsPrinted } from "@/actions/orders-actions";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Truck } from "lucide-react";
import { PrintButton } from "@/components/ui/PrintButton"; // Importamos el componente cliente

export default async function HojaDeRutaPage({ searchParams }: { searchParams: Promise<{ ids: string }> }) {
  const { ids } = await searchParams;
  
  if (!ids) return <div className="p-10 text-black">No se seleccionaron pedidos.</div>;

  const idArray = ids.split(',');

  const orders = await prisma.order.findMany({
    where: { id: { in: idArray } },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { customer: { address: 'asc' } }
  });

  const totalLoad = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      
      {/* HEADER DE CONTROL (No sale impreso) */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-300">
        <Link href="/admin/pedidos" className="flex items-center gap-2 text-gray-600 hover:text-black font-bold">
            <ArrowLeft /> Volver
        </Link>
        <div className="flex gap-4">
            {/* Usamos el componente Cliente aquí */}
            <PrintButton />
            
            <form action={async () => { 'use server'; await markOrdersAsPrinted(idArray); }}>
                <button className="bg-[#34B3A0] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#2a9181]">
                    <CheckCircle /> Confirmar y Archivar
                </button>
            </form>
        </div>
      </div>

      {/* DISEÑO DE IMPRESIÓN (BLANCO Y NEGRO CLARO) */}
      <div className="max-w-4xl mx-auto border border-gray-300 p-8 shadow-sm print:shadow-none print:border-0 print:p-0 bg-white">
        
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
                    <Truck className="text-black" size={28}/> HOJA DE RUTA
                </h1>
                <p className="text-sm mt-1 text-gray-600">Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">Pedidos: {orders.length}</p>
                <p className="font-bold text-lg">Total Carga: $${totalLoad.toLocaleString()}</p>
            </div>
        </div>

        <div className="space-y-6">
            {orders.map((order, index) => (
                <div key={order.id} className="border-b border-gray-300 pb-4 break-inside-avoid">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-sm font-bold bg-black text-white px-2 py-0.5 rounded mr-2">#{index + 1}</span>
                            <span className="font-bold text-lg">{order.customer.firstName} {order.customer.lastName}</span>
                            <span className="text-sm text-gray-600 ml-2">({order.customer.businessName || 'Final'})</span>
                        </div>
                        <div className="text-right">
                             <span className="font-mono font-bold">Ord: {order.orderNumber}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 ml-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-500">Destino</p>
                            <p className="font-medium text-lg">{order.shippingAddress || "RETIRA EN LOCAL"}</p>
                            <p className="text-sm">{order.customer.city} {order.customer.phone && `| Tel: ${order.customer.phone}`}</p>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-gray-500">A Cobrar</p>
                            
                            {order.status === 'NO_PAGO' || order.status === 'CONFIRMED' ? (
                                <p className="font-bold text-2xl mt-1">$${order.total.toLocaleString()}</p>
                            ) : order.status === 'FIADO' ? (
                                <div>
                                    <span className="text-sm font-bold border border-black px-1 rounded">CTA CTE</span>
                                    <p className="font-bold text-lg">$${order.total.toLocaleString()}</p>
                                </div>
                            ) : (
                                <span className="text-sm font-bold border border-black px-1 rounded bg-black text-white">PAGADO</span>
                            )}
                        </div>
                    </div>
                    {order.notes && (
                        <div className="mt-2 ml-2 text-sm italic bg-gray-100 p-1 border border-gray-200">
                            Nota: {order.notes}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
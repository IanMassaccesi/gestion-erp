const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. BOTÓN DE IMPRIMIR EN LA TABLA DE PEDIDOS ---
  'src/app/admin/pedidos/page.tsx': `import { prisma } from "@/lib/prisma";
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
                  <span className={\`px-2 py-1 rounded-full text-xs font-bold \${o.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-4 font-bold text-brand-dark">\$\${o.total.toFixed(2)}</td>
                <td className="p-4 flex justify-end gap-2">
                   {/* Botón Imprimir (Abre en pestaña nueva) */}
                   <a href={\`/admin/pedidos/\${o.id}/imprimir\`} target="_blank" className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Imprimir Remito">
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
}`,

  // --- 2. VISTA DE IMPRESIÓN (DISEÑO A4) ---
  'src/app/admin/pedidos/[id]/imprimir/page.tsx': `import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

// Componente especial para impresión
// Usa clases "print:" de Tailwind para ocultar botones al imprimir
export default async function ImprimirPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { 
      customer: true,
      items: { include: { product: true } },
      user: true // El vendedor
    }
  });

  if (!order) return notFound();

  return (
    <div className="bg-white min-h-screen text-black p-8 max-w-[21cm] mx-auto">
      {/* Botón flotante solo visible en pantalla */}
      <div className="print:hidden mb-8 flex justify-between bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Vista previa del documento.</p>
        <button 
          onClick={() => typeof window !== 'undefined' && window.print()} // Nota: Esto requiere un componente cliente o script simple, pero el navegador tiene atajo Ctrl+P
          className="bg-brand-primary text-white px-4 py-2 rounded font-bold shadow hover:bg-brand-dark"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      {/* --- ENCABEZADO --- */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider">TuEmpresa</h1>
          <p className="text-sm mt-1">Av. Siempre Viva 123, Springfield</p>
          <p className="text-sm">Tel: (011) 4444-5555</p>
          <p className="text-sm">IVA Responsable Inscripto</p>
        </div>
        <div className="text-right">
          <div className="border border-black p-3 rounded mb-2">
            <h2 className="text-xl font-bold">REMITO / PRESUPUESTO</h2>
            <p className="font-mono text-lg">{order.orderNumber}</p>
          </div>
          <p className="text-sm">Fecha: <span className="font-bold">{order.createdAt.toLocaleDateString()}</span></p>
        </div>
      </div>

      {/* --- DATOS CLIENTE --- */}
      <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-xs">Destinatario</h3>
          <p className="text-lg font-bold">{order.customer.firstName} {order.customer.lastName}</p>
          <p>{order.customer.businessName}</p>
          <p>{order.customer.address}</p>
          <p>CUIT/DNI: {order.customer.dniCuit}</p>
        </div>
        <div>
          <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-xs">Datos de Entrega</h3>
          <p>Dirección: {order.shippingAddress}</p>
          <p>Vendedor: {order.user?.firstName || "Administración"}</p>
          <p>Condición: {order.appliedPriceTier}</p>
        </div>
      </div>

      {/* --- TABLA DE ITEMS --- */}
      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="py-2 text-left w-12">Cant</th>
            <th className="py-2 text-left">Descripción</th>
            <th className="py-2 text-left w-32">Cód</th>
            <th className="py-2 text-right w-24">P. Unit</th>
            <th className="py-2 text-right w-24">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="py-2 font-bold">{item.quantity}</td>
              <td className="py-2">{item.product.name}</td>
              <td className="py-2 font-mono text-xs">{item.product.code}</td>
              <td className="py-2 text-right">\$\${item.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right font-bold">\$\${item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- TOTALES --- */}
      <div className="flex justify-end">
        <div className="w-64 border-t-2 border-black pt-2">
          <div className="flex justify-between text-xl font-bold">
            <span>TOTAL:</span>
            <span>\$\${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* --- PIE DE PÁGINA --- */}
      <div className="fixed bottom-0 left-0 w-full p-8 text-center text-xs text-gray-500 print:block hidden">
        <p>Documento no válido como factura fiscal - Control interno</p>
        <p>Recibí conforme: _____________________________ Fecha: ___/___/___</p>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando Módulo de Impresión (Remitos)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
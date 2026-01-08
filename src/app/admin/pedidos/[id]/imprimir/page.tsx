import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ui/PrintButton";

export default async function ImprimirPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } }, user: true }
  });

  if (!order) return notFound();

  const COMPANY = {
    name: "TODO KIOSCO S.R.L.",
    address: "Av. Corrientes 1234, CABA",
    cuit: "30-12345678-9",
    iibb: "12345678",
    inicio: "01/01/2025",
    condicion: "IVA Responsable Inscripto"
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 font-sans text-black">
      {/* Botonera solo visible en pantalla */}
      <div className="print:hidden max-w-[21cm] mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow border border-gray-200">
        <div>
           <p className="text-sm font-bold text-gray-700">Vista Previa</p>
           <p className="text-xs text-gray-500">Formato Factura C</p>
        </div>
        {/* Usamos el componente cliente aquí */}
        <PrintButton />
      </div>

      {/* Hoja A4 */}
      <div className="bg-white max-w-[21cm] mx-auto p-8 shadow-lg print:shadow-none print:p-0">
        
        {/* ENCABEZADO TIPO AFIP */}
        <div className="border border-black relative mb-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white px-2 border-b border-l border-r border-black w-16 h-14 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none">C</span>
                <span className="text-[9px] font-bold mt-1">COD. 011</span>
            </div>

            <div className="flex">
                <div className="w-1/2 p-4 border-r border-black pt-8 text-center md:text-left">
                    <h1 className="text-2xl font-bold uppercase mb-2">{COMPANY.name}</h1>
                    <p className="text-xs font-bold mb-1">Razón Social: {COMPANY.name}</p>
                    <p className="text-xs mb-1">Domicilio: {COMPANY.address}</p>
                    <p className="text-xs font-bold mt-2">{COMPANY.condicion}</p>
                </div>

                <div className="w-1/2 p-4 pt-8 pl-8">
                    <h2 className="text-xl font-bold mb-4">FACTURA</h2>
                    <div className="text-xs space-y-1">
                        <p><span className="font-bold w-24 inline-block">Comp. Nro:</span> {order.orderNumber.replace('PED-', '')}</p>
                        <p><span className="font-bold w-24 inline-block">Fecha:</span> {order.createdAt.toLocaleDateString()}</p>
                        <p><span className="font-bold w-24 inline-block">CUIT:</span> {COMPANY.cuit}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* DATOS CLIENTE */}
        <div className="border border-black p-2 mb-4 text-xs">
            <div className="flex mb-1">
                <span className="font-bold w-24">Señor(es):</span>
                <span>{order.customer.firstName} {order.customer.lastName}</span>
            </div>
            <div className="flex mb-1">
                <span className="font-bold w-24">Domicilio:</span>
                <span>{order.customer.address}</span>
            </div>
            <div className="flex">
                <div className="w-1/2 flex">
                    <span className="font-bold w-24">CUIT/DNI:</span>
                    <span>{order.customer.dniCuit}</span>
                </div>
            </div>
        </div>

        {/* TABLA ITEMS */}
        <table className="w-full text-xs mb-8 border border-black">
          <thead>
            <tr className="bg-gray-200 text-black border-b border-black">
              <th className="py-2 px-2 text-left border-r border-black w-16">Cant.</th>
              <th className="py-2 px-2 text-left border-r border-black">Descripción</th>
              <th className="py-2 px-2 text-right w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 px-2 border-r border-black text-center">{item.quantity}</td>
                <td className="py-2 px-2 border-r border-black">{item.product.name}</td>
                <td className="py-2 px-2 text-right">$${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES */}
        <div className="flex justify-end mb-8">
            <div className="border border-black w-1/3">
                <div className="flex justify-between p-2 text-lg font-bold bg-gray-200">
                    <span>Total:</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="border border-black p-4 flex justify-between items-center text-xs">
            <div className="w-2/3">
                <p className="font-bold italic">"Comprobante Autorizado"</p>
            </div>
            <div className="w-1/3 text-right">
                <p><span className="font-bold">CAE N°:</span> 73456789012345</p>
            </div>
        </div>

      </div>
    </div>
  );
}
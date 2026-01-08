const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. COMPONENTE CLIENTE: BOTÓN DE IMPRIMIR PANTALLA
  // ==========================================
  'src/components/ui/PrintButton.tsx': `'use client'
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-brand-primary text-brand-dark px-4 py-2 rounded font-bold shadow-neon hover:bg-cyan-400 transition-colors flex items-center gap-2 print:hidden"
    >
      <Printer size={18} />
      Imprimir Pantalla
    </button>
  );
}`,

  // ==========================================
  // 2. COMPONENTE CLIENTE: GENERADOR PDF (InvoiceButton)
  // ==========================================
  'src/components/orders/InvoiceButton.tsx': `'use client'
import { useState } from "react";
import { FileText, CheckSquare, Square } from "lucide-react";
import jsPDF from "jspdf";

export function InvoiceButton({ order }: { order: any }) {
  const [showCommission, setShowCommission] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const azulOscuro: [number, number, number] = [14, 56, 111];

    // --- HEADER ---
    doc.setFillColor(...azulOscuro);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CodigoCriollo', 15, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('PRESUPUESTO / PEDIDO', 15, 30);
    
    doc.setFontSize(10);
    doc.text(\`N° \${order.orderNumber}\`, 150, 20);
    doc.text(\`Fecha: \${new Date(order.createdAt).toLocaleDateString()}\`, 150, 27);

    let yPos = 55;

    // --- CLIENTE ---
    doc.setTextColor(14, 56, 111);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 15, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    yPos += 8;
    doc.text(\`Cliente: \${order.customer.firstName} \${order.customer.lastName}\`, 15, yPos);
    yPos += 6;
    doc.text(\`DNI/CUIT: \${order.customer.dniCuit}\`, 15, yPos);
    yPos += 6;
    doc.text(\`Dirección: \${order.shippingAddress || '-'}\`, 15, yPos);

    yPos += 15;

    // --- TABLA ---
    doc.setFillColor(...azulOscuro);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 20, yPos + 7);
    doc.text('Cant.', 115, yPos + 7);
    doc.text('Precio', 135, yPos + 7);
    doc.text('Subtotal', 170, yPos + 7);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    order.items.forEach((item: any) => {
        doc.text(item.product.name.substring(0, 40), 20, yPos);
        doc.text(item.quantity.toString(), 118, yPos);
        doc.text(\`$ \${item.unitPrice.toFixed(2)}\`, 135, yPos);
        doc.text(\`$ \${item.subtotal.toFixed(2)}\`, 170, yPos);
        yPos += 8;
    });

    // --- TOTALES ---
    yPos += 5;
    doc.setDrawColor(...azulOscuro);
    doc.line(130, yPos, 195, yPos);
    yPos += 7;

    // Subtotal
    doc.text('Subtotal:', 140, yPos);
    doc.text(\`$ \${order.subtotal.toFixed(2)}\`, 172, yPos);
    yPos += 7;

    if (showCommission && order.adminFee > 0) {
        doc.text('Gastos Serv:', 140, yPos);
        doc.text(\`$ \${order.adminFee.toFixed(2)}\`, 172, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 140, yPos);
        doc.text(\`$ \${order.total.toFixed(2)}\`, 172, yPos);
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 140, yPos);
        // Si no mostramos comisión, mostramos el subtotal como total (para mantener coherencia visual)
        doc.text(\`$ \${order.subtotal.toFixed(2)}\`, 172, yPos);
    }

    doc.save(\`Pedido_\${order.orderNumber}.pdf\`);
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <button 
        onClick={() => setShowCommission(!showCommission)}
        className="flex items-center gap-2 text-xs text-brand-muted hover:text-brand-primary cursor-pointer mb-1 bg-transparent border-none"
      >
        {showCommission ? <CheckSquare size={14} /> : <Square size={14} />}
        Incluir Gastos en PDF
      </button>
      
      <button 
        onClick={generatePDF}
        className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-neon hover:bg-cyan-400 transition-colors"
      >
        <FileText size={18} />
        Descargar PDF
      </button>
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINA SERVER: VISTA DE IMPRESIÓN (Limpia de onClick)
  // ==========================================
  'src/app/admin/pedidos/[id]/imprimir/page.tsx': `import { prisma } from "@/lib/prisma";
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
                <td className="py-2 px-2 text-right">\$\${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES */}
        <div className="flex justify-end mb-8">
            <div className="border border-black w-1/3">
                <div className="flex justify-between p-2 text-lg font-bold bg-gray-200">
                    <span>Total:</span>
                    <span>\$\${order.total.toFixed(2)}</span>
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
}`
};

function createFiles() {
  console.log('🚀 Arreglando Error de Event Handlers (Separando Client Components)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Corregido: ${filePath}`);
  }
}
createFiles();
'use client';

import { Printer, Receipt } from "lucide-react";
import jsPDF from "jspdf";

interface PrintControlsProps {
  order: any; // O usa tu tipo Order de Prisma si lo tienes tipado
}

export function PrintControls({ order }: PrintControlsProps) {

  // OPCION A: Imprimir la pantalla actual (Factura A4 HTML)
  const handlePrintFactura = () => {
    window.print();
  };

  // OPCION B: Generar PDF invisible para Ticket (80mm)
  const handleDownloadTicket = () => {
    // Calculamos altura dinámica según la cantidad de items
    const estimatedHeight = 60 + (order.items.length * 10) + 40; 
    
    // Configuración 80mm
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [80, estimatedHeight] 
    });

    let yPos = 10;
    const centerX = 40;

    // Estilos para térmica
    doc.setFont('courier', 'bold'); 
    doc.setTextColor(0, 0, 0);
    
    // Encabezado Ticket
    doc.setFontSize(14);
    doc.text('TODO KIOSCO S.R.L.', centerX, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text('Av. Corrientes 1234, CABA', centerX, yPos, { align: 'center' });
    yPos += 5;
    doc.text('IVA Responsable Inscripto', centerX, yPos, { align: 'center' });
    yPos += 5;
    doc.text('--------------------------------', centerX, yPos, { align: 'center' });
    yPos += 5;

    // Datos Pedido
    doc.setFontSize(8);
    doc.text(`Comp: TICKET #${order.orderNumber}`, 2, yPos);
    yPos += 4;
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString()}`, 2, yPos);
    yPos += 4;
    doc.text(`Cli: ${order.customer.firstName} ${order.customer.lastName}`, 2, yPos);
    
    yPos += 4;
    doc.text('--------------------------------', centerX, yPos, { align: 'center' });
    yPos += 5;

    // Tabla Items
    doc.setFont('courier', 'bold');
    doc.text('CANT  DESCRIPCION       TOTAL', 2, yPos);
    yPos += 4;
    doc.setFont('courier', 'normal');

    order.items.forEach((item: any) => {
        const qty = item.quantity.toString().padEnd(3); // 3 espacios
        const price = `$${item.subtotal.toFixed(2)}`;
        
        // Cortamos el nombre si es muy largo para que entre en una linea o dos
        const nameShort = item.product.name.substring(0, 15).padEnd(16);
        
        doc.text(`${qty} ${nameShort} ${price}`, 2, yPos);
        yPos += 4;
    });

    yPos += 2;
    doc.text('--------------------------------', centerX, yPos, { align: 'center' });
    yPos += 5;

    // Total
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text(`TOTAL: $${order.total.toFixed(2)}`, 78, yPos, { align: 'right' });

    yPos += 10;
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text('*** Gracias por su compra ***', centerX, yPos, { align: 'center' });
    
    // Abrir dialogo de impresion directamente
    doc.autoPrint();
    doc.save(`Ticket_${order.orderNumber}.pdf`);
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={handleDownloadTicket}
        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition-colors"
      >
        <Receipt size={16} />
        Imprimir Ticket
      </button>

      <button 
        onClick={handlePrintFactura}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-500 transition-colors"
      >
        <Printer size={16} />
        Imprimir Factura
      </button>
    </div>
  );
}
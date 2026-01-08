'use client'
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
    doc.text(`N° ${order.orderNumber}`, 150, 20);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 27);

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
    doc.text(`Cliente: ${order.customer.firstName} ${order.customer.lastName}`, 15, yPos);
    yPos += 6;
    doc.text(`DNI/CUIT: ${order.customer.dniCuit}`, 15, yPos);
    yPos += 6;
    doc.text(`Dirección: ${order.shippingAddress || '-'}`, 15, yPos);

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
        doc.text(`$ ${item.unitPrice.toFixed(2)}`, 135, yPos);
        doc.text(`$ ${item.subtotal.toFixed(2)}`, 170, yPos);
        yPos += 8;
    });

    // --- TOTALES ---
    yPos += 5;
    doc.setDrawColor(...azulOscuro);
    doc.line(130, yPos, 195, yPos);
    yPos += 7;

    // Subtotal
    doc.text('Subtotal:', 140, yPos);
    doc.text(`$ ${order.subtotal.toFixed(2)}`, 172, yPos);
    yPos += 7;

    if (showCommission && order.adminFee > 0) {
        doc.text('Gastos Serv:', 140, yPos);
        doc.text(`$ ${order.adminFee.toFixed(2)}`, 172, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 140, yPos);
        doc.text(`$ ${order.total.toFixed(2)}`, 172, yPos);
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL:', 140, yPos);
        // Si no mostramos comisión, mostramos el subtotal como total (para mantener coherencia visual)
        doc.text(`$ ${order.subtotal.toFixed(2)}`, 172, yPos);
    }

    doc.save(`Pedido_${order.orderNumber}.pdf`);
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
}
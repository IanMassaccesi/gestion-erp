const fs = require('fs');
const path = require('path');

const files = {
  'src/components/orders/InvoiceButton.tsx': `'use client'
import { FileText } from "lucide-react";
import jsPDF from "jspdf";

export function InvoiceButton({ order }: { order: any }) {

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- CONFIGURACIÓN ---
    const COMPANY = {
        name: "CODIGO CRIOLLO S.R.L.",
        address: "Av. Siempre Viva 1234",
        city: "CABA",
        cuit: "30-12345678-9",
        iibb: "12345678",
        start: "01/01/2024",
        condicion: "Responsable Inscripto"
    };

    // --- MARCO EXTERIOR ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287); // Marco A4

    // ==========================================
    // ENCABEZADO (TIPO FACTURA C)
    // ==========================================
    let yPos = 15;

    // 1. CAJA CENTRAL "C"
    doc.setLineWidth(1);
    doc.rect(95, 10, 20, 15); // Recuadro letra
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text("C", 105, 22, { align: 'center' }); // Letra
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("COD. 011", 105, 29, { align: 'center' });
    
    // Línea divisoria al medio (vertical)
    doc.setLineWidth(0.5);
    doc.line(105, 30, 105, 55); 

    // 2. COLUMNA IZQUIERDA (EMPRESA)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY.name, 10, 20); // Nombre grande
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Razón Social:", 10, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY.name, 35, 30);

    doc.setFont('helvetica', 'bold');
    doc.text("Domicilio:", 10, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(\`\${COMPANY.address} - \${COMPANY.city}\`, 35, 35);

    doc.setFont('helvetica', 'bold');
    doc.text("Condición IVA:", 10, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY.condicion, 35, 40);

    // 3. COLUMNA DERECHA (DATOS COMPROBANTE)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("FACTURA", 195, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(\`Punto de Venta: 0001   Comp. Nro: \${order.orderNumber.replace('PED-', '')}\`, 195, 30, { align: 'right' });
    doc.text(\`Fecha de Emisión: \${new Date(order.createdAt).toLocaleDateString('es-AR')}\`, 195, 35, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(\`CUIT: \${COMPANY.cuit}\`, 195, 45, { align: 'right' });
    doc.text(\`Ing. Brutos: \${COMPANY.iibb}\`, 195, 50, { align: 'right' });
    doc.text(\`Inicio de Act: \${COMPANY.start}\`, 195, 55, { align: 'right' });

    // LÍNEA HORIZONTAL SEPARADORA
    yPos = 60;
    doc.setLineWidth(0.5);
    doc.line(5, yPos, 205, yPos);

    // ==========================================
    // DATOS DEL CLIENTE
    // ==========================================
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Apellido y Nombre / Razón Social:", 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(\`\${order.customer.firstName} \${order.customer.lastName}\`, 70, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text("Domicilio:", 120, yPos); // Ajustado para que entre
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress || order.customer.address || "-", 140, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text("Condición IVA:", 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text("Consumidor Final / Exento", 40, yPos); // O tomar del cliente si agregamos el campo

    doc.setFont('helvetica', 'bold');
    doc.text("CUIT/DNI:", 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer.dniCuit, 140, yPos);

    yPos += 8;
    doc.line(5, yPos, 205, yPos); // Línea cierre cliente

    // ==========================================
    // TABLA DE PRODUCTOS
    // ==========================================
    yPos += 5;
    
    // Header Tabla (Fondo Gris)
    doc.setFillColor(240, 240, 240);
    doc.rect(5, yPos, 200, 8, 'F');
    doc.line(5, yPos, 205, yPos); // Línea arriba
    doc.line(5, yPos + 8, 205, yPos + 8); // Línea abajo

    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("Cód.", 10, yPos);
    doc.text("Producto / Servicio", 30, yPos);
    doc.text("Cant.", 130, yPos, { align: 'right' });
    doc.text("U. Medida", 150, yPos, { align: 'right' });
    doc.text("Precio Unit.", 175, yPos, { align: 'right' });
    doc.text("Subtotal", 200, yPos, { align: 'right' });

    yPos += 8; // Inicio datos

    // Loop Items
    doc.setFont('helvetica', 'normal');
    order.items.forEach((item: any) => {
        // Código
        doc.text(item.product.code || "-", 10, yPos);
        // Nombre (cortado si es largo)
        doc.text(item.product.name.substring(0, 50), 30, yPos);
        // Cantidad
        doc.text(item.quantity.toString(), 130, yPos, { align: 'right' });
        // Unidad
        doc.text("Unidad", 150, yPos, { align: 'right' });
        // Precio
        doc.text(item.unitPrice.toFixed(2), 175, yPos, { align: 'right' });
        // Subtotal
        doc.text(item.subtotal.toFixed(2), 200, yPos, { align: 'right' });

        yPos += 6;
    });

    // ==========================================
    // TOTALES Y PIE
    // ==========================================
    // Línea Totales (fija abajo o después de items)
    yPos += 5;
    doc.line(5, yPos, 205, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Subtotal:", 150, yPos, { align: 'right' });
    doc.text(\`$ \${order.total.toFixed(2)}\`, 200, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setFontSize(14);
    doc.text("TOTAL:", 150, yPos, { align: 'right' });
    doc.text(\`$ \${order.total.toFixed(2)}\`, 200, yPos, { align: 'right' });

    // ==========================================
    // CAE (Falso/Simulado)
    // ==========================================
    const footerY = 260;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("CAE N°:", 140, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text("73456789012345", 160, footerY);

    doc.setFont('helvetica', 'bold');
    doc.text("Fecha Vto. CAE:", 140, footerY + 5);
    doc.setFont('helvetica', 'normal');
    const vto = new Date();
    vto.setDate(vto.getDate() + 10);
    doc.text(vto.toLocaleDateString('es-AR'), 170, footerY + 5);

    // Barcode falso
    doc.setFontSize(10);
    doc.text("|||| |||| |||| |||| |||| |||| ||||", 10, footerY + 5);
    doc.setFontSize(7);
    doc.text("Comprobante Autorizado", 10, footerY + 10);

    // Guardar
    doc.save(\`Factura_\${order.orderNumber}.pdf\`);
  };

  return (
    <button 
      onClick={generatePDF}
      className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-neon hover:bg-cyan-400 transition-colors"
    >
      <FileText size={18} />
      Descargar Factura AFIP
    </button>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando Botón de Factura Tipo AFIP (jspdf)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
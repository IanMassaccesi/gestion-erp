const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 2. ACTION: CREAR ENVÍO Y CAMBIAR ESTADO
  // ==========================================
  'src/actions/shipping-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createShipment(orderId: string) {
  // 1. Generar Código de Seguimiento (Simulación AR)
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const trackingCode = \`CP\${timestamp}\${random}AR\`;

  try {
    await prisma.shipment.create({
      data: {
        orderId,
        trackingCode,
        status: "PREPARACION",
        provider: "LOGISTICA INTERNA" // O Correo Argentino
      }
    });
    
    // Actualizamos el estado del pedido también
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" }
    });

  } catch (error) {
    console.error(error);
    return { error: "Error al generar envío" };
  }

  revalidatePath("/admin/envios");
  redirect("/admin/envios");
}

export async function updateShipmentStatus(shipmentId: string, newStatus: string) {
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: { status: newStatus }
  });
  revalidatePath("/admin/envios");
}`,

  // ==========================================
  // 3. VISTA PRINCIPAL DE ENVÍOS (Dashboard)
  // ==========================================
  'src/app/admin/envios/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Truck, Package, Printer, ArrowRight, MapPin } from "lucide-react";
import { createShipment } from "@/actions/shipping-actions";

export default async function EnviosPage() {
  // 1. Pedidos LISTOS para despachar (Confirmados pero sin envío)
  const pendingOrders = await prisma.order.findMany({
    where: { 
      status: "CONFIRMED",
      shipment: null // Que no tengan envío creado aún
    },
    include: { customer: true }
  });

  // 2. Envíos Activos
  const activeShipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      order: { include: { customer: true } } 
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">Centro de Envíos</h1>
        <p className="text-brand-muted">Despacho y etiquetado de paquetes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA 1: POR DESPACHAR */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-primary flex items-center gap-2">
            <Package /> Pendientes de Despacho
          </h2>
          {pendingOrders.length === 0 ? (
            <div className="p-8 bg-brand-card border border-brand-border rounded-xl text-center text-brand-muted">
              No hay pedidos confirmados pendientes.
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="bg-brand-card p-4 rounded-xl border border-brand-border flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{order.customer.firstName} {order.customer.lastName}</p>
                  <p className="text-sm text-brand-muted">Pedido #{order.orderNumber}</p>
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-1"><MapPin size={12}/> {order.shippingAddress || "Sin dirección"}</p>
                </div>
                <form action={async () => { 'use server'; await createShipment(order.id); }}>
                  <button className="bg-brand-primary text-brand-dark px-3 py-2 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2">
                    Generar Etiqueta <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA 2: EN SEGUIMIENTO */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2">
            <Truck /> Envíos Activos
          </h2>
          {activeShipments.map(shipment => (
            <div key={shipment.id} className="bg-brand-card p-4 rounded-xl border border-brand-border group hover:border-brand-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-2xl font-mono font-bold text-white tracking-wider">{shipment.trackingCode}</span>
                  <p className="text-sm text-brand-muted">{shipment.order.customer.firstName} {shipment.order.customer.lastName}</p>
                </div>
                <div className="text-right">
                  <span className={\`px-2 py-1 rounded text-xs font-bold \${shipment.status === 'ENTREGADO' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}\`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end pt-3 border-t border-brand-border">
                <Link 
                  href={\`/admin/envios/\${shipment.id}/etiqueta\`} 
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-brand-text hover:text-brand-primary transition-colors"
                >
                  <Printer size={16} /> Imprimir Etiqueta
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}`,

  // ==========================================
  // 4. GENERADOR DE ETIQUETA (Client Component)
  // ==========================================
  'src/components/shipping/ShippingLabel.tsx': `'use client'
import { Printer } from "lucide-react";
import { useEffect } from "react";

export function ShippingLabel({ shipment }: { shipment: any }) {
  
  // Auto-imprimir al cargar (opcional)
  // useEffect(() => { window.print(); }, []);

  return (
    <div className="bg-gray-200 min-h-screen p-8 text-black font-sans flex flex-col items-center">
      
      <div className="print:hidden mb-6">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2">
          <Printer /> Imprimir Etiqueta (Zebra / A4)
        </button>
      </div>

      {/* ETIQUETA TIPO CORREO (10cm x 15cm aprox) */}
      <div className="bg-white w-[100mm] h-[150mm] border border-gray-300 shadow-2xl p-4 relative overflow-hidden print:shadow-none print:border-none print:m-0">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
          <div>
            <h1 className="font-bold text-2xl tracking-tighter">CORREO</h1>
            <p className="text-xs font-bold">SUC. ADMISIÓN: 01</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-4xl">{shipment.order.customer.address.slice(-3) || "CPA"}</h2>
            <p className="text-xs">Ruta: 12</p>
          </div>
        </div>

        {/* DESTINATARIO */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Destinatario</p>
          <p className="text-lg font-bold uppercase">{shipment.order.customer.firstName} {shipment.order.customer.lastName}</p>
          <p className="text-sm font-medium">{shipment.order.shippingAddress || shipment.order.customer.address}</p>
          <p className="text-sm font-medium">CP: {shipment.order.customer.dniCuit.slice(0,4) || "0000"} - {shipment.order.customer.city || "Argentina"}</p>
          <p className="text-xs mt-1">Tel: {shipment.order.customer.phone || "-"}</p>
        </div>

        {/* REMITENTE */}
        <div className="mb-6 border-t border-dashed border-gray-400 pt-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Remitente</p>
          <p className="text-xs font-bold">TODO KIOSCO S.R.L.</p>
          <p className="text-[10px]">Av. Corrientes 1234, CABA</p>
        </div>

        {/* CÓDIGO DE SEGUIMIENTO */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="border-2 border-black p-2 mb-2">
             <p className="text-xs font-bold mb-1">TRACKING NUMBER</p>
             <p className="text-2xl font-mono font-bold tracking-widest">{shipment.trackingCode}</p>
          </div>
          
          {/* BARCODE SIMULADO (CSS) */}
          <div className="h-12 w-full flex justify-center items-end gap-[2px] overflow-hidden opacity-80">
             {shipment.trackingCode.split('').map((char:string, i:number) => (
                <div key={i} style={{
                   height: Math.random() > 0.5 ? '100%' : '70%',
                   width: Math.random() > 0.5 ? '4px' : '2px',
                   backgroundColor: 'black'
                }}></div>
             ))}
             {/* Rellenar */}
             {Array.from({length: 30}).map((_, i) => (
                <div key={i+100} style={{
                   height: Math.random() > 0.5 ? '100%' : '60%',
                   width: Math.random() > 0.5 ? '3px' : '1px',
                   backgroundColor: 'black'
                }}></div>
             ))}
          </div>
          <p className="text-[10px] mt-1 text-gray-500">CÓDIGO INTERNO DE LOGÍSTICA</p>
        </div>

        {/* QR (Simulado o real con API) */}
        <div className="absolute top-24 right-4 w-16 h-16 border border-black flex items-center justify-center bg-gray-100">
           <span className="text-[8px] text-center">QR SEGUIMIENTO</span>
        </div>

      </div>
    </div>
  );
}`,

  // ==========================================
  // 5. PÁGINA DE ETIQUETA (Route)
  // ==========================================
  'src/app/admin/envios/[id]/etiqueta/page.tsx': `import { prisma } from "@/lib/prisma";
import { ShippingLabel } from "@/components/shipping/ShippingLabel";
import { notFound } from "next/navigation";

export default async function EtiquetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } }
  });

  if (!shipment) return notFound();

  return <ShippingLabel shipment={shipment} />;
}`
};

function createFiles() {
  console.log('🚀 Creando Módulo de ENVÍOS y ETIQUETAS...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
'use client'
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
}
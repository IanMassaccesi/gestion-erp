// const fs = require('fs');
// const path = require('path');

// const files = {
//   // ==========================================
//   // 1. UTILIDAD: GENERADOR DE LINKS WHATSAPP
//   // ==========================================
//   'src/utils/whatsapp.ts': `
// export function getWhatsAppLink(phone: string | null | undefined, message: string) {
//   if (!phone) return "#";
  
//   // Limpieza básica de número (Argentina)
//   let cleanPhone = phone.replace(/[^0-9]/g, '');
//   if (!cleanPhone.startsWith('54')) cleanPhone = '54' + cleanPhone; // Asumimos AR por defecto
  
//   return \`https://wa.me/\${cleanPhone}?text=\${encodeURIComponent(message)}\`;
// }
// `,

//   // ==========================================
//   // 2. ACTIONS: LOGICA DE RUTAS Y STOCK
//   // ==========================================
//   'src/actions/routes-actions.ts': `'use server'

// import { prisma } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

// // AGREGAR O QUITAR PEDIDO DE UNA RUTA
// export async function toggleOrderInRoute(orderId: string, routeId: string | null) {
  
//   // Si agregamos a ruta, generamos código de entrega si no tiene
//   let updateData: any = { deliveryRouteId: routeId };
  
//   if (routeId) {
//     updateData.status = "DELIVERING"; // En camino
//     // Generar código simple de 4 dígitos si no existe
//     const code = Math.floor(1000 + Math.random() * 9000).toString();
//     updateData.deliveryCode = code; 
//     updateData.requiresCode = true;
//   } else {
//     updateData.status = "CONFIRMED"; // Vuelve a depósito
//     updateData.deliveryCode = null;
//     updateData.requiresCode = false;
//   }

//   await prisma.order.update({
//     where: { id: orderId },
//     data: updateData
//   });

//   revalidatePath("/admin/rutas");
//   if(routeId) revalidatePath(\`/admin/rutas/\${routeId}\`);
// }

// // FINALIZAR RUTA
// export async function completeRoute(routeId: string) {
//   // 1. Marcar ruta como completada
//   await prisma.deliveryRoute.update({
//     where: { id: routeId },
//     data: { status: "COMPLETED" }
//   });

//   // 2. Marcar todos los pedidos de esa ruta como ENTREGADOS
//   await prisma.order.updateMany({
//     where: { deliveryRouteId: routeId },
//     data: { status: "DELIVERED" }
//   });

//   revalidatePath("/admin/rutas");
// }`,

//   // ==========================================
//   // 3. ACTION: CANCELAR PEDIDO (DEVUELVE STOCK)
//   // ==========================================
//   'src/actions/orders-actions.ts': `'use server'

// import { prisma } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { PriceTier, PriceAdjustmentType } from "@prisma/client";
// import { getSession } from "@/lib/auth";

// // ... (Tu función createOrder anterior se mantiene igual aquí, NO LA BORRES, 
// // solo agregamos la función de cancelar abajo) ...

// export async function cancelOrder(orderId: string) {
//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//     include: { items: true }
//   });

//   if (!order || order.status === 'CANCELLED') return;

//   // TRANSACCIÓN PARA DEVOLVER STOCK
//   await prisma.$transaction(async (tx) => {
//     // 1. Devolver stock de cada item
//     for (const item of order.items) {
//       await tx.product.update({
//         where: { id: item.productId },
//         data: { currentStock: { increment: item.quantity } }
//       });
//     }

//     // 2. Marcar pedido como cancelado
//     await tx.order.update({
//       where: { id: orderId },
//       data: { status: "CANCELLED" }
//     });
//   });

//   revalidatePath("/admin/pedidos");
//   redirect("/admin/pedidos");
// }

// // ... (Asegúrate de mantener createOrder aquí) ...
// `,

//   // ==========================================
//   // 4. VISTA: GESTIÓN DE RUTA (SUBIR/BAJAR PEDIDOS)
//   // ==========================================
//   'src/app/admin/rutas/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
// import { toggleOrderInRoute, completeRoute } from "@/actions/routes-actions";
// import { getWhatsAppLink } from "@/utils/whatsapp";
// import Link from "next/link";
// import { ArrowLeft, CheckCircle, MapPin, MessageCircle, MinusCircle, PlusCircle, Truck } from "lucide-react";

// export default async function DetalleRutaPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
  
//   // 1. Datos de la Ruta
//   const route = await prisma.deliveryRoute.findUnique({
//     where: { id },
//     include: { 
//         driver: true, 
//         orders: { include: { customer: true } } 
//     }
//   });

//   if (!route) return <div>Ruta no encontrada</div>;

//   // 2. Pedidos "Sueltos" (Confirmados, sin ruta asignada) para poder agregarlos
//   const availableOrders = await prisma.order.findMany({
//     where: { 
//         status: "CONFIRMED", 
//         deliveryRouteId: null 
//     },
//     include: { customer: true }
//   });

//   const isCompleted = route.status === "COMPLETED";

//   return (
//     <div className="space-y-6 pb-20">
      
//       {/* HEADER */}
//       <div className="flex justify-between items-start">
//         <div className="flex items-center gap-4">
//             <Link href="/admin/rutas" className="p-2 bg-brand-card rounded-full text-brand-muted"><ArrowLeft /></Link>
//             <div>
//                 <h1 className="text-2xl font-bold font-heading text-white">{route.name}</h1>
//                 <div className="flex gap-2 text-brand-muted text-sm">
//                     <span className="flex items-center gap-1"><Truck size={14}/> {route.driver?.firstName || "Sin Chofer"}</span>
//                     <span>•</span>
//                     <span>{new Date(route.date).toLocaleDateString()}</span>
//                 </div>
//             </div>
//         </div>
        
//         {!isCompleted && (
//             <form action={async () => { 'use server'; await completeRoute(id); }}>
//                 <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-neon transition-all">
//                     <CheckCircle size={18} /> Finalizar Recorrido
//                 </button>
//             </form>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
//         {/* COLUMNA 1: PEDIDOS EN LA RUTA (YA CARGADOS) */}
//         <div className="space-y-4">
//             <h2 className="text-xl font-bold text-brand-primary flex items-center gap-2">
//                 <Truck /> Carga Actual ({route.orders.length})
//             </h2>
            
//             {route.orders.length === 0 && <p className="text-brand-muted italic">El camión está vacío.</p>}

//             {route.orders.map(order => {
//                 // Generar Link de WhatsApp con el código
//                 const msg = \`Hola \${order.customer.firstName}! Tu pedido de TodoKiosco está en camino 🚚. \n\n🔒 Tu código de seguridad es: *\${order.deliveryCode}*\n\nPor favor dáselo al chofer al recibir.\`;
//                 const waLink = getWhatsAppLink(order.customer.phone, msg);

//                 return (
//                     <div key={order.id} className="bg-brand-card border border-brand-primary/30 p-4 rounded-xl relative group">
//                         <div className="flex justify-between">
//                             <div>
//                                 <h3 className="font-bold text-white">{order.customer.firstName} {order.customer.lastName}</h3>
//                                 <p className="text-sm text-brand-muted flex items-center gap-1"><MapPin size={12}/> {order.shippingAddress}</p>
//                                 <div className="mt-2 flex items-center gap-3">
//                                     <span className="bg-brand-dark px-2 py-1 rounded text-xs font-mono border border-brand-border text-brand-primary">
//                                         CÓD: {order.deliveryCode || "---"}
//                                     </span>
//                                     <a 
//                                         href={waLink} 
//                                         target="_blank" 
//                                         className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs font-bold"
//                                     >
//                                         <MessageCircle size={14} /> Enviar Código
//                                     </a>
//                                 </div>
//                             </div>
                            
//                             {!isCompleted && (
//                                 <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, null); }}>
//                                     <button className="text-red-400 hover:text-red-300 p-2" title="Bajar del camión">
//                                         <MinusCircle size={20} />
//                                     </button>
//                                 </form>
//                             )}
//                         </div>
//                     </div>
//                 );
//             })}
//         </div>

//         {/* COLUMNA 2: PEDIDOS DISPONIBLES (PARA SUBIR) */}
//         {!isCompleted && (
//             <div className="space-y-4">
//                 <h2 className="text-xl font-bold text-brand-muted flex items-center gap-2">
//                     <MapPin /> Disponibles en Depósito
//                 </h2>
                
//                 {availableOrders.length === 0 && <p className="text-brand-muted italic">No hay pedidos pendientes.</p>}

//                 {availableOrders.map(order => (
//                     <div key={order.id} className="bg-brand-card/50 border border-brand-border p-4 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
//                         <div>
//                             <h3 className="font-bold text-white">{order.customer.firstName} {order.customer.lastName}</h3>
//                             <p className="text-sm text-brand-muted">{order.shippingAddress}</p>
//                             <p className="text-xs text-brand-primary font-bold mt-1">\$\${order.total.toLocaleString()}</p>
//                         </div>
//                         <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, id); }}>
//                             <button className="text-brand-primary hover:text-white p-2" title="Subir al camión">
//                                 <PlusCircle size={24} />
//                             </button>
//                         </form>
//                     </div>
//                 ))}
//             </div>
//         )}

//       </div>
//     </div>
//   );
// }`,

//   // ==========================================
//   // 5. VISTA: DETALLE DE PEDIDO (BOTÓN CANCELAR)
//   // ==========================================
//   // Reemplazamos la vista de detalle para agregar el botón de borrar
//   'src/app/admin/pedidos/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
// import { InvoiceButton } from "@/components/orders/InvoiceButton";
// import { cancelOrder } from "@/actions/orders-actions";
// import Link from "next/link";
// import { ArrowLeft, Trash2 } from "lucide-react";

// export default async function DetallePedidoPage({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
//   const order = await prisma.order.findUnique({
//     where: { id },
//     include: { customer: true, items: { include: { product: true } } }
//   });

//   if (!order) return <div>No encontrado</div>;

//   const canEdit = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'DRAFT';

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//             <Link href="/admin/pedidos" className="p-2 bg-brand-card rounded-full text-brand-muted"><ArrowLeft /></Link>
//             <div>
//                 <h1 className="text-2xl font-bold font-heading text-white">Pedido {order.orderNumber}</h1>
//                 <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded border border-brand-primary/30">{order.status}</span>
//             </div>
//         </div>
//         <div className="flex gap-2">
//             {/* Solo mostramos botón borrar si no está en viaje/entregado */}
//             {canEdit && (
//                 <form action={async () => { 'use server'; await cancelOrder(id); }}>
//                     <button className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-red-500/50 transition-all">
//                         <Trash2 size={18} /> Cancelar y Reponer Stock
//                     </button>
//                 </form>
//             )}
//             <InvoiceButton order={order} />
//         </div>
//       </div>

//       <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
//         {/* ... (Resto de tu detalle visual igual que antes) ... */}
//         <h3 className="text-brand-primary font-bold mb-4 border-b border-brand-border pb-2">Items</h3>
//         {order.items.map(item => (
//             <div key={item.id} className="flex justify-between py-2 border-b border-brand-border/50 text-brand-text">
//                 <span>{item.quantity} x {item.product.name}</span>
//                 <span>\$\${item.subtotal}</span>
//             </div>
//         ))}
//         <div className="mt-4 flex justify-end text-xl font-bold text-white">
//             Total: \$\${order.total}
//         </div>
//       </div>
//     </div>
//   );
// }`
// };

// function createFiles() {
//   console.log('🚀 Implementando Logística Avanzada (WhatsApp, Stock Restore, Route Mgmt)...');
//   for (const [filePath, content] of Object.entries(files)) {
//     const absolutePath = path.join(process.cwd(), filePath);
//     const dir = path.dirname(absolutePath);
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     fs.writeFileSync(absolutePath, content);
//     console.log(`✅ Creado: ${filePath}`);
//   }
// }
// createFiles();
const fs = require('fs');
const path = require('path');

const files = {
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// =======================================================
// 1. FUNCIÓN CREAR PEDIDO (Con Stock y Comisiones)
// =======================================================
export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0 // Parámetro de comisión
) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "No estás autorizado para crear pedidos." };
  }

  if (!customerId || items.length === 0) {
    return { error: "Falta el cliente o productos en el pedido" };
  }

  let newOrderId = "";

  try {
    await prisma.$transaction(async (tx) => {
      
      // Buscar productos
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      let subtotalOrder = 0;
      const orderItemsData = [];

      // Procesar Items
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        
        if (!product) throw new Error(\`Producto con ID \${item.productId} no encontrado\`);

        if (product.currentStock < item.quantity) {
          throw new Error(\`Stock insuficiente para "\${product.name}". Disponibles: \${product.currentStock}\`);
        }

        // Precios
        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          case "FINAL": basePrice = product.priceFinal; break;
          default: basePrice = product.priceFinal;
        }

        let unitPrice = basePrice;
        // Ajustes simples (opcional)
        unitPrice = Math.max(0, unitPrice);
        
        const subtotal = unitPrice * item.quantity;
        subtotalOrder += subtotal;

        // RESTAR STOCK
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType || "NONE",
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: unitPrice,
          subtotal: subtotal
        });
      }

      // CALCULAR TOTALES + COMISIÓN
      const adminFee = subtotalOrder * (feePercent / 100);
      const totalOrder = subtotalOrder + adminFee;
      const orderNumber = \`PED-\${Date.now().toString().slice(-6)}\`;

      // CREAR PEDIDO
      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customerId } },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: subtotalOrder,
          adminFee: adminFee,
          total: totalOrder,
          status: "CONFIRMED", // Nace confirmado
          items: {
            create: orderItemsData
          },
          user: { connect: { id: userId } }
        }
      });
      
      newOrderId = order.id;
    });

  } catch (error: any) {
    console.error("Error en transacción:", error);
    return { error: error.message || "Error al procesar el pedido." };
  }

  // Revalidar y Redirigir
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos");
  revalidatePath("/corredor/pedidos"); // Actualizar vista del corredor
  
  // Si soy admin voy al detalle admin, si soy corredor al dashboard (o detalle)
  // Por simplicidad, redirigimos al detalle genérico que sirve a ambos si la ruta es accesible
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}

// =======================================================
// 2. FUNCIÓN CANCELAR PEDIDO (Devolver Stock)
// =======================================================
export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    // 1. Devolver stock de cada item
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
    }

    // 2. Marcar pedido como cancelado
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos");
  redirect("/admin/pedidos");
}`
};

function createFiles() {
  console.log('🚀 Restaurando Logic Orders (Create + Cancel)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Restaurado: ${filePath}`);
  }
}
createFiles();
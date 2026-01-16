const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. FIX SINTAXIS: ROUTES ACTIONS (Limpio)
  // ==========================================
  'src/actions/routes-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

// --- CREAR RUTA ---
export async function createRoute(formData: FormData) {
  const name = formData.get("name") as string;
  const driverId = formData.get("driverId") as string;
  const dateStr = formData.get("date") as string;
  const orderIds = formData.getAll("orderIds") as string[];

  if (!name || !dateStr) return { error: "Faltan datos" };

  let newRouteId = "";

  try {
    const newRoute = await prisma.deliveryRoute.create({
      data: {
        routeNumber: name,
        driverId: driverId && driverId !== "null" ? driverId : null,
        date: new Date(dateStr),
        status: "PENDING"
      }
    });
    newRouteId = newRoute.id;

    if (orderIds.length > 0) {
        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: { deliveryRouteId: newRoute.id, status: 'DELIVERING' }
        });
    }

    await registrarLog("CREAR_RUTA", \`Creó ruta \${name} con \${orderIds.length} pedidos\`, "RUTA");

  } catch (error) {
    console.error("Error al crear ruta:", error);
    return { error: "Error al crear la ruta" };
  }

  revalidatePath("/admin/rutas");
  redirect(\`/admin/rutas/\${newRouteId}\`);
}

// --- GESTIÓN DE PEDIDOS EN RUTA ---
export async function toggleOrderInRoute(orderId: string, routeId: string | null) {
  let updateData: any = { deliveryRouteId: routeId };
  if (routeId) {
    updateData.status = "DELIVERING"; 
    updateData.deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    updateData.requiresCode = true;
  } else {
    updateData.status = "CONFIRMED";
    updateData.deliveryCode = null;
    updateData.requiresCode = false;
  }

  await prisma.order.update({ where: { id: orderId }, data: updateData });
  
  await registrarLog("MODIFICAR_RUTA", \`Movió pedido \${orderId} \${routeId ? 'a ruta' : 'fuera de ruta'}\`, "RUTA");

  revalidatePath("/admin/rutas");
  if(routeId) revalidatePath(\`/admin/rutas/\${routeId}\`);
}

// --- COMPLETAR RUTA ---
export async function completeRoute(routeId: string) {
  await prisma.deliveryRoute.update({ where: { id: routeId }, data: { status: "COMPLETED" } });
  await prisma.order.updateMany({ where: { deliveryRouteId: routeId }, data: { status: "DELIVERED" } });

  await registrarLog("COMPLETAR_RUTA", \`Finalizó ruta ID: \${routeId}\`, "RUTA");
  await sendNotificationToAdmins("Ruta Completada", "El camión ha finalizado su recorrido.", "SYSTEM");

  revalidatePath("/admin/rutas");
  redirect("/admin/rutas");
}

// --- ENTREGAR PEDIDO ---
export async function deliverOrder(orderId: string, inputCode?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado" };

  if (order.requiresCode && order.deliveryCode) {
    if (inputCode !== order.deliveryCode) return { error: "Código incorrecto" }; 
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveryDate: new Date() }
  });

  await registrarLog("ENTREGA_PEDIDO", \`Entregó pedido \${order.orderNumber}\`, "RUTA");

  if (order.deliveryRouteId) revalidatePath(\`/admin/rutas/\${order.deliveryRouteId}\`);
  revalidatePath(\`/admin/rutas\`); 
}`,

  // ==========================================
  // 2. ORDERS ACTIONS (Con Notificación de Pago Revocado)
  // ==========================================
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions"; 
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// --- CREAR PEDIDO ---
export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0
) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { error: "No autorizado." };
  if (!customerId || items.length === 0) return { error: "Faltan datos." };

  let newOrderId = "";
  let orderNumberLog = "";
  let totalLog = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);
        
        // Control de Stock
        if (product.trackStock) {
            if (product.currentStock < item.quantity) {
                throw new Error(\`Stock insuficiente para \${product.name}\`);
            }
            await tx.product.update({
                where: { id: product.id },
                data: { currentStock: { decrement: item.quantity } }
            });
        }

        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          default: basePrice = product.priceFinal;
        }

        const subtotal = basePrice * item.quantity;
        subtotalOrder += subtotal;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType || "NONE",
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: basePrice,
          subtotal: subtotal
        });
      }

      const adminFee = subtotalOrder * (feePercent / 100);
      const totalOrder = subtotalOrder + adminFee;
      totalLog = totalOrder;
      
      const orderNumber = "PED-" + Date.now().toString().slice(-6);
      orderNumberLog = orderNumber;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customerId } },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: subtotalOrder,
          adminFee: adminFee,
          total: totalOrder,
          status: "NO_PAGO", 
          items: { create: orderItemsData },
          user: { connect: { id: userId } }
        }
      });
      newOrderId = order.id;
    });

    await registrarLog("CREAR_PEDIDO", \`Creó pedido \${orderNumberLog} (\$\${totalLog.toFixed(2)})\`, "PEDIDO");
    
    await sendNotificationToAdmins(
        "Nuevo Pedido", 
        \`Se generó el pedido \${orderNumberLog} por \$\${totalLog.toFixed(2)}\`, 
        "ORDER"
    );

  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message || "Error al procesar." };
  }

  revalidatePath("/admin/pedidos");
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}

// --- ACTUALIZAR ESTADO (Con Notificación Mejorada) ---
export async function updateOrderStatus(orderId: string, newStatus: any) {
  const oldOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, orderNumber: true } });
  
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });

  if (oldOrder) {
    await registrarLog("CAMBIO_ESTADO", \`Pedido \${oldOrder.orderNumber}: \${oldOrder.status} -> \${newStatus}\`, "PEDIDO");
    
    // Notificar si se paga
    if (newStatus === 'PAGO') {
        await sendNotificationToAdmins("Pago Recibido", \`El pedido \${oldOrder.orderNumber} ha sido marcado como PAGADO.\`, "ORDER");
    }
    
    // Notificar si se revoca el pago (PAGO -> NO_PAGO)
    if (oldOrder.status === 'PAGO' && newStatus === 'NO_PAGO') {
        await sendNotificationToAdmins("Pago Revocado", \`El pedido \${oldOrder.orderNumber} ha vuelto a estado NO PAGADO.\`, "ORDER");
    }
  }

  revalidatePath("/admin/pedidos");
}

export async function markOrdersAsPrinted(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  await prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { status: 'IMPRESO' } });
  await registrarLog("HOJA_RUTA", \`Generó hoja de ruta para \${orderIds.length} pedidos.\`, "RUTA");
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.product.trackStock) {
          await tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: item.quantity } } });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });

  await registrarLog("CANCELAR_PEDIDO", \`Canceló el pedido \${order.orderNumber}.\`, "PEDIDO");
  await sendNotificationToAdmins("Pedido Cancelado", \`El pedido \${order.orderNumber} fue cancelado.\`, "ORDER");

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function getFilteredOrders(status?: string, search?: string) {
  const where: any = {};
  if (status && status !== 'TODOS') where.status = status;
  else if (!status) where.status = { notIn: ['IMPRESO', 'CANCELLED', 'DELIVERED'] };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  return await prisma.order.findMany({ where, include: { customer: true, user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
}`
};

function createFiles() {
  console.log('🚀 Reparando sintaxis de rutas y mejorando notificaciones...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
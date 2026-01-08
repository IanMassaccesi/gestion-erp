'use server'

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
        
        if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado`);

        if (product.currentStock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponibles: ${product.currentStock}`);
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
      const orderNumber = `PED-${Date.now().toString().slice(-6)}`;

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
  redirect(`/admin/pedidos/${newOrderId}`);
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
}
const fs = require('fs');
const path = require('path');

const files = {
  // --- ACTUALIZACIÓN: LÓGICA DE PEDIDOS CON CONTROL DE STOCK ---
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string
) {
  if (!customerId || items.length === 0) {
    return { error: "Falta el cliente o productos en el pedido" };
  }

  try {
    // USAMOS UNA TRANSACCIÓN ($transaction)
    // Esto asegura que la resta de stock y la creación del pedido ocurran juntas o fallen juntas.
    await prisma.$transaction(async (tx) => {
      
      // 1. Buscamos los productos dentro de la transacción
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      let totalOrder = 0;
      const orderItemsData = [];

      // 2. Procesamos cada item (Validar Stock, Calcular Precio, Restar Stock)
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        
        // Validación A: ¿Existe el producto?
        if (!product) throw new Error(\`Producto con ID \${item.productId} no encontrado\`);

        // Validación B: ¿Hay stock suficiente?
        if (product.currentStock < item.quantity) {
          throw new Error(\`Stock insuficiente para "\${product.name}". Disponibles: \${product.currentStock}, Solicitados: \${item.quantity}\`);
        }

        // CÁLCULO DE PRECIOS (Igual que antes)
        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          case "FINAL": basePrice = product.priceFinal; break;
          default: basePrice = product.priceFinal;
        }

        let unitPrice = basePrice;
        if (item.adjustmentType === "FIXED_PRICE" && item.adjustmentValue) unitPrice = item.adjustmentValue;
        else if (item.adjustmentType === "PERCENTAGE_OFF" && item.adjustmentValue) unitPrice = basePrice * (1 - (item.adjustmentValue / 100));
        else if (item.adjustmentType === "PERCENTAGE_MARKUP" && item.adjustmentValue) unitPrice = basePrice * (1 + (item.adjustmentValue / 100));

        unitPrice = Math.max(0, unitPrice);
        const subtotal = unitPrice * item.quantity;
        totalOrder += subtotal;

        // ACCIÓN CRÍTICA: Restar el stock en la base de datos
        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        // Preparamos datos para crear el item del pedido
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType,
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: unitPrice,
          subtotal: subtotal
        });
      }

      // 3. Crear el Pedido (Solo si todo lo anterior pasó sin errores)
      const orderNumber = \`PED-\${Date.now().toString().slice(-6)}\`;

      await tx.order.create({
        data: {
          orderNumber,
          customer: {
             connect: { id: customerId } // Sintaxis correcta para Prisma
          },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: totalOrder,
          total: totalOrder,
          status: "CONFIRMED",
          items: {
            create: orderItemsData
          },
          user: { connect: { email: 'admin@tuempresa.com' } }
        }
      });
    });

  } catch (error: any) {
    console.error("Error en transacción de pedido:", error);
    // Devolvemos el mensaje de error exacto (ej: "Stock insuficiente...")
    return { error: error.message || "Error al procesar el pedido." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos"); // Revalidamos productos para ver el stock nuevo
  revalidatePath("/admin/dashboard");
  redirect("/admin/pedidos");
}`
};

function createFiles() {
  console.log('🚀 Actualizando Lógica de Pedidos (Ahora con CONTROL DE STOCK)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
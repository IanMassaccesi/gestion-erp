'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createShipment(orderId: string) {
  // 1. Generar Código de Seguimiento (Simulación AR)
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const trackingCode = `CP${timestamp}${random}AR`;

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
}
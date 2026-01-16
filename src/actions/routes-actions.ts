'use server'

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

    await registrarLog("CREAR_RUTA", `Creó ruta ${name} con ${orderIds.length} pedidos`, "RUTA");

  } catch (error) {
    console.error("Error al crear ruta:", error);
    return { error: "Error al crear la ruta" };
  }

  revalidatePath("/admin/rutas");
  redirect(`/admin/rutas/${newRouteId}`);
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
  
  await registrarLog("MODIFICAR_RUTA", `Movió pedido ${orderId} ${routeId ? 'a ruta' : 'fuera de ruta'}`, "RUTA");

  revalidatePath("/admin/rutas");
  if(routeId) revalidatePath(`/admin/rutas/${routeId}`);
}

// --- COMPLETAR RUTA ---
export async function completeRoute(routeId: string) {
  await prisma.deliveryRoute.update({ where: { id: routeId }, data: { status: "COMPLETED" } });
  await prisma.order.updateMany({ where: { deliveryRouteId: routeId }, data: { status: "DELIVERED" } });

  await registrarLog("COMPLETAR_RUTA", `Finalizó ruta ID: ${routeId}`, "RUTA");
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

  await registrarLog("ENTREGA_PEDIDO", `Entregó pedido ${order.orderNumber}`, "RUTA");

  if (order.deliveryRouteId) revalidatePath(`/admin/rutas/${order.deliveryRouteId}`);
  revalidatePath(`/admin/rutas`); 
}
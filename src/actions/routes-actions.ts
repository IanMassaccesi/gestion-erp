'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ==========================================
// 1. CREAR RUTA + ASIGNAR PEDIDOS
// ==========================================
export async function createRoute(formData: FormData) {
  const name = formData.get("name") as string;
  const driverId = formData.get("driverId") as string;
  const dateStr = formData.get("date") as string;
  
  // CAPTURAR LOS CHECKBOXES (Esto devuelve un array de strings)
  const orderIds = formData.getAll("orderIds") as string[];

  if (!name || !dateStr) {
    return { error: "Faltan datos obligatorios" };
  }

  let newRouteId = "";

  try {
    // 1. Crear la Ruta
    const newRoute = await prisma.deliveryRoute.create({
      data: {
        routeNumber: name, // Usamos el nombre como identificador visual
        driverId: driverId && driverId !== "null" ? driverId : null,
        date: new Date(dateStr),
        status: "PENDING"
      }
    });
    
    newRouteId = newRoute.id;

    // 2. Si se seleccionaron pedidos, los vinculamos a esta ruta
    if (orderIds.length > 0) {
        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
                deliveryRouteId: newRoute.id,
                status: 'DELIVERING' // Pasan a estado "En Reparto/Preparación"
            }
        });
    }

  } catch (error) {
    console.error("Error al crear ruta:", error);
    return { error: "Error al crear la ruta" };
  }

  revalidatePath("/admin/rutas");
  redirect(`/admin/rutas/${newRouteId}`);
}

// ==========================================
// 2. AGREGAR O QUITAR PEDIDO (Gestión)
// ==========================================
export async function toggleOrderInRoute(orderId: string, routeId: string | null) {
  let updateData: any = { deliveryRouteId: routeId };
  
  if (routeId) {
    // Si entra a una ruta -> Estado DELIVERING
    updateData.status = "DELIVERING"; 
    // Generar código de seguridad si no tiene
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    updateData.deliveryCode = code; 
    updateData.requiresCode = true;
  } else {
    // Si sale de la ruta -> Vuelve a CONFIRMED (En depósito)
    updateData.status = "CONFIRMED";
    updateData.deliveryCode = null;
    updateData.requiresCode = false;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updateData
  });

  revalidatePath("/admin/rutas");
  if(routeId) revalidatePath(`/admin/rutas/${routeId}`);
}

// ==========================================
// 3. FINALIZAR RUTA
// ==========================================
export async function completeRoute(routeId: string) {
  // 1. Marcar ruta como completada
  await prisma.deliveryRoute.update({
    where: { id: routeId },
    data: { status: "COMPLETED" }
  });

  // 2. Marcar todos los pedidos de esa ruta como ENTREGADOS
  await prisma.order.updateMany({
    where: { deliveryRouteId: routeId },
    data: { status: "DELIVERED" }
  });

  revalidatePath("/admin/rutas");
  redirect("/admin/rutas");
}

// ==========================================
// 4. ENTREGAR PEDIDO INDIVIDUAL (Nueva función)
// ==========================================
export async function deliverOrder(orderId: string, inputCode?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  if (!order) return { error: "Pedido no encontrado" };

  // Validar código si es requerido y existe
  if (order.requiresCode && order.deliveryCode) {
    // Si el código ingresado no coincide con el de la base de datos
    if (inputCode !== order.deliveryCode) {
        return { error: "Código incorrecto" }; 
    }
  }

  // Actualizar estado a ENTREGADO
  await prisma.order.update({
    where: { id: orderId },
    data: { 
        status: "DELIVERED", 
        deliveryDate: new Date() 
    }
  });

  // Revalidar para que se actualice la vista
  if (order.deliveryRouteId) {
    revalidatePath(`/admin/rutas/${order.deliveryRouteId}`);
  }
  revalidatePath(`/admin/rutas`); 
}
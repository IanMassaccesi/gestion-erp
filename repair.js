const fs = require('fs');
const path = require('path');

const files = {
  'src/actions/routes-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ==========================================
// 1. CREAR NUEVA RUTA (La que faltaba)
// ==========================================
export async function createRoute(formData: FormData) {
  const name = formData.get("name") as string;
  const driverId = formData.get("driverId") as string;
  const dateStr = formData.get("date") as string;

  if (!name || !dateStr) {
    return { error: "Faltan datos obligatorios" };
  }

  try {
    const newRoute = await prisma.deliveryRoute.create({
      data: {
        name,
        driverId: driverId && driverId !== "null" ? driverId : null,
        date: new Date(dateStr),
        status: "PENDING"
      }
    });

    revalidatePath("/admin/rutas");
    // Redirigimos directo al detalle para empezar a cargar pedidos
    redirect(\`/admin/rutas/\${newRoute.id}\`); 
  } catch (error) {
    console.error(error);
    return { error: "Error al crear la ruta" };
  }
}

// ==========================================
// 2. AGREGAR O QUITAR PEDIDO (Gestión)
// ==========================================
export async function toggleOrderInRoute(orderId: string, routeId: string | null) {
  
  let updateData: any = { deliveryRouteId: routeId };
  
  if (routeId) {
    // Si entra a una ruta -> Estado DELIVERING (En Reparto/Preparación)
    updateData.status = "DELIVERING"; 
    // Generar código de seguridad si no tiene
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    // Solo asignamos código nuevo si no tenía uno previo para no marear al cliente
    // (O podemos sobrescribirlo siempre, depende de tu lógica. Aquí lo generamos siempre para asegurar)
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
  if(routeId) revalidatePath(\`/admin/rutas/\${routeId}\`);
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
}`
};

function createFiles() {
  console.log('🚀 Restaurando Routes Actions (Create + Manage + Complete)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Restaurado: ${filePath}`);
  }
}
createFiles();
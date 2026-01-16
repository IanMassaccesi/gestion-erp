const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. CLIENTS ACTIONS: Definir businessName
  // ==========================================
  'src/actions/clients-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

export async function createClient(formData: FormData) {
  const session = await getSession();
  const userId = session?.user?.id;

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string;
  
  // CORRECCIÓN: Extraemos la variable aquí para poder usarla en la notificación
  const businessName = formData.get("businessName") as string;

  if (!firstName || !lastName || !dniCuit || !address) return { error: "Faltan datos obligatorios" };

  try {
    await prisma.customer.create({
      data: { 
        firstName, lastName, dniCuit, email: email || null, phone, address, type, 
        businessName: type === 'MAYORISTA' ? businessName : null, 
        isDeleted: false, createdById: userId 
      }
    });
    
    await registrarLog("CREAR_CLIENTE", \`Alta de cliente: \${firstName} \${lastName} (\${dniCuit})\`, "CLIENTE");
    
    // Ahora 'businessName' existe en este ámbito
    if (type === 'MAYORISTA') {
        await sendNotificationToAdmins("Nuevo Mayorista", \`Se registró el cliente mayorista \${businessName || lastName}\`, "SYSTEM");
    }

  } catch (error: any) {
    return { error: "Error: DNI o Email duplicado." };
  }

  revalidatePath("/admin/clientes");
  if (origin === "mobile") redirect("/corredor/pedidos");
  else redirect("/admin/clientes");
}

export async function updateClient(id: string, formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    
    await prisma.customer.update({ where: { id }, data: { firstName, lastName, address, phone } });
    await registrarLog("EDITAR_CLIENTE", \`Modificó datos del cliente ID: \${id}\`, "CLIENTE");
  
    revalidatePath("/admin/clientes");
    redirect("/admin/clientes");
}
  
export async function deleteClient(id: string) {
    await prisma.customer.update({ where: { id }, data: { isDeleted: true } });
    await registrarLog("ELIMINAR_CLIENTE", \`Eliminó (soft-delete) cliente ID: \${id}\`, "CLIENTE");
    revalidatePath("/admin/clientes");
}`,

  // ==========================================
  // 2. SHIPPING ACTIONS: Recibir FormData
  // ==========================================
  'src/actions/shipping-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// CORRECCIÓN: Ahora recibe FormData, no string
export async function createShipment(formData: FormData) {
  const orderId = formData.get("orderId") as string;

  if (!orderId) return { error: "ID de pedido no encontrado" };

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
}`
};

function createFiles() {
  console.log('🚀 Corrigiendo errores de tipos TS (Clients y Shipping)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Corregido: ${filePath}`);
  }
}
createFiles();
'use server'
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
    
    await registrarLog("CREAR_CLIENTE", `Alta de cliente: ${firstName} ${lastName} (${dniCuit})`, "CLIENTE");
    
    // Ahora 'businessName' existe en este ámbito
    if (type === 'MAYORISTA') {
        await sendNotificationToAdmins("Nuevo Mayorista", `Se registró el cliente mayorista ${businessName || lastName}`, "SYSTEM");
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
    await registrarLog("EDITAR_CLIENTE", `Modificó datos del cliente ID: ${id}`, "CLIENTE");
  
    revalidatePath("/admin/clientes");
    redirect("/admin/clientes");
}
  
export async function deleteClient(id: string) {
    await prisma.customer.update({ where: { id }, data: { isDeleted: true } });
    await registrarLog("ELIMINAR_CLIENTE", `Eliminó (soft-delete) cliente ID: ${id}`, "CLIENTE");
    revalidatePath("/admin/clientes");
}
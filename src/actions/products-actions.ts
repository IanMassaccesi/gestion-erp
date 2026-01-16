'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = formData.get("category") as string;
  const priceMayor = parseFloat(formData.get("priceMayor") as string) || 0;
  const priceMinor = parseFloat(formData.get("priceMinor") as string) || 0;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  
  // Lógica de Stock Opcional
  const trackStock = formData.get("trackStock") === "on"; // Checkbox
  const currentStock = trackStock ? (parseInt(formData.get("currentStock") as string) || 0) : 0;
  const minStock = trackStock ? (parseInt(formData.get("minStock") as string) || 0) : 0;

  await prisma.product.create({
    data: { 
        name, code, category, 
        priceMayor, priceMinor, priceFinal, 
        currentStock, minStock, trackStock,
        unit: "UNIDAD", isActive: true, isDeleted: false 
    }
  });

  await registrarLog("CREAR_PRODUCTO", `Nuevo producto: ${name} (${code}) - Stock: ${trackStock ? currentStock : 'No Controla'}`, "PRODUCTO");
  // Notificación opcional (solo logs para no spamear)

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  
  const trackStock = formData.get("trackStock") === "on";
  const currentStock = trackStock ? (parseInt(formData.get("currentStock") as string) || 0) : 0;

  await prisma.product.update({ 
    where: { id }, 
    data: { name, priceFinal, currentStock, trackStock } 
  });
  
  await registrarLog("EDITAR_PRODUCTO", `Actualizó producto: ${name}`, "PRODUCTO");

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { isDeleted: true } });
  
  await registrarLog("ELIMINAR_PRODUCTO", `Eliminó producto ID: ${id}`, "PRODUCTO");
  // Notificación crítica
  await sendNotificationToAdmins("Producto Eliminado", `Se eliminó el producto ID ${id} del sistema.`, "SYSTEM");

  revalidatePath("/admin/productos");
}
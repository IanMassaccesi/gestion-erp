'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- CREAR ---
export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = formData.get("category") as string;
  const priceMayor = parseFloat(formData.get("priceMayor") as string) || 0;
  const priceMinor = parseFloat(formData.get("priceMinor") as string) || 0;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  const currentStock = parseInt(formData.get("currentStock") as string) || 0;
  const minStock = parseInt(formData.get("minStock") as string) || 0;

  await prisma.product.create({
    data: { name, code, category, unit: "UNIDAD", priceMayor, priceMinor, priceFinal, currentStock, minStock, isActive: true, isDeleted: false }
  });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

// --- EDITAR ---
export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  const currentStock = parseInt(formData.get("currentStock") as string) || 0;
  
  // Por simplicidad en la demo actualizamos lo básico, puedes agregar todos los campos
  await prisma.product.update({
    where: { id },
    data: { name, priceFinal, currentStock }
  });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

// --- BORRAR ---
export async function deleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/productos");
}
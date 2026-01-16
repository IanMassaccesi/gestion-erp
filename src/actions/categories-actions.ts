'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// OBTENER CATEGORÍAS
export async function getCategories() {
  return await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

// CREAR CATEGORÍA
export async function createCategory(name: string, prefix: string) {
  if (!name || !prefix) return { error: "Nombre y prefijo requeridos" };
  
  try {
    await prisma.category.create({
      data: { name, prefix: prefix.toUpperCase() }
    });
    revalidatePath("/admin/productos/nuevo");
    return { success: true };
  } catch (e) {
    return { error: "La categoría ya existe." };
  }
}

// BORRAR CATEGORÍA
export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/productos/nuevo");
}

// GENERAR SKU AUTOMÁTICO
export async function generateSKU(prefix: string) {
  if (!prefix) return "";

  // Buscar el último producto con ese prefijo
  const lastProduct = await prisma.product.findFirst({
    where: { code: { startsWith: `${prefix}-` } },
    orderBy: { code: 'desc' }, // Ordenar para obtener el último
    select: { code: true }
  });

  if (!lastProduct || !lastProduct.code) {
    return `${prefix}-001`; // Primero de la serie
  }

  // Extraer número: CIG-014 -> 14
  const parts = lastProduct.code.split('-');
  const lastNumber = parseInt(parts[parts.length - 1]);

  if (isNaN(lastNumber)) return `${prefix}-001`; // Fallback

  const nextNumber = lastNumber + 1;
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
}
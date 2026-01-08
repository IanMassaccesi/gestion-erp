'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";

// CREAR USUARIO
export async function createStaff(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isRunner = formData.get("isRunner") === "on";
  const isDriver = formData.get("isDriver") === "on";
  
  // Capturamos la comisión (si viene vacía es 0)
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0;

  if (!firstName || !lastName || !email || !password) return { error: "Faltan datos" };

  try {
    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: {
        firstName, lastName, email, 
        password: hashedPassword,
        role: "CORREDOR",
        isRunner, isDriver,
        commissionRate // Guardamos el %
      }
    });
  } catch (error) {
    return { error: "Error: Email ya existe." };
  }

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo");
}

// EDITAR USUARIO (NUEVA FUNCIÓN)
export async function updateStaff(id: string, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const isRunner = formData.get("isRunner") === "on";
  const isDriver = formData.get("isDriver") === "on";
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0;

  // Si mandan password, lo hasheamos, si no, lo ignoramos
  const password = formData.get("password") as string;
  const dataToUpdate: any = { firstName, lastName, email, isRunner, isDriver, commissionRate };
  
  if (password) {
    dataToUpdate.password = await hash(password, 12);
  }

  await prisma.user.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo");
}
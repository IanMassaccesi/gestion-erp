'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function createClient(formData: FormData) {
  // 1. Log de entrada
  console.log("📝 Intentando crear cliente...");

  const session = await getSession();
  const userId = session?.user?.id;
  
  // Si no hay usuario, esto podría ser un problema si tu BD lo exige, 
  // pero lo definimos como opcional (?) así que debería pasar como null.
  console.log("👤 Usuario Creador ID:", userId || "Sistema/Admin");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string;

  if (!firstName || !lastName || !dniCuit || !address) {
    console.error("❌ Faltan datos obligatorios");
    return { error: "Faltan campos obligatorios" };
  }

  try {
    const newClient = await prisma.customer.create({
      data: { 
        firstName, 
        lastName, 
        dniCuit, 
        email: email || null, 
        phone, 
        address, 
        type, 
        businessName: type === 'MAYORISTA' ? formData.get("businessName") as string : null, 
        isDeleted: false,
        createdById: userId, // Prisma maneja undefined como "no hacer nada" o null si es opcional
        city:"string",
      }
    });

    console.log("✅ Cliente creado exitosamente:", newClient.id);

  } catch (error: any) {
    // ESTO ES LO QUE NECESITAMOS VER
    console.error("🔥 ERROR PRISMA:", error.message); 
    
    // Devolvemos el error para que (idealmente) el front lo muestre
    return { error: "Error al guardar. Verifica DNI o Email duplicado." };
  }

  // Si llegamos acá, todo salió bien
  revalidatePath("/admin/clientes");
  
  if (origin === "mobile") {
    redirect("/corredor/pedidos");
  } else {
    redirect("/admin/clientes");
  }
}

// ... Mantén el resto de las funciones (updateClient, deleteClient) igual
export async function updateClient(id: string, formData: FormData) {
    // ... código existente ...
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    
    await prisma.customer.update({
      where: { id },
      data: { firstName, lastName, address, phone }
    });
  
    revalidatePath("/admin/clientes");
    redirect("/admin/clientes");
}
  
export async function deleteClient(id: string) {
    // ... código existente ...
    await prisma.customer.update({
        where: { id },
        data: { isDeleted: true }
      });
      revalidatePath("/admin/clientes");
}
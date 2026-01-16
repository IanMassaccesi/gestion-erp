const fs = require('fs');
const path = require('path');

const files = {
  'src/actions/shipping-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createShipment(formData: FormData) {
  const orderId = formData.get('orderId') as string;

  if (!orderId) return;

  // 1. VERIFICAR SI YA EXISTE (Para evitar el error P2002)
  const existingShipment = await prisma.shipment.findUnique({
    where: { orderId }
  });

  if (existingShipment) {
    // ¡Ya existe! No creamos uno nuevo, solo llevamos al usuario a la etiqueta.
    redirect(\`/admin/envios/\${existingShipment.id}/etiqueta\`);
  }

  // 2. SI NO EXISTE, LO CREAMOS
  // Generar código de seguimiento falso (Simulación Correo Argentino)
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const trackingCode = \`CP\${timestamp}\${random}AR\`;

  try {
    const newShipment = await prisma.shipment.create({
      data: {
        orderId,
        trackingCode,
        provider: "CORREO ARGENTINO",
        status: "PREPARACION"
      }
    });

    revalidatePath("/admin/envios");
    redirect(\`/admin/envios/\${newShipment.id}/etiqueta\`);
  } catch (error) {
    console.error("Error creando envío:", error);
    // En caso de error inesperado, redirigimos a la lista para no romper la UI
    redirect("/admin/envios");
  }
}`
};

function createFiles() {
  console.log('🚀 Reparando Shipping Action (Evitar duplicados)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Corregido: ${filePath}`);
  }
}
createFiles();
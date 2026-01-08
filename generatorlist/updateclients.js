const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. ACTION: GUARDAR CLIENTE CON DUEÑO ---
  'src/actions/clients-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth"; // Importamos para saber quién está logueado

// --- CREAR ---
export async function createClient(formData: FormData) {
  const session = await getSession(); // Obtenemos sesión
  const userId = session?.user?.id;

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string;

  if (!firstName || !lastName || !dniCuit || !address) {
    return { error: "Faltan campos obligatorios" };
  }

  try {
    await prisma.customer.create({
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
        createdById: userId // <--- AQUÍ GUARDAMOS EL DUEÑO
      }
    });
  } catch (error) {
    return { error: "Error al crear cliente (DNI duplicado)." };
  }

  revalidatePath("/admin/clientes");
  
  if (origin === "mobile") {
    redirect("/corredor/pedidos");
  } else {
    redirect("/admin/clientes");
  }
}

// --- EDITAR (Sin cambios, solo validamos ID si quisieras seguridad extra) ---
export async function updateClient(id: string, formData: FormData) {
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
  await prisma.customer.update({
    where: { id },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/clientes");
}`,

  // --- 2. ADMIN VIEW: VER DUEÑO DEL CLIENTE ---
  'src/app/admin/clientes/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { deleteClient } from "@/actions/clients-actions";

export default async function ClientesPage() {
  // Traemos el cliente Y los datos de quién lo creó (include: createdBy)
  const clients = await prisma.customer.findMany({ 
    where: { isDeleted: false }, 
    orderBy: { createdAt: 'desc' },
    include: { createdBy: true } 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-brand-primary">Clientes</h1>
        <Link href="/admin/clientes/nuevo" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex gap-2"><Plus /> Nuevo</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Vendedor</th> {/* Nueva Columna */}
              <th className="p-4">DNI/CUIT</th>
              <th className="p-4">Dirección</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-brand-dark">{c.firstName} {c.lastName}</td>
                <td className="p-4">
                  {/* Mostramos el nombre del vendedor o "Admin/Sistema" si es nulo */}
                  {c.createdBy ? (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                       <User size={12} /> {c.createdBy.firstName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Admin / Legacy</span>
                  )}
                </td>
                <td className="p-4">{c.dniCuit}</td>
                <td className="p-4">{c.address}</td>
                <td className="p-4 flex justify-end gap-2">
                  <Link href={\`/admin/clientes/\${c.id}\`} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></Link>
                  <form action={async () => { 'use server'; await deleteClient(c.id); }}>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

  // --- 3. CORREDOR VIEW: FILTRAR SOLO MIS CLIENTES ---
  'src/app/corredor/pedidos/page.tsx': `import { prisma } from "@/lib/prisma";
import { OrderFormMobile } from "@/components/orders/OrderFormMobile";
import { getSession } from "@/lib/auth";

export default async function MobilePedidosPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  // 1. Buscamos CLIENTES filtrados por el ID del usuario logueado
  // OJO: Si el usuario es ADMIN (role === 'ADMIN'), quizás quieras que vea todos. 
  // Aquí asumimos lógica estricta: solo ves lo que creaste o se te asignó.
  
  const whereCondition: any = { isDeleted: false };
  
  // Si NO es admin, filtramos por creador. (Si quieres que el admin vea todo en el móvil, descomenta la validación de rol)
  if (session?.user?.role !== 'ADMIN') {
      whereCondition.createdById = userId;
  }

  const [clients, products] = await Promise.all([
    prisma.customer.findMany({ 
      where: whereCondition, 
      select: { id: true, firstName: true, lastName: true, address: true } 
    }),
    prisma.product.findMany({ 
      where: { isDeleted: false }, 
      select: { id: true, name: true, priceFinal: true, priceMayor: true, currentStock: true } 
    })
  ]);

  return (
    <div className="pb-20">
      <h1 className="text-xl font-bold text-brand-primary mb-4 px-2">Tomar Pedido</h1>
      
      {clients.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded-xl mx-2 border border-dashed">
          <p className="mb-2">No tienes clientes en tu cartera.</p>
          <p className="text-xs">Agrega uno nuevo desde el inicio.</p>
        </div>
      ) : (
        <OrderFormMobile clients={clients} products={products} />
      )}
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Implementando CARTERA DE CLIENTES (Asignación y Filtros)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
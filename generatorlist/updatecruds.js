const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. ACTUALIZACIÓN ACTIONS (EDITAR Y BORRAR)
  // ==========================================

  'src/actions/clients-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- CREAR ---
export async function createClient(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string; // Para saber si vino del admin o corredor

  if (!firstName || !lastName || !dniCuit || !address) {
    return { error: "Faltan campos obligatorios" };
  }

  try {
    await prisma.customer.create({
      data: { firstName, lastName, dniCuit, email: email || null, phone, address, type, businessName: type === 'MAYORISTA' ? formData.get("businessName") as string : null, isDeleted: false }
    });
  } catch (error) {
    return { error: "Error al crear cliente (DNI duplicado)." };
  }

  revalidatePath("/admin/clientes");
  
  // Redirección inteligente según quién lo creó
  if (origin === "mobile") {
    redirect("/corredor/pedidos"); // Vuelve a la venta
  } else {
    redirect("/admin/clientes");
  }
}

// --- EDITAR ---
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

// --- BORRAR (Soft Delete) ---
export async function deleteClient(id: string) {
  await prisma.customer.update({
    where: { id },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/clientes");
}`,

  'src/actions/products-actions.ts': `'use server'
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
}`,

  // ==========================================
  // 2. VISTAS ADMIN: LISTADOS ACTUALIZADOS
  // ==========================================

  'src/app/admin/clientes/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteClient } from "@/actions/clients-actions";

export default async function ClientesPage() {
  const clients = await prisma.customer.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-brand-primary">Clientes</h1>
        <Link href="/admin/clientes/nuevo" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex gap-2"><Plus /> Nuevo</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b">
            <tr><th className="p-4">Nombre</th><th className="p-4">DNI/CUIT</th><th className="p-4">Dirección</th><th className="p-4 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-brand-dark">{c.firstName} {c.lastName}</td>
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

  'src/app/admin/productos/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products-actions";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-brand-primary">Productos</h1>
        <Link href="/admin/productos/nuevo" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex gap-2"><Plus /> Nuevo</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b">
             <tr><th className="p-4">Código</th><th className="p-4">Producto</th><th className="p-4">Stock</th><th className="p-4">Precio</th><th className="p-4 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-500">{p.code}</td>
                <td className="p-4 font-medium text-brand-dark">{p.name}</td>
                <td className="p-4 flex gap-2 items-center">
                  {p.currentStock <= p.minStock && <AlertTriangle size={16} className="text-amber-500" />}
                  <span className={p.currentStock <= p.minStock ? "font-bold text-amber-600" : ""}>{p.currentStock}</span>
                </td>
                <td className="p-4 font-bold text-brand-primary">\$\${p.priceFinal}</td>
                <td className="p-4 flex justify-end gap-2">
                  <Link href={\`/admin/productos/\${p.id}\`} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></Link>
                  <form action={async () => { 'use server'; await deleteProduct(p.id); }}>
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

  // ==========================================
  // 3. VISTAS ADMIN: PÁGINAS DE EDICIÓN
  // ==========================================

  'src/app/admin/clientes/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { updateClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.customer.findUnique({ where: { id } });
  if (!client) return <div>Cliente no encontrado</div>;

  const updateClientWithId = updateClient.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-brand-primary">Editar Cliente</h1>
      </div>
      <form action={updateClientWithId} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-bold block mb-1">Nombre</label><input name="firstName" defaultValue={client.firstName} className="w-full p-2 border rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Apellido</label><input name="lastName" defaultValue={client.lastName} className="w-full p-2 border rounded" /></div>
        </div>
        <div><label className="text-sm font-bold block mb-1">Dirección</label><input name="address" defaultValue={client.address} className="w-full p-2 border rounded" /></div>
        <div><label className="text-sm font-bold block mb-1">Teléfono</label><input name="phone" defaultValue={client.phone} className="w-full p-2 border rounded" /></div>
        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center gap-2"><Save /> Guardar Cambios</button>
      </form>
    </div>
  );
}`,

  'src/app/admin/productos/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/actions/products-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return <div>Producto no encontrado</div>;

  const updateProductWithId = updateProduct.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/productos" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-brand-primary">Editar Producto</h1>
      </div>
      <form action={updateProductWithId} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-bold block">Nombre</label>
            <input name="name" defaultValue={product.name} className="w-full p-2 border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div><label className="text-sm font-bold block mb-1">Precio Final</label><input type="number" step="0.01" name="priceFinal" defaultValue={product.priceFinal} className="w-full p-2 border rounded" /></div>
           <div><label className="text-sm font-bold block mb-1">Stock Actual</label><input type="number" name="currentStock" defaultValue={product.currentStock} className="w-full p-2 border rounded" /></div>
        </div>
        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center gap-2"><Save /> Guardar Cambios</button>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 4. VISTAS CORREDOR: ALTA DE CLIENTES MOBILE
  // ==========================================

  'src/app/corredor/clientes/nuevo/page.tsx': `import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClienteMobilePage() {
  return (
    <div className="pb-20">
      <div className="bg-brand-primary text-white p-4 sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <Link href="/corredor/dashboard"><ArrowLeft /></Link>
        <h1 className="font-bold text-lg">Nuevo Cliente</h1>
      </div>

      <form action={createClient} className="p-4 space-y-4">
        <input type="hidden" name="origin" value="mobile" /> {/* Marca de origen para el redirect */}
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-brand-primary uppercase">Datos Personales</h3>
            <input name="firstName" required placeholder="Nombre" className="w-full p-3 border rounded-lg" />
            <input name="lastName" required placeholder="Apellido" className="w-full p-3 border rounded-lg" />
            <input name="dniCuit" required placeholder="DNI / CUIT" className="w-full p-3 border rounded-lg" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-brand-primary uppercase">Ubicación y Contacto</h3>
            <input name="address" required placeholder="Dirección completa" className="w-full p-3 border rounded-lg" />
            <input name="phone" placeholder="Teléfono / WhatsApp" className="w-full p-3 border rounded-lg" />
            <input name="email" type="email" placeholder="Email (Opcional)" className="w-full p-3 border rounded-lg" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-brand-primary uppercase">Tipo</h3>
             <select name="type" className="w-full p-3 border rounded-lg bg-white">
                <option value="FINAL">Consumidor Final</option>
                <option value="MAYORISTA">Comercio / Mayorista</option>
             </select>
        </div>

        <button type="submit" className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 text-lg">
           <Save /> Guardar Cliente
        </button>
      </form>
    </div>
  );
}`,
  
  // Agregar botón al dashboard movil
  'src/app/corredor/dashboard/page.tsx': `import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ShoppingCart, Truck, MapPin, UserPlus, AlertCircle } from "lucide-react";

export default async function CorredorDashboard() {
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return <div>Error</div>;

  return (
    <div className="space-y-6">
      <div className="bg-brand-dark rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold font-heading">Hola, {user.firstName}</h2>
        <p className="text-brand-light opacity-80 text-sm">Panel de Corredor</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {user.isRunner && (
          <>
            <Link href="/corredor/pedidos" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><ShoppingCart size={24} /></div>
                <span className="font-bold text-gray-700 text-xs text-center">Vender</span>
            </Link>
            <Link href="/corredor/clientes/nuevo" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><UserPlus size={24} /></div>
                <span className="font-bold text-gray-700 text-xs text-center">Nuevo Cliente</span>
            </Link>
          </>
        )}

        {user.isDriver && (
          <Link href="/corredor/rutas" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform h-28 col-span-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-full"><Truck size={24} /></div>
            <span className="font-bold text-gray-700 text-xs text-center">Mis Rutas de Entrega</span>
          </Link>
        )}
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando ABMs Completos (Edit/Delete) y Panel Mobile...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. LÓGICA DE PRODUCTOS (Server Action) ---
  'src/actions/products-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  // 1. Extraer datos del formulario
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = formData.get("category") as string;
  
  // Convertimos texto a número (si viene vacío usa 0)
  const priceMayor = parseFloat(formData.get("priceMayor") as string) || 0;
  const priceMinor = parseFloat(formData.get("priceMinor") as string) || 0;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  const currentStock = parseInt(formData.get("currentStock") as string) || 0;
  const minStock = parseInt(formData.get("minStock") as string) || 0;

  // 2. Validaciones básicas
  if (!name || !code || !category) {
    return { error: "Faltan campos obligatorios" };
  }

  try {
    // 3. Guardar en Base de Datos
    await prisma.product.create({
      data: {
        name,
        code,
        category,
        unit: "UNIDAD", 
        priceMayor,
        priceMinor,
        priceFinal,
        currentStock,
        minStock,
        isActive: true,
        // Eliminamos campos opcionales que no estemos usando para evitar errores
        imageUrl: null, 
        description: null
      }
    });
  } catch (error) {
    console.error(error);
    return { error: "Error al crear producto. Verifica que el código no esté repetido." };
  }

  // 4. Actualizar vistas y redirigir
  revalidatePath("/admin/productos");
  revalidatePath("/admin/dashboard");
  redirect("/admin/productos");
}`,

  // --- 2. VISTA DE LISTA (Tabla) ---
  'src/app/admin/productos/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Productos</h1>
          <p className="text-gray-500">Catálogo e inventario</p>
        </div>
        <Link 
          href="/admin/productos/nuevo" 
          className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Nuevo Producto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Precio Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No hay productos cargados.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-gray-500">{p.code}</td>
                  <td className="p-4 font-medium text-brand-dark">{p.name}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{p.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {p.currentStock <= p.minStock && <AlertTriangle size={16} className="text-amber-500" />}
                      <span className={p.currentStock <= p.minStock ? "text-amber-600 font-bold" : ""}>
                        {p.currentStock}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-brand-primary">\${p.priceFinal}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

  // --- 3. VISTA DE FORMULARIO (Nuevo) ---
  'src/app/admin/productos/nuevo/page.tsx': `import { createProduct } from "@/actions/products-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/productos" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-primary">Nuevo Producto</h1>
        </div>
      </div>

      <form action={createProduct} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-brand-dark">Nombre del Producto *</label>
            <input name="name" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="Ej: Coca Cola 2.25L" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-dark">Código (SKU) *</label>
            <input name="code" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="Ej: COC-001" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-dark">Categoría *</label>
          <select name="category" className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-accent outline-none">
            <option value="BEBIDAS">Bebidas</option>
            <option value="ALMACEN">Almacén</option>
            <option value="GOLOSINAS">Golosinas</option>
            <option value="CIGARRILLOS">Cigarrillos</option>
            <option value="LIMPIEZA">Limpieza</option>
            <option value="VARIOS">Varios</option>
          </select>
        </div>

        {/* Precios */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-brand-primary mb-4 text-sm uppercase">Lista de Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Precio Mayorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                        <input name="priceMayor" type="number" step="0.01" className="w-full pl-6 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Precio Minorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                        <input name="priceMinor" type="number" step="0.01" className="w-full pl-6 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Precio Final (Público)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                        <input name="priceFinal" type="number" step="0.01" required className="w-full pl-6 p-2 border border-gray-200 rounded-lg font-bold text-brand-primary focus:ring-2 focus:ring-brand-accent outline-none" placeholder="0.00" />
                    </div>
                </div>
            </div>
        </div>

        {/* Stock */}
        <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-brand-dark">Stock Actual</label>
                <input name="currentStock" type="number" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="0" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-brand-dark">Stock Mínimo (Alerta)</label>
                <input name="minStock" type="number" required className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" placeholder="10" />
            </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-brand-primary hover:bg-brand-dark text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
            <Save size={20} />
            Guardar Producto
          </button>
        </div>

      </form>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando módulo de Productos...');
  
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado`);
  }
}

createFiles();
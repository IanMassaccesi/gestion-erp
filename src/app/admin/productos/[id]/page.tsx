import { prisma } from "@/lib/prisma";
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
}
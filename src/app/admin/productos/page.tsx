import { prisma } from "@/lib/prisma";
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
                <td className="p-4 font-bold text-brand-primary">$${p.priceFinal}</td>
                <td className="p-4 flex justify-end gap-2">
                  <Link href={`/admin/productos/${p.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></Link>
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
}
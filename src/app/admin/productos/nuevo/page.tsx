import { createProduct } from "@/actions/products-actions";
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
}
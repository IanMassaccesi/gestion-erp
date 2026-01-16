'use client'

import { useState, useEffect } from "react";
import { createProduct } from "@/actions/products-actions";
import { getCategories, createCategory, deleteCategory, generateSKU } from "@/actions/categories-actions";
import { ArrowLeft, Save, Trash2, X, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductForm() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTrackStock, setIsTrackStock] = useState(true); // NUEVO ESTADO

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrefix, setNewCatPrefix] = useState("");

  useEffect(() => { loadCats(); }, []);

  async function loadCats() {
    const data = await getCategories();
    setCategories(data);
  }

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    if (catId) {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
            setLoading(true);
            const sku = await generateSKU(cat.prefix);
            setGeneratedCode(sku);
            setLoading(false);
        }
    } else {
        setGeneratedCode("");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName || !newCatPrefix) return;
    await createCategory(newCatName, newCatPrefix);
    setNewCatName(""); setNewCatPrefix(""); loadCats();
  };

  const handleDeleteCategory = async (id: string) => {
    if(confirm("¿Seguro?")) { await deleteCategory(id); loadCats(); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/productos" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Nuevo Producto</h1>
          <p className="text-slate-500 text-sm">Alta de inventario</p>
        </div>
      </div>

      <form action={createProduct} className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Nombre del Producto *</label>
            <input name="name" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white placeholder-slate-600" placeholder="Ej: Coca Cola 2.25L" />
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400 flex justify-between">
                Categoría *
                <button type="button" onClick={() => setIsModalOpen(true)} className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                    <Settings size={12}/> Gestionar
                </button>
            </label>
            <div className="relative">
                <input type="hidden" name="category" value={categories.find(c => c.id === selectedCategory)?.name || ""} />
                <select required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white appearance-none" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">-- Seleccionar --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.prefix})</option>)}
                </select>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Código (SKU) *</label>
            <div className="relative">
                <input name="code" required value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-cyan-400 font-mono font-bold" placeholder="Seleccione categoría..." />
                {loading && <span className="absolute right-3 top-3 text-xs text-slate-500 animate-pulse">Generando...</span>}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800">
            <h3 className="font-bold text-cyan-400 mb-4 text-sm uppercase flex items-center gap-2">💰 Lista de Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Mayorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceMayor" type="number" step="0.01" className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Minorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceMinor" type="number" step="0.01" className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Final (Público)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceFinal" type="number" step="0.01" required className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-cyan-400 focus:border-cyan-500 outline-none" placeholder="0.00" />
                    </div>
                </div>
            </div>
        </div>

        {/* SECCIÓN STOCK CON TOGGLE */}
        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-cyan-400 text-sm uppercase">📦 Gestión de Stock</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="trackStock" checked={isTrackStock} onChange={(e) => setIsTrackStock(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                    <span className="text-sm text-slate-300">Controlar Inventario</span>
                </label>
            </div>
            
            <div className={`grid grid-cols-2 gap-6 transition-opacity duration-300 ${!isTrackStock ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Stock Actual</label>
                    <input name="currentStock" type="number" disabled={!isTrackStock} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Stock Mínimo</label>
                    <input name="minStock" type="number" disabled={!isTrackStock} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="10" />
                </div>
            </div>
            {!isTrackStock && <p className="text-xs text-slate-500 mt-2 italic text-center">* Este producto tendrá stock infinito y no se descontará al vender.</p>}
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-transform active:scale-95">
            <Save size={20} />
            Guardar Producto
          </button>
        </div>

      </form>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Gestionar Categorías</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X/></button>
                </div>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div><span className="font-bold text-white">{cat.name}</span><span className="ml-2 text-xs bg-cyan-900 text-cyan-400 px-1 rounded">{cat.prefix}</span></div>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2"><input placeholder="Nombre (Ej: Bebidas)" className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none" value={newCatName} onChange={e => setNewCatName(e.target.value)}/></div>
                    <div className="col-span-1"><input placeholder="Prefijo (BEB)" className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none uppercase" maxLength={3} value={newCatPrefix} onChange={e => setNewCatPrefix(e.target.value.toUpperCase())}/></div>
                </div>
                <button onClick={handleCreateCategory} disabled={!newCatName || !newCatPrefix} className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-bold text-sm transition-colors">+ Agregar Nueva</button>
            </div>
        </div>
      )}
    </div>
  );
}
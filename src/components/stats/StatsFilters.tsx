'use client'

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Filter, X, Calendar, User, Package, Users } from "lucide-react";

export function StatsFilters({ sellers, products, customers }: { sellers: any[], products: any[], customers: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estado local sincronizado con URL
  const [filters, setFilters] = useState({
    period: searchParams.get("period") || "30",
    sellerId: searchParams.get("sellerId") || "",
    productId: searchParams.get("productId") || "",
    customerId: searchParams.get("customerId") || "",
  });

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Actualizar URL
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    
    startTransition(() => {
      router.replace(`/admin/estadisticas?${params.toString()}`);
    });
  };

  return (
    <div className="bg-brand-card p-5 rounded-xl border border-brand-border mb-8 shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-brand-primary font-bold border-b border-brand-border pb-2">
        <Filter size={20} /> Filtros de Inteligencia de Negocio
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. PERIODO */}
        <div>
           <label className="text-xs text-brand-muted font-bold mb-1 flex items-center gap-1"><Calendar size={12}/> Periodo</label>
           <select 
             value={filters.period} 
             onChange={(e) => handleFilter("period", e.target.value)}
             className="w-full bg-brand-input border border-brand-border rounded-lg p-2.5 text-white text-sm focus:border-brand-primary outline-none"
           >
             <option value="7">Últimos 7 días</option>
             <option value="30">Últimos 30 días</option>
             <option value="90">Últimos 3 meses</option>
             <option value="ALL">Todo el historial</option>
           </select>
        </div>

        {/* 2. VENDEDOR */}
        <div>
           <label className="text-xs text-brand-muted font-bold mb-1 flex items-center gap-1"><User size={12}/> Vendedor</label>
           <select 
             value={filters.sellerId} 
             onChange={(e) => handleFilter("sellerId", e.target.value)}
             className="w-full bg-brand-input border border-brand-border rounded-lg p-2.5 text-white text-sm focus:border-brand-primary outline-none"
           >
             <option value="">Todos</option>
             {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
             ))}
           </select>
        </div>

        {/* 3. PRODUCTO */}
        <div>
           <label className="text-xs text-brand-muted font-bold mb-1 flex items-center gap-1"><Package size={12}/> Producto</label>
           <select 
             value={filters.productId} 
             onChange={(e) => handleFilter("productId", e.target.value)}
             className="w-full bg-brand-input border border-brand-border rounded-lg p-2.5 text-white text-sm focus:border-brand-primary outline-none"
           >
             <option value="">Todos</option>
             {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
             ))}
           </select>
        </div>

        {/* 4. CLIENTE */}
        <div>
           <label className="text-xs text-brand-muted font-bold mb-1 flex items-center gap-1"><Users size={12}/> Cliente</label>
           <select 
             value={filters.customerId} 
             onChange={(e) => handleFilter("customerId", e.target.value)}
             className="w-full bg-brand-input border border-brand-border rounded-lg p-2.5 text-white text-sm focus:border-brand-primary outline-none"
           >
             <option value="">Todos</option>
             {customers.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
             ))}
           </select>
        </div>

        {/* LIMPIAR */}
        <div className="flex items-end">
            <button 
                onClick={() => router.push('/admin/estadisticas')}
                className="w-full bg-brand-dark hover:bg-red-500/20 text-brand-muted hover:text-white border border-brand-border py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors font-bold"
            >
                <X size={16}/> Limpiar
            </button>
        </div>

      </div>
      {isPending && <div className="text-xs text-brand-accent mt-2 animate-pulse font-mono text-right">Actualizando métricas...</div>}
    </div>
  );
}
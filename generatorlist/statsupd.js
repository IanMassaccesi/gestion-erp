const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. COMPONENTE DE FILTROS (Cliente / Producto / Vendedor / Fecha)
  // ==========================================
  'src/components/stats/StatsFilters.tsx': `'use client'

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
      router.replace(\`/admin/estadisticas?\${params.toString()}\`);
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
}`,

  // ==========================================
  // 2. COMPONENTE DE GRÁFICOS (4 Vistas en 2 Embeds)
  // ==========================================
  'src/components/stats/StatsCharts.tsx': `'use client'

import { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#00F0FF', '#7000FF', '#FF0055', '#00FF94', '#FFAA00', '#FFFFFF'];

export function StatsCharts({ timelineData, distributionData }: { timelineData: any[], distributionData: any }) {
  
  // ESTADOS PARA CAMBIAR VISTAS
  const [view1, setView1] = useState<'REVENUE' | 'ORDERS'>('REVENUE');
  const [view2, setView2] = useState<'CATEGORY' | 'CLIENTS'>('CATEGORY');

  const formatMoney = (val: number) => \`$\${val.toLocaleString()}\`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* === GRÁFICO 1: TENDENCIA TEMPORAL === */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
               📈 Tendencia Temporal
            </h3>
            {/* TOGGLE 1 */}
            <div className="bg-brand-dark p-1 rounded-lg flex text-xs border border-brand-border">
                <button 
                    onClick={() => setView1('REVENUE')}
                    className={\`px-3 py-1.5 rounded transition-all \${view1 === 'REVENUE' ? 'bg-brand-primary text-brand-dark font-bold shadow-neon' : 'text-brand-muted hover:text-white'}\`}
                >
                    Facturación ($)
                </button>
                <button 
                    onClick={() => setView1('ORDERS')}
                    className={\`px-3 py-1.5 rounded transition-all \${view1 === 'ORDERS' ? 'bg-brand-primary text-brand-dark font-bold shadow-neon' : 'text-brand-muted hover:text-white'}\`}
                >
                    Pedidos (#)
                </button>
            </div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                {view1 === 'REVENUE' ? (
                    <AreaChart data={timelineData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => val.slice(5)} tickMargin={10} />
                        <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => \`$\${val/1000}k\`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', borderRadius: '8px' }} 
                            itemStyle={{ color: '#00F0FF' }}
                            formatter={(val: number) => [formatMoney(val), "Facturado"]}
                            labelStyle={{ color: '#888' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                ) : (
                    <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => val.slice(5)} tickMargin={10} />
                        <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#ffffff10'}}
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                            formatter={(val: number) => [val, "Pedidos"]}
                        />
                        <Bar dataKey="count" fill="#7000FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>

      {/* === GRÁFICO 2: COMPOSICIÓN Y RANKING === */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
               📊 Distribución
            </h3>
            {/* TOGGLE 2 */}
            <div className="bg-brand-dark p-1 rounded-lg flex text-xs border border-brand-border">
                <button 
                    onClick={() => setView2('CATEGORY')}
                    className={\`px-3 py-1.5 rounded transition-all \${view2 === 'CATEGORY' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}\`}
                >
                    Por Categoría
                </button>
                <button 
                    onClick={() => setView2('CLIENTS')}
                    className={\`px-3 py-1.5 rounded transition-all \${view2 === 'CLIENTS' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}\`}
                >
                    Top Clientes
                </button>
            </div>
        </div>

        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                {view2 === 'CATEGORY' ? (
                     <PieChart>
                        <Pie
                            data={distributionData.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {distributionData.categories.map((entry:any, index:number) => (
                                <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(val:number) => formatMoney(val)} 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', color: '#fff' }} 
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                ) : (
                    <BarChart data={distributionData.clients} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(val) => \`$\${val/1000}k\`} />
                        <YAxis dataKey="name" type="category" stroke="#fff" fontSize={11} width={100} tick={{fill: '#ccc'}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', borderRadius: '8px' }} 
                            formatter={(val:number) => formatMoney(val)} 
                            cursor={{fill: '#ffffff10'}}
                        />
                        <Bar dataKey="value" fill="#FF0055" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 3. PÁGINA PRINCIPAL (Lógica Server-Side y Fetching)
  // ==========================================
  'src/app/admin/estadisticas/page.tsx': `import { prisma } from "@/lib/prisma";
import { StatsFilters } from "@/components/stats/StatsFilters";
import { StatsCharts } from "@/components/stats/StatsCharts";
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";
import { subDays, format } from "date-fns";

export default async function EstadisticasPage({ searchParams }: { searchParams: Promise<{ [key: string]: string }> }) {
  const params = await searchParams;
  
  // 1. PROCESAR FILTROS
  const period = params.period || "30";
  const sellerId = params.sellerId;
  const productId = params.productId;
  const customerId = params.customerId;

  // Calcular Fecha de Inicio
  const today = new Date();
  let startDate = subDays(today, 30);
  if (period === "7") startDate = subDays(today, 7);
  if (period === "90") startDate = subDays(today, 90);
  if (period === "ALL") startDate = new Date(2020, 0, 1);

  // Construir clausula WHERE dinámica
  const whereClause: any = {
    status: { not: 'CANCELLED' },
    createdAt: { gte: startDate }
  };

  if (sellerId) whereClause.userId = sellerId;
  if (customerId) whereClause.customerId = customerId;
  
  // Filtro complejo: Pedidos que contengan X producto
  if (productId) {
    whereClause.items = { some: { productId: productId } };
  }

  // 2. FETCH DE DATOS (Parallel Fetching)
  const [orders, sellers, products, customers] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: { 
        items: { include: { product: true } },
        user: true,
        customer: true
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.user.findMany({ where: { role: 'CORREDOR' }, select: { id: true, firstName: true, lastName: true } }),
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ where: { isDeleted: false }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } })
  ]);

  // 3. AGREGACIÓN DE DATOS (Data Processing)
  
  // A) TIMELINE (Por Fecha)
  const timelineMap = new Map();
  orders.forEach(order => {
    const dateKey = format(order.createdAt, 'yyyy-MM-dd');
    if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { date: dateKey, total: 0, count: 0 });
    }
    const entry = timelineMap.get(dateKey);
    entry.total += order.total;
    entry.count += 1;
  });
  const timelineData = Array.from(timelineMap.values());

  // B) CATEGORY DISTRIBUTION
  const categoryMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
        const cat = item.product.category || "Otros";
        // Si filtramos por producto, solo sumamos ESE producto al total de categoría
        if (!productId || item.productId === productId) {
             categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.subtotal);
        }
    });
  });
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  // C) TOP CLIENTS
  const clientMap = new Map();
  orders.forEach(order => {
      const name = \`\${order.customer.firstName} \${order.customer.lastName}\`;
      clientMap.set(name, (clientMap.get(name) || 0) + order.total);
  });
  const clientData = Array.from(clientMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 8); // Top 8 clientes

  // KPIs
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="pb-20 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading text-white">Estadísticas & Reportes</h1>
        <p className="text-brand-muted">Análisis detallado de rendimiento comercial</p>
      </div>

      {/* COMPONENTE DE FILTROS */}
      <StatsFilters sellers={sellers} products={products} customers={customers} />

      {/* KPIS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-lg hover:border-brand-primary/50 transition-colors">
            <div className="p-4 bg-brand-primary/20 text-brand-primary rounded-xl"><DollarSign size={32}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Facturación Total</p><h3 className="text-3xl font-bold text-white">\$\${totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-lg hover:border-brand-primary/50 transition-colors">
            <div className="p-4 bg-brand-accent/20 text-brand-accent rounded-xl"><ShoppingBag size={32}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Pedidos Totales</p><h3 className="text-3xl font-bold text-white">{totalOrders}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-lg hover:border-brand-primary/50 transition-colors">
            <div className="p-4 bg-green-500/20 text-green-400 rounded-xl"><TrendingUp size={32}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Ticket Promedio</p><h3 className="text-3xl font-bold text-white">\$\${avgTicket.toLocaleString(undefined, {maximumFractionDigits:0})}</h3></div>
        </div>
      </div>

      {orders.length === 0 ? (
         <div className="p-12 text-center border-2 border-dashed border-brand-border rounded-xl">
            <AlertCircle className="mx-auto text-brand-muted mb-4" size={48}/>
            <h3 className="text-xl font-bold text-white">No hay datos disponibles</h3>
            <p className="text-brand-muted">Prueba cambiando los filtros seleccionados.</p>
         </div>
      ) : (
         /* COMPONENTE DE GRÁFICOS (4 VISTAS) */
         <StatsCharts 
            timelineData={timelineData} 
            distributionData={{ categories: categoryData, clients: clientData }} 
         />
      )}

    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando Dashboard de BI con 4 Gráficos y 4 Filtros...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
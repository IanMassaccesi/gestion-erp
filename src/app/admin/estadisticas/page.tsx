import { prisma } from "@/lib/prisma";
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
      const name = `${order.customer.firstName} ${order.customer.lastName}`;
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
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Facturación Total</p><h3 className="text-3xl font-bold text-white">$${totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-lg hover:border-brand-primary/50 transition-colors">
            <div className="p-4 bg-brand-accent/20 text-brand-accent rounded-xl"><ShoppingBag size={32}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Pedidos Totales</p><h3 className="text-3xl font-bold text-white">{totalOrders}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4 shadow-lg hover:border-brand-primary/50 transition-colors">
            <div className="p-4 bg-green-500/20 text-green-400 rounded-xl"><TrendingUp size={32}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase tracking-wide">Ticket Promedio</p><h3 className="text-3xl font-bold text-white">$${avgTicket.toLocaleString(undefined, {maximumFractionDigits:0})}</h3></div>
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
}
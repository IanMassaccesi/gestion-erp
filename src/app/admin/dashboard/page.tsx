import { prisma } from "@/lib/prisma";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const [totalOrders, totalProducts, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.order.aggregate({ _sum: { total: true } })
  ]);

  const revenue = totalRevenue._sum.total || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-heading text-white">Dashboard</h1>
        <p className="text-brand-muted">Visión general del negocio</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-primary">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Ventas Totales</p>
              <h3 className="text-2xl font-bold text-white font-heading">$${revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-accent/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-accent">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Pedidos</p>
              <h3 className="text-2xl font-bold text-white font-heading">{totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-warning/50 transition-colors">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-warning/5 rounded-full blur-2xl group-hover:bg-brand-warning/10 transition-colors"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-warning">
              <Package size={24} />
            </div>
            <div>
              <p className="text-brand-muted text-sm uppercase font-bold tracking-wider">Productos</p>
              <h3 className="text-2xl font-bold text-white font-heading">{totalProducts}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
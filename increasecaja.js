const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SCHEMA: MODELOS DE CAJA Y FINANZAS
  // ==========================================
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... (Tus Enums y Modelos anteriores: User, Customer, Product, Order...) ...
// ... DEJA TODO LO ANTERIOR IGUAL Y AGREGA ESTO AL FINAL ...

// CAJA DIARIA (Turno)
model CashShift {
  id             String    @id @default(cuid())
  openedAt       DateTime  @default(now())
  closedAt       DateTime?
  
  startAmount    Float     // Saldo inicial
  endAmount      Float?    // Saldo al cierre (lo que cuenta el usuario)
  systemAmount   Float?    // Saldo calculado por el sistema
  difference     Float?    // Diferencia (Faltante/Sobrante)
  
  status         String    @default("OPEN") // OPEN, CLOSED
  
  transactions   CashTransaction[]
  
  openedById     String
  openedBy       User      @relation(fields: [openedById], references: [id])
}

// MOVIMIENTOS DE CAJA
model CashTransaction {
  id             String    @id @default(cuid())
  date           DateTime  @default(now())
  amount         Float
  type           String    // IN (Ingreso), OUT (Egreso)
  category       String    // VENTA, PROVEEDOR, GASTO, RETIRO, AJUSTE
  description    String?
  
  shiftId        String
  shift          CashShift @relation(fields: [shiftId], references: [id])
  
  // Opcional: Vincular a un pedido específico si es un cobro
  orderId        String?
  order          Order?    @relation(fields: [orderId], references: [id])
}

// AGREGA ESTO AL MODELO "User" (Relación inversa):
// shifts        CashShift[]
// AGREGA ESTO AL MODELO "Order" (Relación inversa):
// transactions  CashTransaction[]

// (Como este script concatena, asegúrate de que el archivo final sea válido o usa el schema completo si prefieres fusionar manualmente).
`,

  // ==========================================
  // 2. ACTIONS: LÓGICA DE FINANZAS Y ESTADÍSTICAS
  // ==========================================
  'src/actions/finance-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// --- CAJA ---

export async function openCashShift(amount: number) {
  const session = await getSession();
  if (!session?.user) return { error: "No autorizado" };

  // Verificar si ya hay una abierta
  const existing = await prisma.cashShift.findFirst({ where: { status: "OPEN" } });
  if (existing) return { error: "Ya hay una caja abierta." };

  await prisma.cashShift.create({
    data: {
      startAmount: amount,
      status: "OPEN",
      openedById: session.user.id
    }
  });
  revalidatePath("/admin/caja");
}

export async function closeCashShift(realAmount: number) {
  const currentShift = await prisma.cashShift.findFirst({ 
    where: { status: "OPEN" },
    include: { transactions: true }
  });

  if (!currentShift) return { error: "No hay caja abierta" };

  // Calcular saldo sistema: Inicial + Ingresos - Egresos
  const income = currentShift.transactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
  const expense = currentShift.transactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
  const systemAmount = currentShift.startAmount + income - expense;
  
  const difference = realAmount - systemAmount;

  await prisma.cashShift.update({
    where: { id: currentShift.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      endAmount: realAmount,
      systemAmount,
      difference
    }
  });
  revalidatePath("/admin/caja");
}

export async function addTransaction(amount: number, type: 'IN' | 'OUT', category: string, description: string) {
  const currentShift = await prisma.cashShift.findFirst({ where: { status: "OPEN" } });
  if (!currentShift) return { error: "Caja cerrada. Abra caja primero." };

  await prisma.cashTransaction.create({
    data: {
      amount, type, category, description,
      shiftId: currentShift.id
    }
  });
  revalidatePath("/admin/caja");
}`,

  // ==========================================
  // 3. PÁGINA: CAJA DIARIA (Dashboard Financiero)
  // ==========================================
  'src/app/admin/caja/page.tsx': `import { prisma } from "@/lib/prisma";
import { openCashShift, closeCashShift, addTransaction } from "@/actions/finance-actions";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, AlertTriangle } from "lucide-react";

export default async function CajaPage() {
  // Buscar caja abierta
  const currentShift = await prisma.cashShift.findFirst({
    where: { status: "OPEN" },
    include: { transactions: { orderBy: { date: 'desc' } } }
  });

  // Cálculos
  const income = currentShift?.transactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0) || 0;
  const expense = currentShift?.transactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0) || 0;
  const currentBalance = (currentShift?.startAmount || 0) + income - expense;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold font-heading text-white">Caja Diaria</h1>
           <p className="text-brand-muted">Control de efectivo y movimientos</p>
        </div>
        <div className="bg-brand-card px-4 py-2 rounded-lg border border-brand-border text-sm font-mono text-brand-primary">
            {currentShift ? \`TURNO ABIERTO: \${currentShift.openedAt.toLocaleTimeString()}\` : "TURNO CERRADO"}
        </div>
      </div>

      {!currentShift ? (
        // --- ESTADO: CAJA CERRADA (Mostrar form de apertura) ---
        <div className="max-w-md mx-auto bg-brand-card p-8 rounded-xl border border-brand-border text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center mx-auto text-brand-muted">
                <Lock size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white">La Caja está Cerrada</h2>
            <p className="text-brand-muted">Ingrese el monto de efectivo inicial para comenzar a operar.</p>
            
            <form action={async (fd) => { 'use server'; await openCashShift(parseFloat(fd.get('amount') as string)); }}>
                <input name="amount" type="number" step="0.01" placeholder="$ 0.00" className="w-full text-center text-2xl p-4 bg-brand-input border border-brand-border rounded-lg text-white mb-4 font-bold" required />
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                    <Unlock size={20} /> ABRIR CAJA
                </button>
            </form>
        </div>
      ) : (
        // --- ESTADO: CAJA ABIERTA ---
        <>
          {/* TARJETAS DE TOTALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-brand-card p-6 rounded-xl border border-brand-border relative overflow-hidden">
                <p className="text-brand-muted uppercase text-xs font-bold">Saldo en Caja</p>
                <h2 className="text-4xl font-bold text-white mt-2 font-mono">\$\${currentBalance.toLocaleString()}</h2>
                <div className="absolute top-4 right-4 text-brand-primary opacity-20"><DollarSign size={48}/></div>
             </div>
             
             <div className="bg-brand-card p-6 rounded-xl border border-brand-border relative overflow-hidden">
                <p className="text-green-400 uppercase text-xs font-bold flex items-center gap-1"><ArrowUpCircle size={12}/> Ingresos</p>
                <h2 className="text-3xl font-bold text-white mt-2 font-mono text-green-400">+\$\${income.toLocaleString()}</h2>
                <p className="text-xs text-brand-muted mt-1">Apertura: \$\${currentShift.startAmount}</p>
             </div>

             <div className="bg-brand-card p-6 rounded-xl border border-brand-border relative overflow-hidden">
                <p className="text-red-400 uppercase text-xs font-bold flex items-center gap-1"><ArrowDownCircle size={12}/> Egresos</p>
                <h2 className="text-3xl font-bold text-white mt-2 font-mono text-red-400">-\$\${expense.toLocaleString()}</h2>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* COLUMNA IZQUIERDA: NUEVO MOVIMIENTO */}
             <div className="lg:col-span-1 space-y-6">
                <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
                    <h3 className="font-bold text-white mb-4">Registrar Movimiento</h3>
                    <form action={async (fd) => { 
                        'use server'; 
                        await addTransaction(parseFloat(fd.get('amount') as string), fd.get('type') as any, fd.get('category') as string, fd.get('desc') as string); 
                    }} className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-2">
                            <select name="type" className="p-3 bg-brand-input border border-brand-border rounded-lg text-white">
                                <option value="IN">Ingreso (+)</option>
                                <option value="OUT">Egreso (-)</option>
                            </select>
                            <input name="amount" type="number" step="0.01" placeholder="$ Monto" required className="p-3 bg-brand-input border border-brand-border rounded-lg text-white font-bold" />
                        </div>
                        
                        <select name="category" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white">
                            <option value="VENTA">Venta / Cobro</option>
                            <option value="PROVEEDOR">Pago Proveedor</option>
                            <option value="GASTOS">Gastos Varios</option>
                            <option value="RETIRO">Retiro de Socio</option>
                            <option value="OTROS">Otros</option>
                        </select>
                        
                        <input name="desc" placeholder="Descripción (Opcional)" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
                        
                        <button className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold">REGISTRAR</button>
                    </form>
                </div>

                {/* CIERRE DE CAJA */}
                <div className="bg-brand-dark/50 p-6 rounded-xl border border-brand-border border-red-500/30">
                    <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Cierre de Caja</h3>
                    <p className="text-xs text-brand-muted mb-4">Cuente el dinero físico antes de cerrar.</p>
                    <form action={async (fd) => { 'use server'; await closeCashShift(parseFloat(fd.get('realAmount') as string)); }}>
                        <input name="realAmount" type="number" step="0.01" placeholder="$ Dinero Real en Caja" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white mb-2" required />
                        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-sm">CERRAR TURNO</button>
                    </form>
                </div>
             </div>

             {/* COLUMNA DERECHA: HISTORIAL */}
             <div className="lg:col-span-2 bg-brand-card rounded-xl border border-brand-border overflow-hidden">
                <div className="p-4 border-b border-brand-border bg-brand-dark/50">
                    <h3 className="font-bold text-white">Movimientos del Turno</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-brand-muted bg-brand-dark/30 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3">Hora</th>
                                <th className="p-3">Cat.</th>
                                <th className="p-3">Descripción</th>
                                <th className="p-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/50">
                            {currentShift.transactions.map(t => (
                                <tr key={t.id} className="hover:bg-brand-border/20">
                                    <td className="p-3 text-brand-muted font-mono">{t.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="p-3"><span className="bg-brand-dark border border-brand-border px-2 py-1 rounded text-xs">{t.category}</span></td>
                                    <td className="p-3 text-white">{t.description || "-"}</td>
                                    <td className={\`p-3 text-right font-bold font-mono \${t.type === 'IN' ? 'text-green-400' : 'text-red-400'}\`}>
                                        {t.type === 'IN' ? '+' : '-'}\$\${t.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {currentShift.transactions.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-brand-muted">Sin movimientos aún.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>

          </div>
        </>
      )}
    </div>
  );
}`,

  // ==========================================
  // 4. PÁGINA: ESTADÍSTICAS (Business Intelligence)
  // ==========================================
  'src/app/admin/estadisticas/page.tsx': `import { prisma } from "@/lib/prisma";
import { TrendingUp, Award, ShoppingBag, DollarSign } from "lucide-react";

export default async function EstadisticasPage() {
  // 1. KPIs Generales
  const totalOrders = await prisma.order.count({ where: { status: { not: 'CANCELLED' } } });
  
  const revenueAgg = await prisma.order.aggregate({ 
    where: { status: { not: 'CANCELLED' } },
    _sum: { total: true }
  });
  const totalRevenue = revenueAgg._sum.total || 0;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // 2. Ranking de Productos (Top 5)
  // Truco: Agrupamos y sumamos. Prisma GroupBy es genial.
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  });

  // Necesitamos los nombres de los productos
  const productIds = topProductsRaw.map(p => p.productId);
  const productsDetails = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const topProducts = topProductsRaw.map(item => {
    const product = productsDetails.find(p => p.id === item.productId);
    return {
      name: product?.name || "Desconocido",
      quantity: item._sum.quantity || 0,
      revenue: item._sum.subtotal || 0
    };
  });

  // 3. Ranking de Vendedores (Top 5)
  const topSellersRaw = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });
  
  const userIds = topSellersRaw.map(u => u.userId);
  const usersDetails = await prisma.user.findMany({ where: { id: { in: userIds } } });

  const topSellers = topSellersRaw.map(item => {
     const user = usersDetails.find(u => u.id === item.userId);
     return {
         name: \`\${user?.firstName} \${user?.lastName}\`,
         total: item._sum.total || 0,
         count: item._count.id || 0
     };
  });

  // Para las barras de progreso
  const maxProductQty = topProducts[0]?.quantity || 1;
  const maxSellerRevenue = topSellers[0]?.total || 1;

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">Estadísticas</h1>
        <p className="text-brand-muted">Análisis de rendimiento del negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4">
            <div className="p-3 bg-brand-primary/20 text-brand-primary rounded-lg"><DollarSign size={24}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase">Ingresos Totales</p><h3 className="text-2xl font-bold text-white">\$\${totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4">
            <div className="p-3 bg-brand-accent/20 text-brand-accent rounded-lg"><ShoppingBag size={24}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase">Ventas Concretadas</p><h3 className="text-2xl font-bold text-white">{totalOrders}</h3></div>
        </div>
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border flex items-center gap-4">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-lg"><TrendingUp size={24}/></div>
            <div><p className="text-xs font-bold text-brand-muted uppercase">Ticket Promedio</p><h3 className="text-2xl font-bold text-white">\$\${averageTicket.toLocaleString(undefined, {maximumFractionDigits:0})}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RANKING PRODUCTOS */}
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Award className="text-yellow-400"/> Productos Más Vendidos</h3>
            <div className="space-y-5">
                {topProducts.map((p, i) => (
                    <div key={i} className="relative">
                        <div className="flex justify-between text-sm mb-1 text-white z-10 relative">
                            <span className="font-medium">{i+1}. {p.name}</span>
                            <span className="font-bold">{p.quantity} un.</span>
                        </div>
                        <div className="w-full bg-brand-dark rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-brand-primary to-blue-500 h-2 rounded-full" 
                                style={{ width: \`\${(p.quantity / maxProductQty) * 100}%\` }}
                            ></div>
                        </div>
                        <p className="text-xs text-brand-muted mt-1 text-right">Generó \$\${p.revenue.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* RANKING VENDEDORES */}
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Award className="text-brand-accent"/> Mejores Vendedores</h3>
            <div className="space-y-5">
                {topSellers.map((s, i) => (
                    <div key={i} className="relative">
                        <div className="flex justify-between text-sm mb-1 text-white z-10 relative">
                            <span className="font-medium">{i+1}. {s.name}</span>
                            <span className="font-bold">\$\${s.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-brand-dark rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-brand-accent to-purple-600 h-2 rounded-full" 
                                style={{ width: \`\${(s.total / maxSellerRevenue) * 100}%\` }}
                            ></div>
                        </div>
                         <p className="text-xs text-brand-muted mt-1 text-right">{s.count} pedidos</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}`,

  // ==========================================
  // 5. SIDEBAR UPDATE (Agregar Links)
  // ==========================================
  'src/components/layout/AdminLayoutClient.tsx': `'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Truck, Briefcase, Menu, X, LogOut, Container,
  DollarSign, PieChart
} from "lucide-react";
import { logout } from "@/actions/auth-actions";

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Estadísticas', href: '/admin/estadisticas', icon: PieChart }, // <--- NUEVO
  { name: 'Caja Diaria', href: '/admin/caja', icon: DollarSign },        // <--- NUEVO
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Envíos', href: '/admin/envios', icon: Container },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Equipo', href: '/admin/equipo', icon: Briefcase },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-dark flex font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={\`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border text-brand-text shadow-2xl transform transition-transform duration-300 ease-in-out
        \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-auto
      \`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-brand-border flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">GESTIÓN</h1>
              <p className="text-xs text-brand-muted">Panel Administrativo</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-brand-muted hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-neon' : 'text-brand-muted hover:bg-brand-dark hover:text-white'}\`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-brand-muted group-hover:text-white'} />
                  <span className="font-medium font-heading">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-border">
            <button onClick={async () => await logout()} className="flex items-center gap-3 px-4 py-3 w-full text-left text-brand-muted hover:text-red-400 hover:bg-brand-dark rounded-lg transition-colors">
              <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="bg-brand-card border-b border-brand-border text-white p-4 flex items-center gap-4 md:hidden sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)}><Menu size={28} className="text-brand-primary" /></button>
          <h1 className="font-bold font-heading text-lg">Panel de Control</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Creando Módulo de CAJA y ESTADÍSTICAS (BI)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
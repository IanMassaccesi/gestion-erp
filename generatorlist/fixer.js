const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. CORREGIR LISTA DE RUTAS (Chofer Nulo)
  // ==========================================
  'src/app/admin/rutas/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Truck, Calendar } from "lucide-react";

export default async function RutasPage() {
  const routes = await prisma.deliveryRoute.findMany({
    orderBy: { createdAt: 'desc' },
    include: { driver: true, _count: { select: { orders: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold font-heading text-white">Rutas de Entrega</h1><p className="text-brand-muted">Logística y despachos</p></div>
        <Link href="/admin/rutas/nueva" className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-neon"><Plus size={20} /> Nueva Ruta</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => (
          <Link key={route.id} href={\`/admin/rutas/\${route.id}\`} className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border hover:border-brand-primary transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-dark rounded-lg text-brand-primary group-hover:text-white transition-colors"><Truck size={24} /></div>
              <span className={\`px-3 py-1 rounded text-xs font-bold \${route.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}\`}>{route.status}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{route.routeNumber || "Sin Nombre"}</h3>
            <div className="text-sm text-brand-muted space-y-1">
              <p className="flex items-center gap-2"><Calendar size={14} /> {route.date.toLocaleDateString()}</p>
              {/* CORRECCIÓN: Usamos Optional Chaining (?.) y Fallback (||) */}
              <p>Chofer: <span className="font-medium text-white">{route.driver?.firstName || "Sin"} {route.driver?.lastName || "Asignar"}</span></p>
              <p className="text-brand-accent font-medium">{route._count.orders} pedidos asignados</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`,

  // ==========================================
  // 2. CORREGIR FORMULARIO NUEVO EQUIPO (Action Type)
  // ==========================================
  'src/app/admin/equipo/nuevo/page.tsx': `import { createStaff } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save, Percent } from "lucide-react";

export default function NuevoEmpleadoPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/equipo" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Nuevo Empleado</h1>
      </div>

      {/* CORRECCIÓN: Wrapper asíncrono para satisfacer TypeScript */}
      <form action={async (formData) => { 'use server'; await createStaff(formData); }} className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Nombre</label><input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Apellido</label><input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>
        
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Email</label><input type="email" name="email" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Contraseña</label><input type="password" name="password" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>

        <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
          <p className="text-sm font-bold text-brand-primary mb-3">Roles y Comisiones</p>
          <div className="space-y-4">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isRunner" className="w-4 h-4" /> Vendedor</label>
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isDriver" className="w-4 h-4" /> Chofer</label>
            </div>
            
            <div>
                <label className="text-xs font-bold text-brand-muted uppercase block mb-1">Comisión de Venta (%)</label>
                <div className="relative">
                    <Percent className="absolute left-3 top-3 text-brand-muted" size={16} />
                    <input type="number" step="0.1" name="commissionRate" defaultValue="0" className="w-full pl-10 p-2 bg-brand-input border border-brand-border rounded text-white" />
                </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold flex justify-center gap-2"><Save size={20} /> Guardar Empleado</button>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 3. CORREGIR FORMULARIO NUEVA RUTA (Action Type)
  // ==========================================
  'src/app/admin/rutas/nueva/page.tsx': `import { prisma } from "@/lib/prisma";
import { createRoute } from "@/actions/routes-actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default async function NuevaRutaPage() {
  const drivers = await prisma.user.findMany({ where: { role: 'CORREDOR' } });
  
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'CONFIRMED', deliveryRouteId: null },
    include: { customer: true }
  });

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Armar Nueva Ruta</h1>
      </div>

      {/* CORRECCIÓN: Wrapper asíncrono */}
      <form action={async (formData) => { 'use server'; await createRoute(formData); }} className="space-y-6">
        
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-muted mb-2">Nombre / Zona *</label>
            <input name="name" required placeholder="Ej: Ruta Norte" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-muted mb-2">Fecha de Entrega *</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-brand-muted mb-2">Chofer Asignado</label>
            <select name="driverId" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white">
              <option value="null">-- Sin Chofer --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-brand-card p-6 rounded-xl border border-brand-border">
          <h3 className="font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">Seleccionar Pedidos</h3>
          {pendingOrders.length === 0 ? (
            <p className="text-brand-muted italic">No hay pedidos pendientes.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {pendingOrders.map(order => (
                <label key={order.id} className="flex items-center gap-4 p-4 hover:bg-brand-dark/30 rounded-lg border border-brand-border cursor-pointer transition-colors">
                  <input type="checkbox" name="orderIds" value={order.id} className="w-5 h-5 accent-brand-primary" />
                  <div className="flex-1">
                    <span className="font-bold text-white block">{order.customer.firstName} {order.customer.lastName}</span>
                    <span className="text-xs text-brand-muted block">{order.shippingAddress}</span>
                  </div>
                  <span className="font-bold text-brand-accent">\$\${order.total}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-brand-primary text-brand-dark px-8 py-4 rounded-xl font-bold flex gap-2 shadow-neon hover:bg-cyan-400 transition-all">
            <Save size={20} /> Guardar y Crear Ruta
          </button>
        </div>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 4. CORREGIR NUEVO CLIENTE (Action Type)
  // ==========================================
  'src/app/corredor/clientes/nuevo/page.tsx': `import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClienteCorredorPage() {
  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6 px-4 pt-4">
        <Link href="/corredor/dashboard" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold font-heading text-white">Nuevo Cliente</h1>
      </div>

      {/* CORRECCIÓN: Wrapper asíncrono */}
      <form action={async (formData) => { 'use server'; await createClient(formData); }} className="px-4 space-y-4">
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border space-y-4">
           <div><label className="text-sm text-brand-muted block mb-1">Nombre</label><input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Apellido</label><input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">DNI / CUIT</label><input name="dniCuit" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Dirección</label><input name="address" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Ciudad</label><input name="city" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Teléfono</label><input name="phone" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-4 rounded-xl font-bold text-lg shadow-neon flex justify-center gap-2">
            <Save /> Guardar Cliente
        </button>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 5. CORREGIR GRÁFICOS (Recharts Formatter Types)
  // ==========================================
  'src/components/stats/StatsCharts.tsx': `'use client'

import { useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#00F0FF', '#7000FF', '#FF0055', '#00FF94', '#FFAA00', '#FFFFFF'];

export function StatsCharts({ timelineData, distributionData }: { timelineData: any[], distributionData: any }) {
  
  const [view1, setView1] = useState<'REVENUE' | 'ORDERS'>('REVENUE');
  const [view2, setView2] = useState<'CATEGORY' | 'CLIENTS'>('CATEGORY');

  const formatMoney = (val: number) => \`$\${val.toLocaleString()}\`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* GRÁFICO 1 */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">📈 Tendencia</h3>
            <div className="bg-brand-dark p-1 rounded-lg flex text-xs border border-brand-border">
                <button onClick={() => setView1('REVENUE')} className={\`px-3 py-1.5 rounded transition-all \${view1 === 'REVENUE' ? 'bg-brand-primary text-brand-dark font-bold' : 'text-brand-muted hover:text-white'}\`}>$</button>
                <button onClick={() => setView1('ORDERS')} className={\`px-3 py-1.5 rounded transition-all \${view1 === 'ORDERS' ? 'bg-brand-primary text-brand-dark font-bold' : 'text-brand-muted hover:text-white'}\`}>#</button>
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
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                        <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => \`$\${val/1000}k\`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }} 
                            itemStyle={{ color: '#00F0FF' }}
                            // CORRECCIÓN: Usamos "any" para evitar conflicto de tipos con Recharts
                            formatter={(val: any) => [formatMoney(Number(val)), "Facturado"]}
                        />
                        <Area type="monotone" dataKey="total" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                ) : (
                    <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                        <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#ffffff10'}}
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }}
                            formatter={(val: any) => [val, "Pedidos"]}
                        />
                        <Bar dataKey="count" fill="#7000FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2 */}
      <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">📊 Distribución</h3>
            <div className="bg-brand-dark p-1 rounded-lg flex text-xs border border-brand-border">
                <button onClick={() => setView2('CATEGORY')} className={\`px-3 py-1.5 rounded transition-all \${view2 === 'CATEGORY' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}\`}>Cat</button>
                <button onClick={() => setView2('CLIENTS')} className={\`px-3 py-1.5 rounded transition-all \${view2 === 'CLIENTS' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}\`}>Top</button>
            </div>
        </div>

        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                {view2 === 'CATEGORY' ? (
                     <PieChart>
                        <Pie data={distributionData.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {distributionData.categories.map((entry:any, index:number) => (
                                <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val:any) => formatMoney(Number(val))} contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                    </PieChart>
                ) : (
                    <BarChart data={distributionData.clients} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(val) => \`$\${val/1000}k\`} />
                        <YAxis dataKey="name" type="category" stroke="#fff" fontSize={11} width={100} tick={{fill: '#ccc'}} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }} formatter={(val:any) => formatMoney(Number(val))} cursor={{fill: '#ffffff10'}} />
                        <Bar dataKey="value" fill="#FF0055" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Aplicando parches finales de TypeScript (Strict types & Recharts)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Corregido: ${filePath}`);
  }
}
createFiles();
'use client'

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

  const formatMoney = (val: number) => `$${val.toLocaleString()}`;

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
                    className={`px-3 py-1.5 rounded transition-all ${view1 === 'REVENUE' ? 'bg-brand-primary text-brand-dark font-bold shadow-neon' : 'text-brand-muted hover:text-white'}`}
                >
                    Facturación ($)
                </button>
                <button 
                    onClick={() => setView1('ORDERS')}
                    className={`px-3 py-1.5 rounded transition-all ${view1 === 'ORDERS' ? 'bg-brand-primary text-brand-dark font-bold shadow-neon' : 'text-brand-muted hover:text-white'}`}
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
                        <YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
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
                    className={`px-3 py-1.5 rounded transition-all ${view2 === 'CATEGORY' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}`}
                >
                    Por Categoría
                </button>
                <button 
                    onClick={() => setView2('CLIENTS')}
                    className={`px-3 py-1.5 rounded transition-all ${view2 === 'CLIENTS' ? 'bg-brand-accent text-white font-bold' : 'text-brand-muted hover:text-white'}`}
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
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
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
                        <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
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
}
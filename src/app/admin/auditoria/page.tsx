'use client'

import { useState, useEffect } from "react";
import { getLogs } from "@/actions/logger-actions";
import { prisma } from "@/lib/prisma"; 
import { Search, ShieldAlert, User, Clock, Filter } from "lucide-react";

// Nota: En Next.js App Router Client Components, no podemos importar prisma directamente.
// Necesitamos pasar los usuarios como prop o fetchearlos via server action.
// Para simplificar, haremos un fetch de logs que ya incluye los datos del usuario.

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterType]); // Recargar si cambia el tipo

  async function loadData() {
    setLoading(true);
    const data = await getLogs({ type: filterType, search: searchTerm });
    setLogs(data);
    setLoading(false);
  }

  // Manejo del Enter en el buscador
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') loadData();
  };

  return (
    <div className="space-y-6 pb-20 text-slate-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Auditoría</h1>
          <p className="text-slate-400">Registro de movimientos del sistema</p>
        </div>
        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <ShieldAlert className="text-cyan-400" size={24} />
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={20}/>
            <input 
                placeholder="Buscar en detalles (ej: N° pedido)..." 
                className="w-full pl-10 p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-cyan-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
            />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3">
            <Filter size={18} className="text-slate-500" />
            <select 
                className="bg-transparent text-slate-200 font-bold outline-none py-3 cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
            >
                <option value="TODOS">Todas las Acciones</option>
                <option value="PEDIDO">Pedidos</option>
                <option value="RUTA">Rutas / Logística</option>
                <option value="PRODUCTO">Productos</option>
                <option value="SISTEMA">Sistema</option>
            </select>
        </div>
        
        <button onClick={loadData} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-bold transition-colors">
            Refrescar
        </button>
      </div>

      {/* TIMELINE DE LOGS */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
            <div className="p-10 text-center text-slate-500 animate-pulse">Cargando registros...</div>
        ) : logs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No se encontraron registros de auditoría.</div>
        ) : (
            <div className="divide-y divide-slate-800">
                {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                        
                        {/* ICONO Y TIPO */}
                        <div className="flex items-center gap-4 min-w-[180px]">
                            <div className={`p-3 rounded-full ${
                                log.type === 'PEDIDO' ? 'bg-blue-900/30 text-blue-400' :
                                log.type === 'RUTA' ? 'bg-purple-900/30 text-purple-400' :
                                log.type === 'PRODUCTO' ? 'bg-green-900/30 text-green-400' :
                                'bg-slate-700 text-slate-300'
                            }`}>
                                {log.type === 'PEDIDO' ? <User size={20}/> : <Clock size={20}/>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500">{log.type}</p>
                                <p className="text-sm font-bold text-white">{log.action.replace(/_/g, ' ')}</p>
                            </div>
                        </div>

                        {/* DETALLE */}
                        <div className="flex-1">
                            <p className="text-slate-300 text-sm">{log.details}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <User size={12} className="text-slate-500"/>
                                <span className="text-xs text-cyan-500 font-bold">
                                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}
                                </span>
                            </div>
                        </div>

                        {/* FECHA */}
                        <div className="text-right min-w-[120px]">
                            <p className="text-sm font-mono text-slate-400">
                                {new Date(log.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-600">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                        </div>

                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFilteredOrders, updateOrderStatus } from "@/actions/orders-actions";
import { Printer, Search, CheckSquare, Square, Plus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, [filterStatus]); 

  async function loadOrders() {
    setLoading(true);
    const data = await getFilteredOrders(filterStatus, searchTerm);
    setOrders(data);
    setLoading(false);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map(o => o.id));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateOrderStatus(id, newStatus);
    loadOrders(); 
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) { alert("Selecciona al menos un pedido."); return; }
    const idsParam = selectedIds.join(',');
    router.push(`/admin/pedidos/imprimir?ids=${idsParam}`);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pedidos</h1>
          <p className="text-slate-400">Gestión de ventas</p>
        </div>
        <div className="flex gap-3">
            <Link href="/admin/pedidos/nuevo" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all">
                <Plus size={20} /> Nuevo
            </Link>
            <button onClick={handlePrint} disabled={selectedIds.length === 0} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50">
                <Printer size={20} /> Hoja de Ruta
            </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={20}/>
            <input placeholder="Buscar..." className="w-full pl-10 p-3 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-cyan-500"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadOrders()} />
        </div>
        <select className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Activos</option>
            <option value="TODOS">Todos</option>
            <option value="NO_PAGO">🔴 No Pagos</option>
            <option value="PAGO">🟢 Pagos</option>
            <option value="FIADO">🟡 Fiados</option>
            <option value="PENDING">⏳ Pendientes (Web)</option>
            <option value="IMPRESO">🗄️ Archivados</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-500 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                    <button onClick={toggleSelectAll}>{selectedIds.length === orders.length && orders.length > 0 ? <CheckSquare className="text-cyan-400"/> : <Square />}</button>
                </th>
                <th className="p-4">Orden</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Dirección</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={7} className="p-8 text-center">Cargando...</td></tr> : orders.map(order => (
                <tr key={order.id} className={selectedIds.includes(order.id) ? 'bg-cyan-900/20' : 'hover:bg-slate-800/50'}>
                  <td className="p-4"><button onClick={() => toggleSelect(order.id)}>{selectedIds.includes(order.id) ? <CheckSquare className="text-cyan-400"/> : <Square />}</button></td>
                  <td className="p-4 font-mono text-cyan-400">{order.orderNumber}</td>
                  <td className="p-4"><div className="font-bold text-white">{order.customer.firstName} {order.customer.lastName}</div><div className="text-xs text-slate-500">{order.customer.businessName}</div></td>
                  <td className="p-4 text-xs text-slate-400 max-w-[150px] truncate">{order.shippingAddress}</td>
                  <td className="p-4 font-bold text-white">$${order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="bg-transparent border border-slate-700 rounded px-2 py-1 text-xs font-bold text-slate-300">
                        <option className="bg-slate-900" value="NO_PAGO">NO PAGO</option>
                        <option className="bg-slate-900" value="PAGO">PAGO</option>
                        <option className="bg-slate-900" value="FIADO">FIADO</option>
                        <option className="bg-slate-900" value="PENDING">PENDIENTE</option>
                        <option className="bg-slate-900" value="IMPRESO">ARCHIVADO</option>
                    </select>
                  </td>
                  <td className="p-4 text-right"><Link href={`/admin/pedidos/${order.id}`}><Eye size={18} className="inline text-slate-500 hover:text-cyan-400"/></Link></td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
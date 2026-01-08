import { prisma } from "@/lib/prisma";
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
            {currentShift ? `TURNO ABIERTO: ${currentShift.openedAt.toLocaleTimeString()}` : "TURNO CERRADO"}
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
                <h2 className="text-4xl font-bold text-white mt-2 font-mono">$${currentBalance.toLocaleString()}</h2>
                <div className="absolute top-4 right-4 text-brand-primary opacity-20"><DollarSign size={48}/></div>
             </div>
             
             <div className="bg-brand-card p-6 rounded-xl border border-brand-border relative overflow-hidden">
                <p className="text-green-400 uppercase text-xs font-bold flex items-center gap-1"><ArrowUpCircle size={12}/> Ingresos</p>
                <h2 className="text-3xl font-bold text-white mt-2 font-mono text-green-400">+$${income.toLocaleString()}</h2>
                <p className="text-xs text-brand-muted mt-1">Apertura: $${currentShift.startAmount}</p>
             </div>

             <div className="bg-brand-card p-6 rounded-xl border border-brand-border relative overflow-hidden">
                <p className="text-red-400 uppercase text-xs font-bold flex items-center gap-1"><ArrowDownCircle size={12}/> Egresos</p>
                <h2 className="text-3xl font-bold text-white mt-2 font-mono text-red-400">-$${expense.toLocaleString()}</h2>
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
                                    <td className={`p-3 text-right font-bold font-mono ${t.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === 'IN' ? '+' : '-'}$${t.amount.toLocaleString()}
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
}
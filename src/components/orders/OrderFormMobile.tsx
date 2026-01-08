'use client'
import { useState, useEffect } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Minus, Search, Save, AlertCircle, Percent } from "lucide-react";

export function OrderFormMobile({ clients, products, currentUser }: { clients: any[], products: any[], currentUser: any }) {
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- LÓGICA DE COMISIÓN ---
  // Si es ADMIN, empieza en 0 pero es editable.
  // Si es VENDEDOR, empieza en su tasa fija (currentUser.commissionRate) y NO es editable.
  const [feePercent, setFeePercent] = useState(0);

  useEffect(() => {
    if (currentUser?.role === 'CORREDOR') {
      setFeePercent(currentUser.commissionRate || 0);
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'ADMIN';

  // ... (Funciones de carrito iguales) ...
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const addToCart = (p: any) => {
     const exists = cart.find(i => i.id === p.id);
     if(exists) setCart(cart.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i));
     else setCart([...cart, { id: p.id, name: p.name, price: p.priceFinal, qty: 1 }]);
  };
  const updateQty = (id: string, d: number) => setCart(cart.map(i => i.id===id ? {...i, qty: Math.max(0, i.qty+d)} : i).filter(i=>i.qty>0));

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  
  // CÁLCULO DINÁMICO
  const adminFee = subtotal * (feePercent / 100);
  const total = subtotal + adminFee;

  const handleFinish = async () => {
    if (!clientId || cart.length === 0) return;
    setIsSaving(true);
    const client = clients.find(c => c.id === clientId);
    // Pasamos el porcentaje usado al backend (o el monto calculado)
    // El action deberá actualizarse para recibir feePercent
    await createOrder(clientId, "FINAL", cart.map(i => ({ productId: i.id, quantity: i.qty, adjustmentType: "NONE" })), client?.address || "", feePercent);
  };

  // STEP 1 y 2 (Iguales, resumidos para el script)
  if (step === 1) return (
      <div className="space-y-4">
          <input placeholder="Buscar cliente..." className="w-full p-3 rounded bg-brand-input text-white border border-brand-border" onChange={e=>setSearch(e.target.value)} />
          {clients.filter(c=>(c.firstName+c.lastName).toLowerCase().includes(search.toLowerCase())).map(c=>(
              <div key={c.id} onClick={()=>{setClientId(c.id); setStep(2); setSearch("")}} className="p-4 bg-brand-card border border-brand-border rounded-xl text-white font-bold">{c.firstName} {c.lastName}</div>
          ))}
      </div>
  );

  if (step === 2) return (
      <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <button onClick={()=>setStep(1)} className="text-brand-muted font-bold">← Volver</button>
              <button onClick={()=>setStep(3)} className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg font-bold">Ver Resumen $${total.toFixed(0)}</button>
          </div>
          <input placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-3 rounded bg-brand-input text-white border border-brand-border mb-4" />
          <div className="flex-1 overflow-y-auto space-y-2 pb-20">
              {filteredProducts.map(p => {
                  const item = cart.find(i=>i.id===p.id);
                  return (
                      <div key={p.id} className="bg-brand-card p-4 rounded-xl border border-brand-border flex justify-between items-center">
                          <div><div className="text-white font-bold">{p.name}</div><div className="text-brand-primary">$${p.priceFinal}</div></div>
                          {item ? <div className="flex items-center gap-3"><button onClick={()=>updateQty(p.id, -1)} className="p-2 bg-brand-dark rounded text-white"><Minus size={16}/></button><span className="text-white font-bold">{item.qty}</span><button onClick={()=>updateQty(p.id, 1)} className="p-2 bg-brand-dark rounded text-white"><Plus size={16}/></button></div> : <button onClick={()=>addToCart(p)} className="bg-brand-primary text-brand-dark p-2 rounded"><Plus/></button>}
                      </div>
                  )
              })}
          </div>
      </div>
  );

  // STEP 3: RESUMEN CON INPUT DE COMISIÓN INTELIGENTE
  return (
    <div className="space-y-6">
       <button onClick={() => setStep(2)} className="text-brand-muted text-sm font-bold">← Volver a productos</button>
       <h2 className="text-2xl font-bold text-white font-heading">Finalizar Pedido</h2>
       
       <div className="bg-brand-card rounded-xl border border-brand-border p-4 space-y-4">
          <div className="space-y-2 pb-4 border-b border-brand-border">
             {cart.map(item => (
                <div key={item.id} className="flex justify-between text-brand-text text-sm">
                   <span>{item.qty} x {item.name}</span>
                   <span>$${(item.qty * item.price).toFixed(2)}</span>
                </div>
             ))}
          </div>
          
          <div className="space-y-3">
              <div className="flex justify-between text-brand-muted text-lg">
                  <span>Subtotal</span>
                  <span>$${subtotal.toFixed(2)}</span>
              </div>
              
              {/* INPUT DE COMISIÓN CONDICIONAL */}
              <div className="bg-brand-dark/50 p-3 rounded-lg border border-brand-border">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-brand-accent flex items-center gap-2">
                          <AlertCircle size={14} /> 
                          {isAdmin ? "Comisión Todo Kiosco (Admin)" : "Comisión de Vendedor"}
                      </label>
                      <span className="font-bold text-brand-accent">$${adminFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <Percent size={16} className="text-brand-muted" />
                      <input 
                          type="number" 
                          value={feePercent}
                          onChange={(e) => isAdmin && setFeePercent(parseFloat(e.target.value) || 0)}
                          disabled={!isAdmin} // BLOQUEADO PARA CORREDORES
                          className={`w-full bg-brand-input border border-brand-border rounded px-2 py-1 text-white text-right font-mono ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'focus:border-brand-primary'}`}
                      />
                  </div>
                  {!isAdmin && <p className="text-[10px] text-brand-muted mt-1 text-right">Tarifa fija asignada por administración.</p>}
              </div>

              <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-brand-border">
                  <span>TOTAL FINAL</span>
                  <span>$${total.toFixed(2)}</span>
              </div>
          </div>
       </div>

       <button onClick={handleFinish} disabled={isSaving} className="w-full bg-brand-primary text-brand-dark py-4 rounded-xl font-bold text-lg shadow-neon flex justify-center items-center gap-2">
         {isSaving ? "Guardando..." : <><Save /> Confirmar Pedido</>}
       </button>
    </div>
  );
}
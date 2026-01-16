const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // FORMULARIO DE PEDIDO (Con Input Manual y Categorías)
  // ==========================================
  'src/components/orders/OrderFormMobile.tsx': `'use client'
import { useState, useEffect } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Minus, Search, Save, AlertCircle, Percent, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function OrderFormMobile({ clients, products, currentUser }: { clients: any[], products: any[], currentUser: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- LÓGICA DE COMISIÓN ---
  const [feePercent, setFeePercent] = useState(0);

  useEffect(() => {
    if (currentUser?.role === 'CORREDOR') {
      setFeePercent(currentUser.commissionRate || 0);
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Obtener categorías únicas de los productos
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

  // Filtrado de productos (Búsqueda + Categoría)
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.code && p.code.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // --- MANEJO DEL CARRITO ---
  const addToCart = (p: any) => {
     const exists = cart.find(i => i.id === p.id);
     if(exists) setCart(cart.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i));
     else setCart([...cart, { id: p.id, name: p.name, price: p.priceFinal, qty: 1 }]);
  };

  const updateQty = (id: string, d: number) => {
    setCart(prev => prev.map(i => i.id===id ? {...i, qty: Math.max(0, i.qty+d)} : i).filter(i=>i.qty>0));
  };

  // NUEVO: Fijar cantidad manualmente
  const setManualQty = (id: string, val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) return; // Si borran todo, no hacemos nada visualmente hasta que pongan número
    
    if (num <= 0) {
        setCart(prev => prev.filter(i => i.id !== id));
    } else {
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: num } : i));
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const adminFee = subtotal * (feePercent / 100);
  const total = subtotal + adminFee;

  const handleFinish = async () => {
    if (!clientId || cart.length === 0) return;
    setIsSaving(true);
    const client = clients.find(c => c.id === clientId);
    
    // Enviamos el pedido
    const res = await createOrder(
        clientId, 
        "FINAL", 
        cart.map(i => ({ productId: i.id, quantity: i.qty, adjustmentType: "NONE" })), 
        client?.address || "", 
        feePercent
    );

    if (res?.error) {
        alert(res.error);
        setIsSaving(false);
    } else {
        // Redirige o limpia
        // El action ya hace redirect, pero por si acaso:
        // router.push("/admin/pedidos"); 
    }
  };

  // STEP 1: SELECCIÓN DE CLIENTE
  if (step === 1) return (
      <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-brand-muted" size={20}/>
            <input 
                placeholder="Buscar cliente..." 
                autoFocus
                className="w-full pl-10 p-4 rounded-xl bg-brand-card text-white border border-brand-border outline-none focus:border-brand-primary transition-all" 
                onChange={e=>setSearch(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            {clients.filter(c=>(c.firstName+c.lastName+c.businessName).toLowerCase().includes(search.toLowerCase())).map(c=>(
                <div key={c.id} onClick={()=>{setClientId(c.id); setStep(2); setSearch("")}} className="p-4 bg-brand-card border border-brand-border rounded-xl text-white hover:bg-brand-border/30 cursor-pointer transition-colors active:scale-95">
                    <div className="font-bold text-lg">{c.firstName} {c.lastName}</div>
                    {c.businessName && <div className="text-sm text-brand-muted">{c.businessName}</div>}
                </div>
            ))}
          </div>
      </div>
  );

  // STEP 2: SELECCIÓN DE PRODUCTOS
  if (step === 2) return (
      <div className="h-[calc(100vh-140px)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <button onClick={()=>setStep(1)} className="text-brand-muted font-bold hover:text-white transition-colors">← Cambiar Cliente</button>
              <button onClick={()=>setStep(3)} className="bg-brand-primary hover:bg-cyan-400 text-brand-dark px-4 py-2 rounded-lg font-bold shadow-neon transition-all flex items-center gap-2">
                 Ver Carrito <span className="bg-brand-dark text-brand-primary px-2 py-0.5 rounded text-xs">\$\${total.toFixed(0)}</span>
              </button>
          </div>
          
          <div className="space-y-3 mb-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-brand-muted" size={18} />
                <input 
                    placeholder="Buscar producto..." 
                    value={search} 
                    onChange={e=>setSearch(e.target.value)} 
                    className="w-full pl-10 p-3 rounded-lg bg-brand-card text-white border border-brand-border outline-none focus:border-brand-primary" 
                />
                {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-3 text-brand-muted hover:text-white"><X size={18}/></button>}
              </div>

              {/* Filtro de Categorías */}
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory("")}
                    className={\`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors \${!selectedCategory ? 'bg-brand-primary text-brand-dark' : 'bg-brand-card text-brand-muted border border-brand-border'}\`}
                  >
                    TODOS
                  </button>
                  {categories.map(cat => (
                    <button 
                        key={cat as string}
                        onClick={() => setSelectedCategory(cat as string)}
                        className={\`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors \${selectedCategory === cat ? 'bg-brand-primary text-brand-dark' : 'bg-brand-card text-brand-muted border border-brand-border'}\`}
                    >
                        {cat as string}
                    </button>
                  ))}
              </div>
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-20 pr-1 custom-scrollbar">
              {filteredProducts.map(p => {
                  const item = cart.find(i=>i.id===p.id);
                  return (
                      <div key={p.id} className={\`p-3 rounded-xl border flex justify-between items-center transition-all \${item ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-brand-card border-brand-border'}\`}>
                          <div className="flex-1">
                              <div className="text-white font-bold leading-tight">{p.name}</div>
                              <div className="text-brand-primary font-mono text-sm mt-1">\$\${p.priceFinal}</div>
                              {p.code && <div className="text-[10px] text-brand-muted">{p.code}</div>}
                          </div>
                          
                          {item ? (
                              <div className="flex items-center gap-1 bg-brand-dark rounded-lg p-1 border border-brand-border">
                                  <button onClick={()=>updateQty(p.id, -1)} className="p-2 text-brand-primary hover:bg-white/5 rounded"><Minus size={18}/></button>
                                  
                                  {/* INPUT DE CANTIDAD MANUAL */}
                                  <input 
                                    type="number" 
                                    value={item.qty} 
                                    onChange={(e) => setManualQty(p.id, e.target.value)}
                                    className="w-10 bg-transparent text-center text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  
                                  <button onClick={()=>updateQty(p.id, 1)} className="p-2 text-brand-primary hover:bg-white/5 rounded"><Plus size={18}/></button>
                              </div>
                          ) : (
                              <button onClick={()=>addToCart(p)} className="bg-brand-primary hover:bg-cyan-400 text-brand-dark p-2.5 rounded-lg shadow-neon transition-colors">
                                  <Plus size={20}/>
                              </button>
                          )}
                      </div>
                  )
              })}
              {filteredProducts.length === 0 && (
                  <div className="text-center text-brand-muted py-10">No se encontraron productos.</div>
              )}
          </div>
      </div>
  );

  // STEP 3: RESUMEN (Igual que antes pero limpio)
  return (
    <div className="space-y-6 pb-20">
       <div className="flex items-center gap-4">
           <button onClick={() => setStep(2)} className="p-2 bg-brand-card rounded-full text-brand-muted hover:text-white"><Search size={20}/></button>
           <h2 className="text-2xl font-bold text-white font-heading">Confirmar</h2>
       </div>
       
       <div className="bg-brand-card rounded-xl border border-brand-border p-4 space-y-4 shadow-lg">
          {/* ... (Lógica de resumen idéntica a tu versión anterior) ... */}
          <div className="space-y-2 pb-4 border-b border-brand-border max-h-[300px] overflow-y-auto custom-scrollbar">
             {cart.map(item => (
                <div key={item.id} className="flex justify-between text-brand-text text-sm items-center">
                   <div className="flex gap-2 items-center">
                       <span className="font-bold text-white w-6 text-right">{item.qty}</span>
                       <span className="text-brand-muted">x</span>
                       <span className="truncate max-w-[180px]">{item.name}</span>
                   </div>
                   <span className="font-mono">\$\${(item.qty * item.price).toFixed(0)}</span>
                </div>
             ))}
          </div>
          
          <div className="space-y-3">
              <div className="flex justify-between text-brand-muted text-lg">
                  <span>Subtotal</span>
                  <span>\$\${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="bg-brand-dark/50 p-3 rounded-lg border border-brand-border">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-brand-accent flex items-center gap-2">
                          <AlertCircle size={14} /> Comisión
                      </label>
                      <span className="font-bold text-brand-accent">\$\${adminFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Percent size={16} className="text-brand-muted" />
                      <input 
                          type="number" 
                          value={feePercent}
                          onChange={(e) => isAdmin && setFeePercent(parseFloat(e.target.value) || 0)}
                          disabled={!isAdmin}
                          className={\`w-full bg-brand-input border border-brand-border rounded px-2 py-1 text-white text-right font-mono \${!isAdmin ? 'opacity-50' : 'focus:border-brand-primary'}\`}
                      />
                  </div>
              </div>

              <div className="flex justify-between text-3xl font-bold text-white pt-2 border-t border-brand-border">
                  <span>TOTAL</span>
                  <span className="text-brand-primary">\$\${total.toFixed(0)}</span>
              </div>
          </div>
       </div>

       <button onClick={handleFinish} disabled={isSaving} className="w-full bg-brand-primary hover:bg-cyan-400 text-brand-dark py-4 rounded-xl font-bold text-xl shadow-neon flex justify-center items-center gap-2 transition-all">
         {isSaving ? "Guardando..." : <><Save /> Finalizar Pedido</>}
       </button>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Actualizando Formulario de Pedidos (Input Manual + Categorías)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Actualizado: ${filePath}`);
  }
}
createFiles();
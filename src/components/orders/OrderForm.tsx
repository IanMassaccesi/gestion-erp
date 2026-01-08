'use client'

import { useState, useEffect } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Trash2, Save, ShoppingCart, AlertCircle, MapPin } from "lucide-react";

type Client = { id: string; firstName: string; lastName: string; address: string };
type Product = { id: string; name: string; code: string; priceMayor: number; priceMinor: number; priceFinal: number; };
type AdjustmentType = "NONE" | "FIXED_PRICE" | "PERCENTAGE_OFF" | "PERCENTAGE_MARKUP";

export function OrderForm({ clients, products }: { clients: Client[], products: Product[] }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [shippingAddress, setShippingAddress] = useState(""); // Estado para la dirección
  const [priceTier, setPriceTier] = useState<"MAYOR" | "MINOR" | "FINAL">("FINAL");
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adjType, setAdjType] = useState<AdjustmentType>("NONE");
  const [adjValue, setAdjValue] = useState<number>(0);
  const [cart, setCart] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Cuando cambia el cliente, auto-completamos la dirección
  useEffect(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (client) {
      setShippingAddress(client.address || "");
    } else {
      setShippingAddress("");
    }
  }, [selectedClientId, clients]);

  const getCurrentBasePrice = (product: Product | undefined) => {
    if (!product) return 0;
    switch (priceTier) {
      case "MAYOR": return product.priceMayor;
      case "MINOR": return product.priceMinor;
      case "FINAL": return product.priceFinal;
      default: return product.priceFinal;
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const basePrice = getCurrentBasePrice(product);
    let finalPrice = basePrice;
    if (adjType === "FIXED_PRICE" && adjValue > 0) finalPrice = adjValue;
    if (adjType === "PERCENTAGE_OFF" && adjValue > 0) finalPrice = basePrice * (1 - adjValue/100);
    if (adjType === "PERCENTAGE_MARKUP" && adjValue > 0) finalPrice = basePrice * (1 + adjValue/100);

    setCart([...cart, { productId: product.id, name: product.name, finalUnitPrice: finalPrice, quantity, adjType, adjValue }]);
    setQuantity(1); setAdjType("NONE"); setAdjValue(0);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (!selectedClientId || cart.length === 0) return;
    setIsSaving(true);
    const itemsPayload = cart.map(i => ({ productId: i.productId, quantity: i.quantity, adjustmentType: i.adjType, adjustmentValue: i.adjValue }));
    // Enviamos la dirección también
    await createOrder(selectedClientId, priceTier, itemsPayload, shippingAddress);
  };

  const total = cart.reduce((acc, item) => acc + (item.finalUnitPrice * item.quantity), 0);
  const currentProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-bold text-brand-dark block mb-2">Cliente</label>
              <select className="w-full p-2 border border-gray-200 rounded-lg bg-white" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="text-sm font-bold text-brand-dark block mb-2">Lista</label>
              <select className="w-full p-2 border border-gray-200 rounded-lg" value={priceTier} onChange={(e) => setPriceTier(e.target.value as any)}>
                <option value="FINAL">Final</option><option value="MINOR">Minorista</option><option value="MAYOR">Mayorista</option>
              </select>
            </div>
          </div>
          
          {/* NUEVO INPUT DE DIRECCIÓN */}
          <div>
            <label className="text-sm font-bold text-brand-dark block mb-2">Dirección de Envío</label>
            <div className="flex gap-2 items-center">
              <MapPin size={20} className="text-gray-400" />
              <input 
                className="w-full p-2 border border-gray-200 rounded-lg" 
                value={shippingAddress} 
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Calle, Número, Localidad (Confirmar con cliente)"
              />
            </div>
          </div>
        </div>

        {/* SECCION PRODUCTOS (Simplificada para ahorrar espacio en generator, es igual a la anterior) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-brand-primary mb-4 border-b pb-2">Productos</h3>
           <div className="flex gap-2 items-end">
             <div className="flex-1"><label className="text-xs mb-1 block">Producto</label>
              <select className="w-full p-2 border rounded-lg" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">-- Buscar --</option>{products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
              </select>
             </div>
             <div className="w-20"><label className="text-xs mb-1 block">Cant.</label><input type="number" min="1" className="w-full p-2 border rounded-lg" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} /></div>
             <button onClick={handleAddItem} disabled={!selectedProductId} className="bg-brand-primary text-white p-2 rounded-lg"><Plus /></button>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-[500px]">
        <h3 className="font-bold text-brand-primary mb-4 flex items-center gap-2"><ShoppingCart size={20} /> Resumen</h3>
        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded border flex justify-between">
              <div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">{item.quantity} x $${item.finalUnitPrice}</p></div>
              <div className="flex items-center gap-2"><span className="font-bold">$${item.finalUnitPrice * item.quantity}</span><button onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 size={14} /></button></div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between font-bold text-xl mb-4"><span>Total:</span><span>$${total.toFixed(2)}</span></div>
          <button onClick={handleSubmit} disabled={isSaving || cart.length === 0} className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold">{isSaving ? "Guardando..." : "Confirmar Pedido"}</button>
        </div>
      </div>
    </div>
  );
}
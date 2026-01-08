const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. SERVER ACTIONS: RUTAS Y ENTREGAS ---
  'src/actions/routes-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Crear una Hoja de Ruta
export async function createRoute(formData: FormData) {
  const driverId = formData.get("driverId") as string;
  const dateStr = formData.get("date") as string;
  const orderIds = formData.getAll("orderIds") as string[]; // IDs de pedidos seleccionados
  const useCodes = formData.get("useCodes") === "on"; // Checkbox

  if (!driverId || !dateStr || orderIds.length === 0) {
    return { error: "Faltan datos (Chofer, Fecha o Pedidos)" };
  }

  try {
    // 1. Crear la Ruta
    const route = await prisma.deliveryRoute.create({
      data: {
        routeNumber: \`RUT-\${Date.now().toString().slice(-6)}\`,
        date: new Date(dateStr),
        driverId,
        status: "PENDING"
      }
    });

    // 2. Actualizar los pedidos seleccionados
    // Si se activó "useCodes", generamos un código aleatorio de 4 dígitos para cada pedido
    for (const orderId of orderIds) {
      const code = useCodes ? Math.floor(1000 + Math.random() * 9000).toString() : null;
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryRouteId: route.id,
          status: "PREPARING", // Cambiamos estado a "En preparación"
          deliveryCode: code,
          requiresCode: useCodes
        }
      });
    }

  } catch (error) {
    console.error(error);
    return { error: "Error al crear la ruta" };
  }

  revalidatePath("/admin/rutas");
  redirect("/admin/rutas");
}

// Marcar pedido como ENTREGADO
export async function deliverOrder(orderId: string, inputCode?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado" };

  // Validar código si es necesario
  if (order.requiresCode) {
    if (inputCode !== order.deliveryCode) {
      return { error: "Código de entrega incorrecto" };
    }
  }

  // Actualizar estado
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED" }
  });

  revalidatePath(\`/admin/rutas/\${order.deliveryRouteId}\`);
  return { success: true };
}`,

  // --- 2. ACTUALIZACIÓN: ORDER ACTION (Para guardar dirección) ---
  // NOTA: Sobrescribimos la anterior para añadir shippingAddress
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string // NUEVO CAMPO
) {
  if (!customerId || items.length === 0) {
    return { error: "Falta el cliente o productos en el pedido" };
  }

  try {
    const productIds = items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let totalOrder = 0;

    const orderItemsData = items.map(item => {
      const product = dbProducts.find(p => p.id === item.productId);
      if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);

      let basePrice = 0;
      switch (priceTier) {
        case "MAYOR": basePrice = product.priceMayor; break;
        case "MINOR": basePrice = product.priceMinor; break;
        case "FINAL": basePrice = product.priceFinal; break;
        default: basePrice = product.priceFinal;
      }

      let unitPrice = basePrice;
      if (item.adjustmentType === "FIXED_PRICE" && item.adjustmentValue) unitPrice = item.adjustmentValue;
      else if (item.adjustmentType === "PERCENTAGE_OFF" && item.adjustmentValue) unitPrice = basePrice * (1 - (item.adjustmentValue / 100));
      else if (item.adjustmentType === "PERCENTAGE_MARKUP" && item.adjustmentValue) unitPrice = basePrice * (1 + (item.adjustmentValue / 100));

      unitPrice = Math.max(0, unitPrice);
      const subtotal = unitPrice * item.quantity;
      totalOrder += subtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        basePriceTier: priceTier,
        basePrice: basePrice,
        priceAdjustmentType: item.adjustmentType,
        priceAdjustmentValue: item.adjustmentValue || 0,
        unitPrice: unitPrice,
        subtotal: subtotal
      };
    });

    const orderNumber = \`PED-\${Date.now().toString().slice(-6)}\`;

    await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddress: shippingAddress || "Retira en local", // Guardamos la dirección
        appliedPriceTier: priceTier,
        subtotal: totalOrder,
        total: totalOrder,
        status: "CONFIRMED",
        items: {
          create: orderItemsData.map(data => ({
            productId: data.productId,
            quantity: data.quantity,
            basePriceTier: data.basePriceTier,
            basePrice: data.basePrice,
            priceAdjustmentType: data.priceAdjustmentType,
            priceAdjustmentValue: data.priceAdjustmentValue,
            unitPrice: data.unitPrice,
            subtotal: data.subtotal
          }))
        },
        user: { connect: { email: 'admin@tuempresa.com' } }
      }
    });

  } catch (error) {
    console.error("Error creando pedido:", error);
    return { error: "Error al guardar el pedido." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/dashboard");
  redirect("/admin/pedidos");
}`,

  // --- 3. ACTUALIZACIÓN: ORDER FORM (Para input de dirección) ---
  'src/components/orders/OrderForm.tsx': `'use client'

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
              <div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">{item.quantity} x \$\${item.finalUnitPrice}</p></div>
              <div className="flex items-center gap-2"><span className="font-bold">\$\${item.finalUnitPrice * item.quantity}</span><button onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 size={14} /></button></div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between font-bold text-xl mb-4"><span>Total:</span><span>\$\${total.toFixed(2)}</span></div>
          <button onClick={handleSubmit} disabled={isSaving || cart.length === 0} className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold">{isSaving ? "Guardando..." : "Confirmar Pedido"}</button>
        </div>
      </div>
    </div>
  );
}`,

  // --- 4. LISTADO DE RUTAS ---
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
        <div><h1 className="text-3xl font-bold font-heading text-brand-primary">Rutas de Entrega</h1><p className="text-gray-500">Logística y despachos</p></div>
        <Link href="/admin/rutas/nueva" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={20} /> Nueva Ruta</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => (
          <Link key={route.id} href={\`/admin/rutas/\${route.id}\`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-light/10 text-brand-primary rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors"><Truck size={24} /></div>
              <span className={\`px-3 py-1 rounded-full text-xs font-bold \${route.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}\`}>{route.status}</span>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-1">{route.routeNumber}</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="flex items-center gap-2"><Calendar size={14} /> {route.date.toLocaleDateString()}</p>
              <p>Chofer: <span className="font-medium text-brand-dark">{route.driver.firstName} {route.driver.lastName}</span></p>
              <p className="text-brand-accent font-medium">{route._count.orders} pedidos asignados</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`,

  // --- 5. NUEVA RUTA (BUILDER) ---
  'src/app/admin/rutas/nueva/page.tsx': `import { prisma } from "@/lib/prisma";
import { createRoute } from "@/actions/routes-actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default async function NuevaRutaPage() {
  // Solo choferes (usuarios que no son ADMIN, o podrías filtrar por rol especifico)
  const drivers = await prisma.user.findMany({ where: { role: 'CORREDOR' } });
  
  // Pedidos confirmados que NO tienen ruta asignada
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'CONFIRMED', deliveryRouteId: null },
    include: { customer: true }
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-brand-primary">Armar Nueva Ruta</h1>
      </div>

      <form action={createRoute} className="space-y-6">
        {/* Configuración General */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-2">Fecha de Entrega</label>
            <input type="date" name="date" required className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-2">Chofer Asignado</label>
            <select name="driverId" required className="w-full p-2 border rounded-lg bg-white">
              {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
           <div className="flex items-center pt-6 gap-2">
            <input type="checkbox" name="useCodes" id="useCodes" className="w-5 h-5 text-brand-primary" />
            <label htmlFor="useCodes" className="text-sm font-medium text-brand-dark">Requerir código de seguridad</label>
          </div>
        </div>

        {/* Selección de Pedidos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-brand-primary mb-4">Seleccionar Pedidos Disponibles</h3>
          {pendingOrders.length === 0 ? <p className="text-gray-400">No hay pedidos pendientes de ruta.</p> : (
            <div className="space-y-2">
              {pendingOrders.map(order => (
                <label key={order.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                  <input type="checkbox" name="orderIds" value={order.id} className="mt-1 w-5 h-5" />
                  <div>
                    <span className="font-bold text-brand-dark block">{order.orderNumber} - {order.customer.firstName} {order.customer.lastName}</span>
                    <span className="text-sm text-gray-500 block">{order.shippingAddress}</span>
                    <span className="text-xs text-brand-accent font-medium">Total: \$\${order.total}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-brand-primary text-white px-8 py-3 rounded-lg font-bold flex gap-2"><Save /> Crear Ruta</button>
        </div>
      </form>
    </div>
  );
}`,

  // --- 6. DETALLE DE RUTA (HOJA DE RUTA) ---
  'src/app/admin/rutas/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { deliverOrder } from "@/actions/routes-actions";
import Link from "next/link";
import { ArrowLeft, CheckCircle, MapPin, Lock } from "lucide-react";

export default async function DetalleRutaPage({ params }: { params: { id: string } }) {
  const route = await prisma.deliveryRoute.findUnique({
    where: { id: params.id },
    include: { driver: true, orders: { include: { customer: true } } }
  });

  if (!route) return <div>Ruta no encontrada</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Hoja de Ruta: {route.routeNumber}</h1>
          <p className="text-gray-500">Chofer: {route.driver.firstName} {route.driver.lastName}</p>
        </div>
      </div>

      <div className="space-y-8">
        {route.orders.map((order, index) => (
          <div key={order.id} className={\`bg-white rounded-xl shadow-md overflow-hidden border-l-8 \${order.status === 'DELIVERED' ? 'border-green-500 opacity-75' : 'border-brand-primary'}\`}>
            
            {/* Header del Pedido */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parada #{index + 1}</span>
                <h3 className="text-lg font-bold text-brand-dark">{order.customer.firstName} {order.customer.lastName}</h3>
              </div>
              <div className="text-right">
                <span className="block font-mono font-bold text-brand-primary">{order.orderNumber}</span>
                {order.status === 'DELIVERED' && <span className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end"><CheckCircle size={12} /> ENTREGADO</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Información y Acciones */}
              <div className="p-6 space-y-4">
                 <div className="flex items-start gap-3">
                    <MapPin className="text-brand-accent mt-1" />
                    <div>
                      <p className="font-bold text-brand-dark">Dirección de Entrega</p>
                      <p className="text-gray-600">{order.shippingAddress || order.customer.address}</p>
                    </div>
                 </div>

                 {order.status !== 'DELIVERED' && (
                   <div className="mt-4 pt-4 border-t border-gray-100">
                      <form action={async (formData) => {
                          'use server';
                          await deliverOrder(order.id, formData.get('code') as string);
                      }}>
                        {order.requiresCode && (
                          <div className="mb-3">
                            <label className="text-xs font-bold text-brand-dark flex items-center gap-1 mb-1"><Lock size={12} /> Código de Seguridad</label>
                            <input name="code" type="text" placeholder="Ingrese código (ej: 1234)" className="w-full p-2 border border-brand-light rounded bg-blue-50" />
                            <p className="text-xs text-gray-400 mt-1">El código es: <span className="font-mono text-gray-800 font-bold"> {order.deliveryCode}</span> (Visible solo para admin)</p>
                          </div>
                        )}
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transform active:scale-95 transition-all">
                          MARCAR COMO ENTREGADO
                        </button>
                      </form>
                   </div>
                 )}
              </div>

              {/* Mapa Embed (Google Maps Simple) */}
              <div className="h-64 md:h-auto bg-gray-200 relative">
                 <iframe 
                   width="100%" 
                   height="100%" 
                   style={{ border: 0 }}
                   loading="lazy"
                   src={\`https://maps.google.com/maps?q=\${encodeURIComponent(order.shippingAddress || order.customer.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed\`}
                 ></iframe>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando módulo de ENVIOS y RUTAS...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado/Actualizado: ${filePath}`);
  }
}
createFiles();
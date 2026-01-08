const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. LÓGICA DE PEDIDOS (Server Action) ---
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Definimos el tipo de datos que esperamos recibir del formulario
type OrderItemInput = {
  productId: string;
  quantity: number;
};

export async function createOrder(customerId: string, items: OrderItemInput[]) {
  if (!customerId || items.length === 0) {
    return { error: "Falta el cliente o productos en el pedido" };
  }

  try {
    // 1. Buscamos los productos para obtener sus precios reales (seguridad)
    const productIds = items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    // 2. Calculamos los totales
    let totalOrder = 0;
    const orderItemsData = items.map(item => {
      const product = dbProducts.find(p => p.id === item.productId);
      if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);

      const unitPrice = product.priceFinal; // Usamos precio final por defecto
      const subtotal = unitPrice * item.quantity;
      
      totalOrder += subtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        basePrice: product.priceMayor, // Guardamos referencia del costo base
        basePriceTier: "FINAL" // Asumimos precio final
      };
    });

    // 3. Generamos un número de orden simple (Timestamp)
    const orderNumber = \`PED-\${Date.now().toString().slice(-6)}\`;

    // 4. Guardamos todo en la base de datos (Cabecera + Items)
    await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        userId: "clhk...", // Aquí idealmente iría el ID del usuario logueado. Como no tenemos login real aún, esto fallaría si validamos la FK. 
                           // TRUCO RAPIDO: Buscaremos el primer usuario Admin para asignarle el pedido.
        appliedPriceTier: "FINAL",
        subtotal: totalOrder,
        total: totalOrder,
        status: "CONFIRMED",
        items: {
          create: orderItemsData.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            basePrice: item.basePrice,
            basePriceTier: "FINAL" as any
          }))
        },
        // Buscamos un usuario temporalmente:
        user: {
           connect: { email: 'admin@tuempresa.com' } 
        }
      }
    });

  } catch (error) {
    console.error("Error creando pedido:", error);
    return { error: "Error al guardar el pedido. Revisa la consola." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/dashboard");
  redirect("/admin/pedidos");
}`,

  // --- 2. COMPONENTE DE FORMULARIO (INTERACTIVO) ---
  'src/components/orders/OrderForm.tsx': `'use client'

import { useState } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Trash2, Save, ShoppingCart } from "lucide-react";

// Tipos básicos para las props
type Client = { id: string; firstName: string; lastName: string; businessName: string | null };
type Product = { id: string; name: string; priceFinal: number; code: string };

export function OrderForm({ clients, products }: { clients: Client[], products: Product[] }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<{ productId: string; name: string; price: number; quantity: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Agregar producto al carrito visual
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Si ya existe, sumamos cantidad
    const existing = cart.find(item => item.productId === selectedProductId);
    if (existing) {
      setCart(cart.map(item => item.productId === selectedProductId ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.priceFinal, quantity }]);
    }
    setQuantity(1); // Reset cantidad
  };

  // Eliminar del carrito
  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.productId !== id));
  };

  // Guardar en el servidor
  const handleSubmit = async () => {
    if (!selectedClientId || cart.length === 0) {
      alert("Selecciona un cliente y agrega productos.");
      return;
    }
    setIsSaving(true);
    await createOrder(selectedClientId, cart.map(i => ({ productId: i.productId, quantity: i.quantity })));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMNA IZQUIERDA: Selección */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Selección de Cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-brand-primary mb-4">1. Cliente</h3>
          <select 
            className="w-full p-3 border border-gray-200 rounded-lg bg-white"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} {c.businessName ? \`(\${c.businessName})\` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Productos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-brand-primary mb-4">2. Agregar Productos</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block">Producto</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Buscar Producto --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ($\${p.priceFinal})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="text-sm text-gray-500 mb-1 block">Cant.</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-3 border border-gray-200 rounded-lg"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <button 
              onClick={handleAddItem}
              type="button"
              className="bg-brand-teal hover:bg-teal-600 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: Resumen / Carrito */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-[500px]">
        <h3 className="font-bold text-brand-primary mb-4 flex items-center gap-2">
          <ShoppingCart size={20} /> Resumen del Pedido
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">El carrito está vacío</p>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-sm text-brand-dark">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} x \$\${item.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-dark">\$\${item.price * item.quantity}</span>
                  <button onClick={() => handleRemoveItem(item.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
          <div className="flex justify-between items-center text-xl font-bold text-brand-dark">
            <span>Total:</span>
            <span>\$\${total.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={isSaving || cart.length === 0}
            className="w-full bg-brand-primary hover:bg-brand-dark text-white py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSaving ? "Procesando..." : (
              <>
                <Save size={20} /> Confirmar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}`,

  // --- 3. PAGINA DE NUEVO PEDIDO (WRAPPER) ---
  'src/app/admin/pedidos/nuevo/page.tsx': `import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/components/orders/OrderForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NuevoPedidoPage() {
  // Obtenemos datos para llenar los selects
  const [clients, products] = await Promise.all([
    prisma.customer.findMany({ where: { isDeleted: false }, select: { id: true, firstName: true, lastName: true, businessName: true } }),
    prisma.product.findMany({ where: { isDeleted: false }, select: { id: true, name: true, priceFinal: true, code: true } })
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pedidos" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-primary">Nuevo Pedido</h1>
        </div>
      </div>
      
      <OrderForm clients={clients} products={products} />
    </div>
  );
}`,

  // --- 4. LISTA DE PEDIDOS ---
  'src/app/admin/pedidos/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

export default async function PedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true } // Traemos los datos del cliente
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Pedidos</h1>
          <p className="text-gray-500">Gestión de ventas</p>
        </div>
        <Link 
          href="/admin/pedidos/nuevo" 
          className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Nuevo Pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b border-gray-100">
            <tr>
              <th className="p-4">N° Orden</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Total</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay pedidos registrados.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-brand-accent">{o.orderNumber}</td>
                  <td className="p-4 font-medium text-brand-dark">{o.customer.firstName} {o.customer.lastName}</td>
                  <td className="p-4">{o.createdAt.toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-brand-dark">\$\${o.total.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button className="text-brand-light hover:text-brand-primary"><Eye size={20} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando módulo de PEDIDOS...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
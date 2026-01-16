const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SISTEMA CENTRAL DE LOGS (Server Actions)
  // ==========================================
  'src/actions/logger-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// --- FUNCIÓN INTERNA PARA REGISTRAR (Se llama desde otras actions) ---
export async function registrarLog(action: string, details: string, type: 'PEDIDO' | 'RUTA' | 'SISTEMA' | 'PRODUCTO' | 'CLIENTE') {
  try {
    const session = await getSession();
    // Si es una acción del sistema (ej: cron job) y no hay sesión, usamos un ID genérico o null si el schema lo permite.
    // Asumimos que siempre hay un usuario logueado para estas acciones.
    const userId = session?.user?.id;

    if (userId) {
        await prisma.logEntry.create({
            data: {
                action,
                details,
                type,
                userId
            }
        });
    }
  } catch (error) {
    console.error("Error al registrar log:", error);
    // No fallamos la acción principal si el log falla
  }
}

// --- OBTENER LOGS PARA EL FRONTEND ---
export async function getLogs(filters?: { userId?: string; type?: string; search?: string }) {
  const where: any = {};

  if (filters?.userId && filters.userId !== 'TODOS') {
    where.userId = filters.userId;
  }

  if (filters?.type && filters.type !== 'TODOS') {
    where.type = filters.type;
  }

  if (filters?.search) {
    where.details = { contains: filters.search, mode: 'insensitive' };
  }

  return await prisma.logEntry.findMany({
    where,
    include: { user: true },
    orderBy: { timestamp: 'desc' },
    take: 100 // Limitamos a los últimos 100 para no saturar
  });
}`,

  // ==========================================
  // 2. ACTUALIZAR ORDERS ACTIONS (Con Logs Inyectados)
  // ==========================================
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions"; // IMPORTAMOS LOGGER

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// --- CREAR PEDIDO ---
export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0
) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { error: "No autorizado." };
  if (!customerId || items.length === 0) return { error: "Faltan datos." };

  let newOrderId = "";
  let orderNumberLog = "";

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);
        if (product.currentStock < item.quantity) throw new Error(\`Stock insuficiente para \${product.name}\`);

        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          default: basePrice = product.priceFinal;
        }

        const subtotal = basePrice * item.quantity;
        subtotalOrder += subtotal;

        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType || "NONE",
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: basePrice,
          subtotal: subtotal
        });
      }

      const adminFee = subtotalOrder * (feePercent / 100);
      const totalOrder = subtotalOrder + adminFee;
      const orderNumber = "PED-" + Date.now().toString().slice(-6);
      orderNumberLog = orderNumber;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customerId } },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: subtotalOrder,
          adminFee: adminFee,
          total: totalOrder,
          status: "NO_PAGO", 
          items: { create: orderItemsData },
          user: { connect: { id: userId } }
        }
      });
      newOrderId = order.id;
    });

    // LOG
    await registrarLog("CREAR_PEDIDO", \`Creó el pedido \${orderNumberLog} por \$\${items.length} items.\`, "PEDIDO");

  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message || "Error al procesar." };
  }

  revalidatePath("/admin/pedidos");
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}

// --- CAMBIAR ESTADO ---
export async function updateOrderStatus(orderId: string, newStatus: any) {
  const oldOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, orderNumber: true } });
  
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });

  // LOG
  if (oldOrder) {
    await registrarLog("CAMBIO_ESTADO", \`Pedido \${oldOrder.orderNumber}: \${oldOrder.status} -> \${newStatus}\`, "PEDIDO");
  }

  revalidatePath("/admin/pedidos");
}

// --- IMPRIMIR (HOJA DE RUTA) ---
export async function markOrdersAsPrinted(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: 'IMPRESO' }
  });

  // LOG
  await registrarLog("HOJA_RUTA", \`Generó hoja de ruta para \${orderIds.length} pedidos.\`, "RUTA");

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

// --- OTRAS FUNCIONES (Sin cambios de lógica, solo mantenidas) ---
export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: item.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });

  // LOG
  await registrarLog("CANCELAR_PEDIDO", \`Canceló el pedido \${order.orderNumber} y repuso stock.\`, "PEDIDO");

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function getFilteredOrders(status?: string, search?: string) {
  const where: any = {};
  if (status && status !== 'TODOS') where.status = status;
  else if (!status) where.status = { notIn: ['IMPRESO', 'CANCELLED', 'DELIVERED'] };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  return await prisma.order.findMany({ where, include: { customer: true, user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
}`,

  // ==========================================
  // 3. PÁGINA DE AUDITORÍA (Dark Neon)
  // ==========================================
  'src/app/admin/auditoria/page.tsx': `'use client'

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
                            <div className={\`p-3 rounded-full \${
                                log.type === 'PEDIDO' ? 'bg-blue-900/30 text-blue-400' :
                                log.type === 'RUTA' ? 'bg-purple-900/30 text-purple-400' :
                                log.type === 'PRODUCTO' ? 'bg-green-900/30 text-green-400' :
                                'bg-slate-700 text-slate-300'
                            }\`}>
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
                                    {log.user ? \`\${log.user.firstName} \${log.user.lastName}\` : 'Sistema'}
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
}`
};

function createFiles() {
  console.log('🚀 Implementando Módulo de Auditoría (Logs)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();
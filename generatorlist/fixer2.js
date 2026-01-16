const fs = require('fs');
const path = require('path');

// Contenido de los archivos corregidos
const files = {

  // 1. SCHEMA: HÍBRIDO (Viejos + Nuevos)
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CORREDOR
}

enum ClientType {
  MAYORISTA
  MINORISTA
  FINAL
}

enum PriceTier {
  MAYOR
  MINOR
  FINAL
}

// ESTRATEGIA HÍBRIDA: Mantenemos TODO
enum OrderStatus {
  // Estados Viejos (Legacy)
  DRAFT
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERING
  DELIVERED
  CANCELLED
  
  // Estados Nuevos (Gestión Financiera)
  NO_PAGO
  PAGO
  FIADO
  IMPRESO
}

enum RouteStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum PriceAdjustmentType {
  NONE
  FIXED_PRICE
  PERCENTAGE_OFF
  PERCENTAGE_MARKUP
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  password       String
  firstName      String
  lastName       String
  role           Role     @default(CORREDOR)
  isActive       Boolean  @default(true)
  commissionRate Float    @default(0)
  isRunner       Boolean  @default(false)
  isDriver       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  orders         Order[]         @relation("OrderCreatedBy")
  routes         DeliveryRoute[]
  logs           LogEntry[]
  notifications  Notification[]
  createdClients Customer[]      @relation("ClientCreator")
  shifts         CashShift[]
}

model Customer {
  id              String      @id @default(cuid())
  firstName       String
  lastName        String
  businessName    String?
  dniCuit         String      @unique
  phone           String?
  email           String?
  address         String
  city            String?
  type            ClientType  @default(FINAL)
  specialDiscount Float       @default(0)
  isDeleted       Boolean     @default(false)
  deletedAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  orders          Order[]
  createdById     String?
  createdBy       User?       @relation("ClientCreator", fields: [createdById], references: [id])
}

model Product {
  id           String    @id @default(cuid())
  code         String?   @unique
  name         String
  description  String?
  category     String?
  currentStock Int
  minStock     Int       @default(0)
  unit         String    @default("UNIDAD")
  imageUrl     String?
  priceMayor   Float
  priceMinor   Float
  priceFinal   Float
  isActive     Boolean   @default(true)
  isDeleted    Boolean   @default(false)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  orderItems   OrderItem[]
}

model Order {
  id               String         @id @default(cuid())
  orderNumber      String         @unique
  customerId       String
  customer         Customer       @relation(fields: [customerId], references: [id], onDelete: Restrict)
  userId           String
  user             User           @relation("OrderCreatedBy", fields: [userId], references: [id], onDelete: Restrict)
  shippingAddress  String?
  deliveryCode     String?
  requiresCode     Boolean        @default(false) 
  deliveryRouteId  String?        
  deliveryRoute    DeliveryRoute? @relation(fields: [deliveryRouteId], references: [id], onDelete: SetNull)
  appliedPriceTier PriceTier
  subtotal         Float
  discount         Float          @default(0)
  adminFee         Float          @default(0)
  total            Float
  status           OrderStatus    @default(PENDING)
  deliveryDate     DateTime?
  notes            String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  items            OrderItem[]
  transactions     CashTransaction[]
  shipment         Shipment?
}

model OrderItem {
  id                   String              @id @default(cuid())
  orderId              String
  order                Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId            String
  product              Product             @relation(fields: [productId], references: [id], onDelete: Restrict)
  quantity             Int
  basePriceTier        PriceTier           @default(MAYOR)
  basePrice            Float
  priceAdjustmentType  PriceAdjustmentType @default(NONE)
  priceAdjustmentValue Float?
  unitPrice            Float
  subtotal             Float
  priceNote            String?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
}

model DeliveryRoute {
  id          String      @id @default(cuid())
  routeNumber String?     @unique
  date        DateTime
  driverId    String?
  driver      User?       @relation(fields: [driverId], references: [id], onDelete: SetNull)
  status      RouteStatus @default(PENDING)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orders      Order[]
}

model Shipment {
  id            String   @id @default(cuid())
  trackingCode  String   @unique
  provider      String   @default("CORREO ARGENTINO")
  status        String   @default("PREPARACION")
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  labelUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CashShift {
  id             String    @id @default(cuid())
  openedAt       DateTime  @default(now())
  closedAt       DateTime?
  startAmount    Float
  endAmount      Float?
  systemAmount   Float?
  difference     Float?
  status         String    @default("OPEN")
  transactions   CashTransaction[]
  openedById     String
  openedBy       User      @relation(fields: [openedById], references: [id])
}

model CashTransaction {
  id             String    @id @default(cuid())
  date           DateTime  @default(now())
  amount         Float
  type           String    // IN, OUT
  category       String
  description    String?
  shiftId        String
  shift          CashShift @relation(fields: [shiftId], references: [id])
  orderId        String?
  order          Order?    @relation(fields: [orderId], references: [id])
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String
  type        String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model LogEntry {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  action    String
  details   String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  type      String
}`,

  // 2. ORDERS ACTIONS: Backup (5 args) + Nuevas Funciones
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// --- FUNCIÓN DEL BACKUP (5 args para compatibilidad con OrderForm) ---
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

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) throw new Error("Producto no encontrado: " + item.productId);
        if (product.currentStock < item.quantity) throw new Error("Stock insuficiente: " + product.name);

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

      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customerId } },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: subtotalOrder,
          adminFee: adminFee,
          total: totalOrder,
          status: "NO_PAGO", // Default al nuevo flujo
          items: { create: orderItemsData },
          user: { connect: { id: userId } }
        }
      });
      newOrderId = order.id;
    });
  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message || "Error al procesar." };
  }

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos/" + newOrderId);
}

// --- CANCELAR ---
export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });
  });

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

// --- NUEVAS FUNCIONES PARA EL GESTOR DE PEDIDOS ---

export async function markOrdersAsPrinted(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: 'IMPRESO' }
  });
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function updateOrderStatus(orderId: string, newStatus: any) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });
  revalidatePath("/admin/pedidos");
}

export async function getFilteredOrders(status?: string, search?: string) {
  const where: any = {};

  if (status && status !== 'TODOS') {
    where.status = status;
  } else if (!status) {
    // Filtro por defecto: Mostrar todo MENOS lo archivado o cancelado
    where.status = { notIn: ['IMPRESO', 'CANCELLED', 'DELIVERED'] };
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return await prisma.order.findMany({
    where,
    include: { customer: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}`,

  // 3. ADMIN PEDIDOS PAGE: Estética Dark + Lógica Híbrida
  'src/app/admin/pedidos/page.tsx': `'use client'

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
    router.push(\`/admin/pedidos/imprimir?ids=\${idsParam}\`);
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
                  <td className="p-4 font-bold text-white">\$\${order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="bg-transparent border border-slate-700 rounded px-2 py-1 text-xs font-bold text-slate-300">
                        <option className="bg-slate-900" value="NO_PAGO">NO PAGO</option>
                        <option className="bg-slate-900" value="PAGO">PAGO</option>
                        <option className="bg-slate-900" value="FIADO">FIADO</option>
                        <option className="bg-slate-900" value="PENDING">PENDIENTE</option>
                        <option className="bg-slate-900" value="IMPRESO">ARCHIVADO</option>
                    </select>
                  </td>
                  <td className="p-4 text-right"><Link href={\`/admin/pedidos/\${order.id}\`}><Eye size={18} className="inline text-slate-500 hover:text-cyan-400"/></Link></td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}`,

  // 4. ADMIN ENVIOS: Fix TS includes
  'src/app/admin/envios/page.tsx': `import { prisma } from "@/lib/prisma";
import { createShipment } from "@/actions/shipping-actions";
import { Truck, MapPin, Package, User } from "lucide-react";

export default async function EnviosPage() {
  const ordersReadyToShip = await prisma.order.findMany({
    where: { 
      status: { in: ['NO_PAGO', 'PAGO', 'FIADO', 'CONFIRMED'] }, // Incluimos CONFIRMED por si acaso
      shippingAddress: { not: null }, 
      shipment: null
    },
    include: { customer: true }, // FIX: Include customer
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 text-slate-200">
      <h1 className="text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gestión de Envíos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ordersReadyToShip.map(order => (
          <div key={order.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-start mb-4">
               <div><h3 className="font-bold text-white text-lg">#{order.orderNumber}</h3><p className="text-slate-500 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p></div>
               <span className="bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded text-xs font-bold border border-cyan-800">{order.status}</span>
            </div>
            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300"><User size={16}/><span className="font-bold">{order.customer.firstName} {order.customer.lastName}</span></div>
                <div className="flex items-start gap-2 text-slate-400 text-sm"><MapPin size={16} className="mt-1 shrink-0"/><span>{order.shippingAddress}</span></div>
            </div>
            <form action={async (formData) => { 'use server'; await createShipment(formData); }}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"><Truck size={20} /> Generar Etiqueta</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // 5. RUTAS NUEVA: Fix includes
  'src/app/admin/rutas/nueva/page.tsx': `import { prisma } from "@/lib/prisma";
import { createRoute } from "@/actions/routes-actions";
import Link from "next/link";
import { ArrowLeft, Truck, Save, MapPin } from "lucide-react";

export default async function NuevaRutaPage() {
  const drivers = await prisma.user.findMany({ where: { isDriver: true, isActive: true } });
  
  const orders = await prisma.order.findMany({ 
    where: { 
        status: { in: ['NO_PAGO', 'FIADO', 'CONFIRMED'] },
        deliveryRouteId: null,
        shippingAddress: { not: null }
    },
    include: { customer: true }, // FIX
    orderBy: { customer: { address: 'asc' } }
  });

  return (
    <div className="max-w-4xl mx-auto pb-20 text-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/rutas" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Nueva Hoja de Ruta</h1>
      </div>
      <form action={async (formData) => { 'use server'; await createRoute(formData); }} className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Nombre Ruta</label><input name="name" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"/></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Chofer</label><select name="driverId" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"><option value="null">-- Sin Chofer --</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none text-white"/></div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg space-y-2">
            <h3 className="font-bold text-cyan-400 mb-4">Pedidos Disponibles</h3>
            {orders.map(order => (
                <label key={order.id} className="flex items-center gap-4 p-4 border border-slate-800 rounded-lg hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" name="orderIds" value={order.id} className="w-5 h-5 accent-cyan-500"/>
                    <div className="flex-1 flex justify-between">
                        <div><span className="font-bold text-cyan-400">#{order.orderNumber}</span> <span className="text-slate-300 ml-2">{order.customer.firstName} {order.customer.lastName}</span></div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {order.shippingAddress}</div>
                    </div>
                </label>
            ))}
        </div>
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2"><Save size={24} /> Crear Ruta</button>
      </form>
    </div>
  );
}`,

  // 6. RUTAS DETALLE: Fix includes
  'src/app/admin/rutas/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { completeRoute, deliverOrder, toggleOrderInRoute } from "@/actions/routes-actions";
import Link from "next/link";
import { ArrowLeft, Truck, CheckCircle, Package, AlertCircle } from "lucide-react";

export default async function DetalleRutaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = await prisma.deliveryRoute.findUnique({
    where: { id },
    include: { driver: true, orders: { include: { customer: true } } } // FIX
  });

  if (!route) return <div className="text-white p-8">Ruta no encontrada</div>;

  const availableOrders = await prisma.order.findMany({
    where: { status: { in: ['NO_PAGO', 'FIADO', 'CONFIRMED'] }, deliveryRouteId: null, shippingAddress: { not: null } },
    include: { customer: true } // FIX
  });

  return (
    <div className="space-y-6 pb-20 text-slate-200">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/rutas" className="p-2 hover:bg-slate-800 rounded-full"><ArrowLeft/></Link>
            <h1 className="text-2xl font-bold font-heading text-cyan-400">{route.routeNumber}</h1>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold border border-slate-600">{route.status}</span>
        </div>
        {route.status !== 'COMPLETED' && (
            <form action={async () => { 'use server'; await completeRoute(id); }}>
                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"><CheckCircle size={20} /> Finalizar Ruta</button>
            </form>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Truck className="text-cyan-400"/> Carga Actual</h2>
            {route.orders.map(order => (
                <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm relative">
                    <div className="flex justify-between mb-2"><span className="font-bold text-cyan-400">#{order.orderNumber}</span><span className="font-bold text-white">\$\${order.total}</span></div>
                    <p className="text-sm font-bold text-slate-300">{order.customer.firstName} {order.customer.lastName}</p>
                    <p className="text-xs text-slate-500 mb-3">{order.shippingAddress}</p>
                    <div className="flex gap-2">
                        {route.status !== 'COMPLETED' && (
                            <>
                            <form action={async () => { 'use server'; await deliverOrder(order.id); }} className="flex-1"><button className="w-full bg-slate-800 text-cyan-400 py-2 rounded font-bold text-xs border border-slate-700">Entregado</button></form>
                            <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, null); }}><button className="bg-red-900/30 text-red-400 p-2 rounded border border-red-900"><AlertCircle size={16}/></button></form>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
        {route.status !== 'COMPLETED' && (
             <div className="space-y-4 opacity-75">
                <h2 className="font-bold text-slate-500 flex items-center gap-2"><Package/> Pendientes</h2>
                {availableOrders.map(order => (
                    <div key={order.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center border-dashed">
                        <div><span className="font-bold text-slate-400">#{order.orderNumber}</span><p className="text-xs text-slate-600">{order.customer.firstName}</p></div>
                        <form action={async () => { 'use server'; await toggleOrderInRoute(order.id, id); }}><button className="bg-slate-800 text-cyan-400 px-3 py-1 rounded font-bold text-xs border border-slate-700">+ Cargar</button></form>
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
  console.log('🚀 ESTRATEGIA HÍBRIDA FINAL: Restaurando funcionalidad sin romper nada...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();
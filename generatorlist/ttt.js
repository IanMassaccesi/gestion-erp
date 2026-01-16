const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SCHEMA: PREFERENCIAS + CATEGORÍAS + LOGS
  // ==========================================
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

enum OrderStatus {
  DRAFT
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERING
  DELIVERED
  CANCELLED
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

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  prefix    String   
  createdAt DateTime @default(now())
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
  preferences    NotificationPreference?
}

model NotificationPreference {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  notifyOrders Boolean @default(true)
  notifyStock  Boolean @default(true)
  notifySystem Boolean @default(false)
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

  // ==========================================
  // 2. ACTIONS: NOTIFICACIONES
  // ==========================================
  'src/actions/notifications-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPreferences() {
  const session = await getSession();
  if (!session?.user) return null;

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id }
  });

  if (!prefs) {
    return await prisma.notificationPreference.create({
      data: { userId: session.user.id }
    });
  }
  return prefs;
}

export async function updatePreferences(data: { notifyOrders: boolean, notifyStock: boolean, notifySystem: boolean }) {
  const session = await getSession();
  if (!session?.user) return;

  await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data }
  });
  revalidatePath("/admin/configuracion");
}

export async function getUnreadNotifications() {
  const session = await getSession();
  if (!session?.user) return [];

  return await prisma.notification.findMany({
    where: { userId: session.user.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
}

export async function markAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
  revalidatePath("/");
}

export async function sendNotificationToAdmins(title: string, description: string, type: 'ORDER' | 'STOCK' | 'SYSTEM') {
  const admins = await prisma.user.findMany({
    where: { 
      role: 'ADMIN',
      isActive: true,
      preferences: {
        ...(type === 'ORDER' ? { notifyOrders: true } : {}),
        ...(type === 'STOCK' ? { notifyStock: true } : {}),
        ...(type === 'SYSTEM' ? { notifySystem: true } : {}),
      }
    }
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(u => ({
        userId: u.id,
        title,
        description,
        type
      }))
    });
  }
}`,

  // ==========================================
  // 3. LOGGER ACTIONS (Centralizado)
  // ==========================================
  'src/actions/logger-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function registrarLog(action: string, details: string, type: 'PEDIDO' | 'RUTA' | 'SISTEMA' | 'PRODUCTO' | 'CLIENTE') {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (userId) {
        await prisma.logEntry.create({
            data: { action, details, type, userId }
        });
    }
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
}

export async function getLogs(filters?: { userId?: string; type?: string; search?: string }) {
  const where: any = {};

  if (filters?.userId && filters.userId !== 'TODOS') where.userId = filters.userId;
  if (filters?.type && filters.type !== 'TODOS') where.type = filters.type;
  if (filters?.search) where.details = { contains: filters.search, mode: 'insensitive' };

  return await prisma.logEntry.findMany({
    where,
    include: { user: true },
    orderBy: { timestamp: 'desc' },
    take: 100
  });
}`,

  // ==========================================
  // 4. ACTUALIZACIÓN ACTIONS CON LOGS
  // ==========================================
  'src/actions/auth-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await compare(password, user.password))) return { error: "Credenciales inválidas" };
  if (!user.isActive) return { error: "Usuario desactivado." };

  const sessionData = {
    user: { id: user.id, email: user.email, name: user.firstName, role: user.role },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const token = await encrypt(sessionData);
  (await cookies()).set("session", token, { expires: sessionData.expires, httpOnly: true, sameSite: "lax" });

  if (user.role === 'ADMIN') redirect("/admin/dashboard");
  else if (user.role === 'CORREDOR') redirect("/corredor/dashboard");
  else redirect("/login");
}

export async function logout() {
  await registrarLog("LOGOUT", "Cierre de sesión", "SISTEMA");
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}`,

  'src/actions/clients-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions";

export async function createClient(formData: FormData) {
  const session = await getSession();
  const userId = session?.user?.id;

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string;

  if (!firstName || !lastName || !dniCuit || !address) return { error: "Faltan datos obligatorios" };

  try {
    await prisma.customer.create({
      data: { 
        firstName, lastName, dniCuit, email: email || null, phone, address, type, 
        businessName: type === 'MAYORISTA' ? formData.get("businessName") as string : null, 
        isDeleted: false, createdById: userId 
      }
    });
    
    // LOG CORRECTAMENTE ESCAPADO
    await registrarLog("CREAR_CLIENTE", \`Alta de cliente: \${firstName} \${lastName} (\${dniCuit})\`, "CLIENTE");

  } catch (error: any) {
    return { error: "Error: DNI o Email duplicado." };
  }

  revalidatePath("/admin/clientes");
  if (origin === "mobile") redirect("/corredor/pedidos");
  else redirect("/admin/clientes");
}

export async function updateClient(id: string, formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    
    await prisma.customer.update({ where: { id }, data: { firstName, lastName, address, phone } });
    await registrarLog("EDITAR_CLIENTE", \`Modificó datos del cliente ID: \${id}\`, "CLIENTE");
  
    revalidatePath("/admin/clientes");
    redirect("/admin/clientes");
}
  
export async function deleteClient(id: string) {
    await prisma.customer.update({ where: { id }, data: { isDeleted: true } });
    await registrarLog("ELIMINAR_CLIENTE", \`Eliminó (soft-delete) cliente ID: \${id}\`, "CLIENTE");
    revalidatePath("/admin/clientes");
}`,

  'src/actions/products-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = formData.get("category") as string;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  const currentStock = parseInt(formData.get("currentStock") as string) || 0;
  // ... resto de campos

  await prisma.product.create({
    data: { name, code, category, priceFinal, currentStock, priceMayor: 0, priceMinor: 0, unit: "UNIDAD" }
  });

  await registrarLog("CREAR_PRODUCTO", \`Nuevo producto: \${name} (\${code})\`, "PRODUCTO");

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  const currentStock = parseInt(formData.get("currentStock") as string) || 0;
  
  await prisma.product.update({ where: { id }, data: { name, priceFinal, currentStock } });
  await registrarLog("EDITAR_PRODUCTO", \`Actualizó producto: \${name}\`, "PRODUCTO");

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { isDeleted: true } });
  await registrarLog("ELIMINAR_PRODUCTO", \`Eliminó producto ID: \${id}\`, "PRODUCTO");
  revalidatePath("/admin/productos");
}`,

  // ==========================================
  // 5. COMPONENTES: BELL & LAYOUT & CONFIG
  // ==========================================
  'src/components/ui/NotificationBell.tsx': `'use client'
import { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { getUnreadNotifications, markAsRead } from "@/actions/notifications-actions";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  async function fetchNotes() {
    const data = await getUnreadNotifications();
    setNotifications(data);
  }

  async function handleRead(id: string) {
    await markAsRead(id);
    fetchNotes();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-800 font-bold text-white text-sm">
                Notificaciones
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">Sin novedades</div>
                ) : (
                    notifications.map(note => (
                        <div key={note.id} className="p-3 border-b border-slate-800/50 hover:bg-slate-800 transition-colors flex justify-between items-start gap-2">
                            <div>
                                <p className="text-white text-sm font-bold">{note.title}</p>
                                <p className="text-slate-400 text-xs">{note.description}</p>
                                <span className="text-[10px] text-slate-600 mt-1 block">{new Date(note.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <button onClick={() => handleRead(note.id)} className="text-cyan-600 hover:text-cyan-400" title="Marcar leída">
                                <Check size={16}/>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
}`,

  'src/components/layout/AdminLayoutClient.tsx': `'use client'
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  Truck, Briefcase, Menu, X, LogOut, Container,
  DollarSign, PieChart, Settings
} from "lucide-react";
import { logout } from "@/actions/auth-actions";
import { NotificationBell } from "@/components/ui/NotificationBell";

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Estadísticas', href: '/admin/estadisticas', icon: PieChart },
  { name: 'Caja Diaria', href: '/admin/caja', icon: DollarSign },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Envíos', href: '/admin/envios', icon: Container },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Equipo', href: '/admin/equipo', icon: Briefcase },
  { name: 'Auditoría', href: '/admin/auditoria', icon: Users },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-dark flex font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={\`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border text-brand-text shadow-2xl transform transition-transform duration-300 ease-in-out
        \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-auto flex flex-col h-full
      \`}>
          <div className="p-6 border-b border-brand-border flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">GESTIÓN</h1>
              <p className="text-xs text-brand-muted">Panel Administrativo</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-brand-muted hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-neon' : 'text-brand-muted hover:bg-brand-dark hover:text-white'}\`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-primary' : 'text-brand-muted group-hover:text-white'} />
                  <span className="font-medium font-heading">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-border space-y-2">
            <Link 
                href="/admin/configuracion" 
                className={\`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-colors \${pathname === '/admin/configuracion' ? 'bg-brand-dark text-white' : 'text-brand-muted hover:text-white hover:bg-brand-dark'}\`}
            >
                <Settings size={20}/> <span className="font-medium">Configuración</span>
            </Link>

            <button onClick={async () => await logout()} className="flex items-center gap-3 px-4 py-3 w-full text-left text-brand-muted hover:text-red-400 hover:bg-brand-dark rounded-lg transition-colors">
              <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="bg-brand-card border-b border-brand-border text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
              <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu size={28} className="text-brand-primary" /></button>
              <h1 className="font-bold font-heading text-lg md:hidden">Panel</h1>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
             <NotificationBell />
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-white/20"></div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}`,

  'src/app/admin/configuracion/page.tsx': `'use client'

import { useState, useEffect } from "react";
import { getPreferences, updatePreferences } from "@/actions/notifications-actions";
import { Settings, Bell, Archive, Server, Save } from "lucide-react";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    notifyOrders: true,
    notifyStock: true,
    notifySystem: false
  });

  useEffect(() => {
    async function load() {
        const data = await getPreferences();
        if (data) setPrefs({
            notifyOrders: data.notifyOrders,
            notifyStock: data.notifyStock,
            notifySystem: data.notifySystem
        });
        setLoading(false);
    }
    load();
  }, []);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    await updatePreferences(prefs);
    setLoading(false);
    alert("Preferencias guardadas");
  };

  if (loading && !prefs) return <div className="p-10 text-white">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-200">
      
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-900/50">
            <Settings className="text-cyan-400" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold font-heading text-white">Configuración</h1>
            <p className="text-slate-400">Personaliza tu experiencia</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Bell size={20} className="text-cyan-500"/> Notificaciones
            </h2>
            <p className="text-xs text-slate-500 mt-1">Elige qué alertas quieres recibir en la campana.</p>
        </div>

        <div className="divide-y divide-slate-800">
            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400"><Archive size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Nuevos Pedidos</p>
                        <p className="text-sm text-slate-500">Recibir alerta cuando se crea un pedido.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifyOrders')}
                    className={\`w-14 h-8 rounded-full p-1 transition-colors \${prefs.notifyOrders ? 'bg-cyan-600' : 'bg-slate-700'}\`}
                >
                    <div className={\`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform \${prefs.notifyOrders ? 'translate-x-6' : 'translate-x-0'}\`} />
                </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-yellow-900/20 rounded-lg text-yellow-400"><Archive size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Stock Bajo</p>
                        <p className="text-sm text-slate-500">Alertar cuando un producto llega al mínimo.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifyStock')}
                    className={\`w-14 h-8 rounded-full p-1 transition-colors \${prefs.notifyStock ? 'bg-cyan-600' : 'bg-slate-700'}\`}
                >
                    <div className={\`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform \${prefs.notifyStock ? 'translate-x-6' : 'translate-x-0'}\`} />
                </button>
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex gap-4">
                    <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400"><Server size={24}/></div>
                    <div>
                        <p className="font-bold text-white">Sistema</p>
                        <p className="text-sm text-slate-500">Errores, backups y mensajes de mantenimiento.</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('notifySystem')}
                    className={\`w-14 h-8 rounded-full p-1 transition-colors \${prefs.notifySystem ? 'bg-cyan-600' : 'bg-slate-700'}\`}
                >
                    <div className={\`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform \${prefs.notifySystem ? 'translate-x-6' : 'translate-x-0'}\`} />
                </button>
            </div>
        </div>

        <div className="p-6 bg-slate-950/50 flex justify-end">
            <button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                <Save size={18}/> Guardar Cambios
            </button>
        </div>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 FEATURES V2 FIXED: Notificaciones, Configuración y Logs (Sintaxis Corregida)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();
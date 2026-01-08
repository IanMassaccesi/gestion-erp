const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. SERVER ACTION: CREAR USUARIO CON PERMISOS ---
  'src/actions/users-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";

export async function createStaff(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Checkboxes (si vienen es "on", si no vienen es null)
  const isRunner = formData.get("isRunner") === "on";
  const isDriver = formData.get("isDriver") === "on";

  if (!firstName || !lastName || !email || !password) {
    return { error: "Faltan datos obligatorios" };
  }

  if (!isRunner && !isDriver) {
    return { error: "Debes asignar al menos un rol (Vendedor o Chofer)" };
  }

  try {
    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "CORREDOR", // Rol genérico de empleado
        isRunner,         // Permiso específico venta
        isDriver,         // Permiso específico reparto
        isActive: true
      }
    });
  } catch (error) {
    console.error(error);
    return { error: "Error al crear. El email ya existe." };
  }

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo");
}`,

  // --- 2. ADMIN: LISTA DE EQUIPO (Reemplaza a Choferes) ---
  'src/app/admin/equipo/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, User, ShoppingBag, Truck } from "lucide-react";

export default async function EquipoPage() {
  const staff = await prisma.user.findMany({
    where: { role: 'CORREDOR' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Equipo</h1>
          <p className="text-gray-500">Vendedores y Choferes</p>
        </div>
        <Link href="/admin/equipo/nuevo" className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus size={20} /> Nuevo Empleado
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="p-3 bg-gray-100 rounded-full text-gray-600"><User size={24} /></div>
            <div className="flex-1">
              <h3 className="font-bold text-brand-dark">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-gray-500 mb-3">{user.email}</p>
              <div className="flex gap-2">
                {user.isRunner && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><ShoppingBag size={12} /> Vendedor</span>}
                {user.isDriver && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><Truck size={12} /> Chofer</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // --- 3. ADMIN: FORMULARIO NUEVO EMPLEADO ---
  'src/app/admin/equipo/nuevo/page.tsx': `import { createStaff } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoEmpleadoPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/equipo" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-brand-primary">Nuevo Empleado</h1>
      </div>

      <form action={createStaff} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-bold mb-1 block">Nombre</label><input name="firstName" required className="w-full p-2 border rounded" /></div>
          <div><label className="text-sm font-bold mb-1 block">Apellido</label><input name="lastName" required className="w-full p-2 border rounded" /></div>
        </div>
        <div><label className="text-sm font-bold mb-1 block">Email</label><input type="email" name="email" required className="w-full p-2 border rounded" /></div>
        <div><label className="text-sm font-bold mb-1 block">Contraseña</label><input type="password" name="password" required className="w-full p-2 border rounded" /></div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-bold text-brand-primary mb-3">Funciones Asignadas</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isRunner" className="w-5 h-5 text-brand-primary" />
              <div><span className="block font-bold text-gray-700">Vendedor (Corredor)</span><span className="text-xs text-gray-500">Puede tomar pedidos desde la App.</span></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isDriver" className="w-5 h-5 text-brand-primary" />
              <div><span className="block font-bold text-gray-700">Chofer</span><span className="text-xs text-gray-500">Puede ver rutas de entrega y mapas.</span></div>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center gap-2"><Save size={20} /> Guardar Empleado</button>
      </form>
    </div>
  );
}`,

  // --- 4. MOBILE: DASHBOARD INTELIGENTE ---
  'src/app/corredor/dashboard/page.tsx': `import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ShoppingCart, Truck, MapPin, AlertCircle } from "lucide-react";

export default async function CorredorDashboard() {
  const session = await getSession();
  // Buscamos al usuario fresco de la BD para tener los permisos actualizados
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) return <div>Error de usuario</div>;

  return (
    <div className="space-y-6">
      <div className="bg-brand-dark rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold font-heading">Hola, {user.firstName}</h2>
          <p className="text-brand-light opacity-80 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BOTÓN DE VENTA (Solo si es Runner) */}
        {user.isRunner ? (
          <Link href="/corredor/pedidos" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-32">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><ShoppingCart size={28} /></div>
            <span className="font-bold text-gray-700 text-sm">Nueva Venta</span>
          </Link>
        ) : (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3 opacity-50 h-32">
             <ShoppingCart size={28} className="text-gray-300" />
             <span className="text-xs text-gray-400 text-center">Sin permiso de venta</span>
          </div>
        )}

        {/* BOTÓN DE RUTAS (Solo si es Driver) */}
        {user.isDriver ? (
          <Link href="/corredor/rutas" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform h-32">
            <div className="p-3 bg-green-50 text-green-600 rounded-full"><Truck size={28} /></div>
            <span className="font-bold text-gray-700 text-sm">Mis Rutas</span>
          </Link>
        ) : (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3 opacity-50 h-32">
             <Truck size={28} className="text-gray-300" />
             <span className="text-xs text-gray-400 text-center">Sin permiso de chofer</span>
          </div>
        )}
      </div>

      {/* Info Contextual */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="text-brand-accent" /> Estado
        </h3>
        <p className="text-sm text-gray-500">
          Tienes los permisos de: 
          {user.isRunner && <span className="font-bold text-blue-600 mx-1">Vendedor</span>}
          {user.isDriver && <span className="font-bold text-green-600 mx-1">Chofer</span>}
        </p>
      </div>
    </div>
  );
}`,

  // --- 5. MOBILE: FORMULARIO DE VENTA (MOBILE FIRST) ---
  'src/app/corredor/pedidos/page.tsx': `import { prisma } from "@/lib/prisma";
import { OrderFormMobile } from "@/components/orders/OrderFormMobile"; // Componente nuevo

export default async function MobilePedidosPage() {
  const [clients, products] = await Promise.all([
    prisma.customer.findMany({ where: { isDeleted: false }, select: { id: true, firstName: true, lastName: true, address: true } }),
    prisma.product.findMany({ where: { isDeleted: false }, select: { id: true, name: true, priceFinal: true, priceMayor: true, currentStock: true } })
  ]);

  return (
    <div className="pb-20">
      <h1 className="text-xl font-bold text-brand-primary mb-4 px-2">Tomar Pedido</h1>
      <OrderFormMobile clients={clients} products={products} />
    </div>
  );
}`,

  // --- 6. MOBILE: COMPONENTE REACTIVO DE VENTA (UI GRANDE) ---
  'src/components/orders/OrderFormMobile.tsx': `'use client'
import { useState } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Minus, Trash2, Save, Search } from "lucide-react";

export function OrderFormMobile({ clients, products }: { clients: any[], products: any[] }) {
  const [step, setStep] = useState(1); // 1: Cliente, 2: Productos, 3: Confirmar
  const [clientId, setClientId] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar productos
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (product: any) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.priceFinal, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.id === id) return { ...i, qty: Math.max(0, i.qty + delta) };
      return i;
    }).filter(i => i.qty > 0));
  };

  const handleFinish = async () => {
    if (!clientId || cart.length === 0) return;
    setIsSaving(true);
    const client = clients.find(c => c.id === clientId);
    // Usamos la action que ya existe (usando precio FINAL por defecto para mobile)
    await createOrder(clientId, "FINAL", cart.map(i => ({ productId: i.id, quantity: i.qty, adjustmentType: "NONE" })), client?.address || "");
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

  // --- VISTA 1: ELEGIR CLIENTE ---
  if (step === 1) {
    return (
      <div className="space-y-4">
        <input 
          placeholder="Buscar cliente..." 
          className="w-full p-4 rounded-xl border border-gray-200 text-lg shadow-sm"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-2">
          {clients.filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(c => (
            <button 
              key={c.id} 
              onClick={() => { setClientId(c.id); setStep(2); setSearch(""); }}
              className="w-full p-4 bg-white rounded-xl border border-gray-100 text-left hover:border-brand-primary shadow-sm flex justify-between items-center"
            >
              <div>
                <span className="font-bold text-brand-dark block">{c.firstName} {c.lastName}</span>
                <span className="text-xs text-gray-500">{c.address}</span>
              </div>
              <div className="w-6 h-6 rounded-full border border-gray-300"></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- VISTA 2: ELEGIR PRODUCTOS ---
  if (step === 2) {
    return (
      <div className="space-y-4 h-screen flex flex-col">
        <div className="flex gap-2 mb-2">
           <button onClick={() => setStep(1)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-bold">← Cliente</button>
           <div className="flex-1 bg-brand-light/10 rounded-lg flex items-center px-3 font-bold text-brand-primary text-sm">
             Total: \$\${total} ({cart.length} items)
           </div>
           {cart.length > 0 && <button onClick={() => setStep(3)} className="px-3 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold">Ver →</button>}
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              placeholder="Buscar producto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 p-3 rounded-xl border border-gray-200 shadow-sm"
            />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-32">
          {filteredProducts.slice(0, 20).map(p => {
             const inCart = cart.find(i => i.id === p.id);
             return (
               <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                 <div>
                   <p className="font-bold text-brand-dark text-sm">{p.name}</p>
                   <p className="text-brand-primary font-bold">\$\${p.priceFinal}</p>
                   <p className="text-xs text-gray-400">Stock: {p.currentStock}</p>
                 </div>
                 {inCart ? (
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <button onClick={() => updateQty(p.id, -1)} className="p-2 bg-white rounded shadow-sm text-brand-primary"><Minus size={16} /></button>
                      <span className="font-bold w-6 text-center">{inCart.qty}</span>
                      <button onClick={() => updateQty(p.id, 1)} className="p-2 bg-white rounded shadow-sm text-brand-primary"><Plus size={16} /></button>
                    </div>
                 ) : (
                    <button onClick={() => addToCart(p)} className="bg-brand-primary text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform">
                      <Plus size={20} />
                    </button>
                 )}
               </div>
             )
          })}
        </div>
      </div>
    );
  }

  // --- VISTA 3: CONFIRMAR ---
  return (
    <div className="space-y-4">
       <button onClick={() => setStep(2)} className="mb-4 text-sm text-gray-500 font-bold">← Volver a productos</button>
       <h2 className="text-xl font-bold font-heading">Resumen</h2>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {cart.map(item => (
            <div key={item.id} className="p-4 flex justify-between items-center">
               <div>
                 <p className="font-medium">{item.name}</p>
                 <p className="text-xs text-gray-500">{item.qty} x \$\${item.price}</p>
               </div>
               <span className="font-bold">\$\${item.qty * item.price}</span>
            </div>
          ))}
          <div className="p-4 bg-gray-50 flex justify-between items-center text-lg font-bold text-brand-dark">
             <span>Total a Pagar</span>
             <span>\$\${total}</span>
          </div>
       </div>

       <button 
         onClick={handleFinish} 
         disabled={isSaving}
         className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl flex justify-center items-center gap-2"
       >
         {isSaving ? "Enviando..." : <><Save /> Finalizar Pedido</>}
       </button>
    </div>
  );
}`,
  
  // --- 7. ACTUALIZACIÓN MENU SIDEBAR (Para que apunte a Equipo) ---
  'src/components/layout/Sidebar.tsx': `'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, LogOut, Briefcase } from 'lucide-react';
import { logout } from '@/actions/auth-actions';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Equipo', href: '/admin/equipo', icon: Briefcase }, // <-- CAMBIO AQUÍ
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-brand-dark text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-brand-primary">
        <h1 className="text-2xl font-bold font-heading text-brand-teal">GESTIÓN</h1>
        <p className="text-xs text-gray-400 mt-1">Panel Administrativo</p>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={\`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group \${isActive ? 'bg-brand-primary text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}\`}>
              <Icon size={20} className={isActive ? 'text-brand-light' : 'text-gray-400 group-hover:text-white'} />
              <span className="font-medium font-heading">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-brand-primary">
        <button onClick={() => logout()} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-white/5 rounded-lg transition-colors">
          <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando Arquitectura MOBILE FIRST y Roles Híbridos...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
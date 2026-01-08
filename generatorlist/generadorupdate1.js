const fs = require('fs');
const path = require('path');

const files = {
  // --- 1. LÓGICA DE USUARIOS (Server Action) ---
  'src/actions/users-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";

export async function createDriver(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!firstName || !lastName || !email || !password) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    // Encriptamos la contraseña antes de guardar
    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "CORREDOR", // Forzamos el rol de chofer
        isActive: true
      }
    });
  } catch (error) {
    console.error(error);
    return { error: "Error al crear usuario. El email podría estar duplicado." };
  }

  revalidatePath("/admin/choferes");
  redirect("/admin/choferes");
}`,

  // --- 2. LISTA DE CHOFERES ---
  'src/app/admin/choferes/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, User, Truck } from "lucide-react";

export default async function ChoferesPage() {
  // Buscamos solo los usuarios con rol CORREDOR
  const drivers = await prisma.user.findMany({
    where: { role: 'CORREDOR' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { routes: true } } } // Contamos cuántas rutas han hecho
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Choferes</h1>
          <p className="text-gray-500">Gestión de personal logístico</p>
        </div>
        <Link 
          href="/admin/choferes/nuevo" 
          className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Nuevo Chofer
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.length === 0 ? (
           <div className="col-span-3 p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed">
             No hay choferes registrados.
           </div>
        ) : (
          drivers.map((driver) => (
            <div key={driver.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-brand-bg rounded-full text-brand-primary">
                <User size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-brand-dark">{driver.firstName} {driver.lastName}</h3>
                <p className="text-sm text-gray-500 mb-2">{driver.email}</p>
                <div className="flex items-center gap-2 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                  <Truck size={12} />
                  {driver._count.routes} Rutas asignadas
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`,

  // --- 3. FORMULARIO NUEVO CHOFER ---
  'src/app/admin/choferes/nuevo/page.tsx': `import { createDriver } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoChoferPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/choferes" className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-brand-primary">Nuevo Chofer</h1>
      </div>

      <form action={createDriver} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-brand-dark block mb-2">Nombre</label>
            <input name="firstName" required className="w-full p-2 border rounded-lg" placeholder="Ej: Roberto" />
          </div>
          <div>
            <label className="text-sm font-bold text-brand-dark block mb-2">Apellido</label>
            <input name="lastName" required className="w-full p-2 border rounded-lg" placeholder="Ej: Gomez" />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-brand-dark block mb-2">Email (Usuario)</label>
          <input type="email" name="email" required className="w-full p-2 border rounded-lg" placeholder="chofer@empresa.com" />
        </div>

        <div>
          <label className="text-sm font-bold text-brand-dark block mb-2">Contraseña</label>
          <input type="password" name="password" required className="w-full p-2 border rounded-lg" placeholder="******" />
          <p className="text-xs text-gray-400 mt-1">El chofer usará este email y contraseña para entrar a su panel.</p>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          <Save size={20} /> Registrar Chofer
        </button>
      </form>
    </div>
  );
}`,

  // --- 4. ACTUALIZACIÓN SIDEBAR (Para agregar el botón) ---
  'src/components/layout/Sidebar.tsx': `'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, LogOut, Contact } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Rutas', href: '/admin/rutas', icon: Truck },
  { name: 'Choferes', href: '/admin/choferes', icon: Contact }, // <--- NUEVO ITEM
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
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-white/5 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}`
};

function createFiles() {
  console.log('🚀 Generando módulo de CHOFERES...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();
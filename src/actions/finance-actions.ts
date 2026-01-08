'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// --- CAJA ---

export async function openCashShift(amount: number) {
  const session = await getSession();
  if (!session?.user) return { error: "No autorizado" };

  // Verificar si ya hay una abierta
  const existing = await prisma.cashShift.findFirst({ where: { status: "OPEN" } });
  if (existing) return { error: "Ya hay una caja abierta." };

  await prisma.cashShift.create({
    data: {
      startAmount: amount,
      status: "OPEN",
      openedById: session.user.id
    }
  });
  revalidatePath("/admin/caja");
}

export async function closeCashShift(realAmount: number) {
  const currentShift = await prisma.cashShift.findFirst({ 
    where: { status: "OPEN" },
    include: { transactions: true }
  });

  if (!currentShift) return { error: "No hay caja abierta" };

  // Calcular saldo sistema: Inicial + Ingresos - Egresos
  const income = currentShift.transactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
  const expense = currentShift.transactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
  const systemAmount = currentShift.startAmount + income - expense;
  
  const difference = realAmount - systemAmount;

  await prisma.cashShift.update({
    where: { id: currentShift.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      endAmount: realAmount,
      systemAmount,
      difference
    }
  });
  revalidatePath("/admin/caja");
}

export async function addTransaction(amount: number, type: 'IN' | 'OUT', category: string, description: string) {
  const currentShift = await prisma.cashShift.findFirst({ where: { status: "OPEN" } });
  if (!currentShift) return { error: "Caja cerrada. Abra caja primero." };

  await prisma.cashTransaction.create({
    data: {
      amount, type, category, description,
      shiftId: currentShift.id
    }
  });
  revalidatePath("/admin/caja");
}
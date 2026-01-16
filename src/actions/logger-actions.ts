'use server'

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
}
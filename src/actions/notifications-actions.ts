'use server'

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
}
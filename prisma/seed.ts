import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tuempresa.com' },
    update: {},
    create: {
      email: 'admin@tuempresa.com',
      firstName: 'Super',
      lastName: 'Admin',
      password,
      role: Role.ADMIN,
      isActive: true,
    },
  })
  console.log({ admin })
}
main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
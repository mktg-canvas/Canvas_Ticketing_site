import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma'

async function main() {
  const email = process.argv[2] || 'admin@canvas.com'
  const password = process.argv[3] || 'Admin@123'
  const name = process.argv[4] || 'Super Admin'

  const hash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password_hash: hash, role: 'super_admin', is_active: true, name },
    })
    console.log('Updated existing user:', email)
  } else {
    await prisma.user.create({
      data: { name, email, password_hash: hash, role: 'super_admin' },
    })
    console.log('Created super_admin:', email)
  }

  console.log('Password:', password)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })

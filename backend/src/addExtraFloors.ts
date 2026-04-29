import 'dotenv/config'
import { prisma } from './lib/prisma'

const EXTRA_FLOORS = ['Basement', 'Terrace', 'Common Area']

async function main() {
  const buildings = await prisma.building.findMany({ where: { is_active: true } })
  console.log(`Adding Basement, Terrace, Common Area to ${buildings.length} active buildings...\n`)

  for (const building of buildings) {
    for (const floorName of EXTRA_FLOORS) {
      const existing = await prisma.floor.findFirst({
        where: { building_id: building.id, name: floorName },
      })
      if (existing) {
        if (!existing.is_active) {
          await prisma.floor.update({ where: { id: existing.id }, data: { is_active: true } })
          console.log(`  Reactivated: ${building.name} · ${floorName}`)
        } else {
          console.log(`  Already exists: ${building.name} · ${floorName}`)
        }
      } else {
        await prisma.floor.create({ data: { building_id: building.id, name: floorName } })
        console.log(`  Created: ${building.name} · ${floorName}`)
      }
    }
  }

  // Add "Others" company (no locations — triggers free building+floor selection in UI)
  const existing = await prisma.company.findFirst({ where: { name: 'Others' } })
  if (existing) {
    if (!existing.is_active) {
      await prisma.company.update({ where: { id: existing.id }, data: { is_active: true } })
      console.log('\nReactivated company: Others')
    } else {
      console.log('\nCompany "Others" already exists and is active')
    }
  } else {
    await prisma.company.create({ data: { name: 'Others' } })
    console.log('\nCreated company: Others')
  }

  console.log('\nDone!')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

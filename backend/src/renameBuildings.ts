import 'dotenv/config'
import { prisma } from './lib/prisma'

// In-place renames — preserves all existing ticket/floor FK references
const RENAMES: Record<string, string> = {
  '246':  'Canvas 246',
  '1317': 'Canvas 1317',
  '822':  'Canvas 822',
  '1331': 'Canvas 1331',
  '435':  'Canvas 435',
  '434':  'Canvas 434',
  '370':  'Canvas 370',
  '10':   'Canvas 10',
}

const STANDARD_FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor']

async function main() {
  // 1. Rename existing buildings in-place
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const building = await prisma.building.findFirst({ where: { name: oldName } })
    if (!building) {
      console.log(`  Not found (skipping): ${oldName}`)
      continue
    }
    await prisma.building.update({ where: { id: building.id }, data: { name: newName } })
    console.log(`  Renamed: "${oldName}" → "${newName}"`)
  }

  // 2. Add Canvas 502 if it doesn't already exist
  const existing502 = await prisma.building.findFirst({ where: { name: 'Canvas 502' } })
  if (existing502) {
    if (!existing502.is_active) {
      await prisma.building.update({ where: { id: existing502.id }, data: { is_active: true } })
      console.log('\n  Reactivated building: Canvas 502')
    } else {
      console.log('\n  Already exists: Canvas 502')
    }
    // Ensure standard floors exist
    for (const floorName of STANDARD_FLOORS) {
      const f = await prisma.floor.findFirst({ where: { building_id: existing502.id, name: floorName } })
      if (!f) {
        await prisma.floor.create({ data: { building_id: existing502.id, name: floorName } })
        console.log(`    Created floor: Canvas 502 · ${floorName}`)
      } else if (!f.is_active) {
        await prisma.floor.update({ where: { id: f.id }, data: { is_active: true } })
        console.log(`    Reactivated floor: Canvas 502 · ${floorName}`)
      }
    }
  } else {
    const b = await prisma.building.create({ data: { name: 'Canvas 502' } })
    console.log('\n  Created building: Canvas 502')
    for (const floorName of STANDARD_FLOORS) {
      await prisma.floor.create({ data: { building_id: b.id, name: floorName } })
      console.log(`    Created floor: Canvas 502 · ${floorName}`)
    }
  }

  console.log('\nDone!')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

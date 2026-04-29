import 'dotenv/config'
import { prisma } from './lib/prisma'

// Source of truth from the client company mapping
const MAPPING: Array<{ company: string; building: string; floor: string }> = [
  { company: 'FamPay',        building: 'Canvas 144', floor: '1st Floor' },
  { company: 'FamPay',        building: 'Canvas 144', floor: '2nd Floor' },
  { company: 'FamPay',        building: 'Canvas 144', floor: '3rd Floor' },
  { company: 'FamPay',        building: 'Canvas 144', floor: '4th Floor' },
  { company: 'Clueso',        building: 'Canvas 246',  floor: '3rd Floor' },
  { company: 'Dashtoon',      building: 'Canvas 1317', floor: '1st Floor' },
  { company: 'Dashtoon',      building: 'Canvas 1317', floor: '2nd Floor' },
  { company: 'Dashtoon',      building: 'Canvas 1317', floor: '3rd Floor' },
  { company: 'Dashtoon',      building: 'Canvas 1317', floor: '4th Floor' },
  { company: 'Dashtoon',      building: 'Canvas 822',  floor: '4th Floor' },
  { company: 'Xpay',          building: 'Canvas 1331', floor: '4th Floor' },
  { company: 'Quashbugs',     building: 'Canvas 1331', floor: '4th Floor' },
  { company: 'JumboHome',     building: 'Canvas 1331', floor: '3rd Floor' },
  { company: 'RevRag AI',     building: 'Canvas 1331', floor: '3rd Floor' },
  { company: 'BindBee',       building: 'Canvas 1331', floor: '3rd Floor' },
  { company: 'Comprinno',     building: 'Canvas 1331', floor: '2nd Floor' },
  { company: 'Riverline',     building: 'Canvas 1331', floor: '2nd Floor' },
  { company: 'Valeo',         building: 'Canvas 1331', floor: '1st Floor' },
  { company: 'StepOut',       building: 'Canvas 435',  floor: '1st Floor' },
  { company: 'Lytmus AI',     building: 'Canvas 435',  floor: '1st Floor' },
  { company: 'ADPCX',         building: 'Canvas 435',  floor: '2nd Floor' },
  { company: 'PotPie',        building: 'Canvas 435',  floor: '3rd Floor' },
  { company: 'Spill Games',   building: 'Canvas 435',  floor: '3rd Floor' },
  { company: 'Slidely AI',    building: 'Canvas 434',  floor: '3rd Floor' },
  { company: 'Flabs',         building: 'Canvas 434',  floor: '3rd Floor' },
  { company: 'AYNA AI',       building: 'Canvas 434',  floor: '3rd Floor' },
  { company: 'DubDub',        building: 'Canvas 370',  floor: '3rd Floor' },
  { company: 'Onya Diamonds', building: 'Canvas 370',  floor: '3rd Floor' },
  { company: 'Devsthan',      building: 'Canvas 370',  floor: '3rd Floor' },
  { company: 'TrueNest',      building: 'Canvas 370',  floor: '3rd Floor' },
  { company: 'TrueFoundary',  building: 'Canvas 10',   floor: '2nd Floor' },
]

async function main() {
  console.log('Clearing company_locations, companies, floors, buildings...')

  // Clear in dependency order (tickets reference buildings/floors/companies, so skip those)
  await prisma.companyLocation.deleteMany({})

  // Deactivate all existing companies, buildings, floors (don't hard-delete in case tickets exist)
  await prisma.company.updateMany({ data: { is_active: false } })
  await prisma.floor.updateMany({ data: { is_active: false } })
  await prisma.building.updateMany({ data: { is_active: false } })

  // Collect unique buildings and floors needed
  const buildingNames = [...new Set(MAPPING.map(r => r.building))]
  const floorsByBuilding = new Map<string, Set<string>>()
  for (const row of MAPPING) {
    if (!floorsByBuilding.has(row.building)) floorsByBuilding.set(row.building, new Set())
    floorsByBuilding.get(row.building)!.add(row.floor)
  }

  // Create or reactivate buildings
  const buildingMap = new Map<string, string>() // name → id
  for (const name of buildingNames) {
    const existing = await prisma.building.findFirst({ where: { name } })
    if (existing) {
      await prisma.building.update({ where: { id: existing.id }, data: { is_active: true } })
      buildingMap.set(name, existing.id)
      console.log(`  Reactivated building: ${name}`)
    } else {
      const b = await prisma.building.create({ data: { name } })
      buildingMap.set(name, b.id)
      console.log(`  Created building: ${name}`)
    }
  }

  // Create or reactivate floors
  const floorMap = new Map<string, string>() // "buildingName|floorName" → id
  for (const [buildingName, floors] of floorsByBuilding.entries()) {
    const buildingId = buildingMap.get(buildingName)!
    for (const floorName of floors) {
      const existing = await prisma.floor.findFirst({ where: { name: floorName, building_id: buildingId } })
      if (existing) {
        await prisma.floor.update({ where: { id: existing.id }, data: { is_active: true } })
        floorMap.set(`${buildingName}|${floorName}`, existing.id)
        console.log(`  Reactivated floor: ${buildingName} → ${floorName}`)
      } else {
        const f = await prisma.floor.create({ data: { name: floorName, building_id: buildingId } })
        floorMap.set(`${buildingName}|${floorName}`, f.id)
        console.log(`  Created floor: ${buildingName} → ${floorName}`)
      }
    }
  }

  // Create or reactivate companies
  const companyNames = [...new Set(MAPPING.map(r => r.company))]
  const companyMap = new Map<string, string>() // name → id
  for (const name of companyNames) {
    const existing = await prisma.company.findFirst({ where: { name } })
    if (existing) {
      await prisma.company.update({ where: { id: existing.id }, data: { is_active: true } })
      companyMap.set(name, existing.id)
      console.log(`  Reactivated company: ${name}`)
    } else {
      const c = await prisma.company.create({ data: { name } })
      companyMap.set(name, c.id)
      console.log(`  Created company: ${name}`)
    }
  }

  // Create company_locations
  console.log('\nCreating company locations...')
  for (const row of MAPPING) {
    const companyId = companyMap.get(row.company)!
    const buildingId = buildingMap.get(row.building)!
    const floorId = floorMap.get(`${row.building}|${row.floor}`)!

    await prisma.companyLocation.upsert({
      where: { company_id_building_id_floor_id: { company_id: companyId, building_id: buildingId, floor_id: floorId } },
      create: { company_id: companyId, building_id: buildingId, floor_id: floorId },
      update: {},
    })
    console.log(`  ${row.company} → ${row.building} · ${row.floor}`)
  }

  console.log('\nDone! Seeded', MAPPING.length, 'company locations.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

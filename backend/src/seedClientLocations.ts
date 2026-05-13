import 'dotenv/config'
import { prisma } from './lib/prisma'

// Source of truth from the client → building/floor mapping
const MAPPING: Array<{ client: string; building: string; floor: string }> = [
  { client: 'FamPay',        building: 'Canvas 144', floor: '1st Floor' },
  { client: 'FamPay',        building: 'Canvas 144', floor: '2nd Floor' },
  { client: 'FamPay',        building: 'Canvas 144', floor: '3rd Floor' },
  { client: 'FamPay',        building: 'Canvas 144', floor: '4th Floor' },
  { client: 'Clueso',        building: 'Canvas 246',  floor: '3rd Floor' },
  { client: 'Dashtoon',      building: 'Canvas 1317', floor: '1st Floor' },
  { client: 'Dashtoon',      building: 'Canvas 1317', floor: '2nd Floor' },
  { client: 'Dashtoon',      building: 'Canvas 1317', floor: '3rd Floor' },
  { client: 'Dashtoon',      building: 'Canvas 1317', floor: '4th Floor' },
  { client: 'Dashtoon',      building: 'Canvas 822',  floor: '4th Floor' },
  { client: 'Xpay',          building: 'Canvas 1331', floor: '4th Floor' },
  { client: 'Quashbugs',     building: 'Canvas 1331', floor: '4th Floor' },
  { client: 'JumboHome',     building: 'Canvas 1331', floor: '3rd Floor' },
  { client: 'RevRag AI',     building: 'Canvas 1331', floor: '3rd Floor' },
  { client: 'BindBee',       building: 'Canvas 1331', floor: '3rd Floor' },
  { client: 'Comprinno',     building: 'Canvas 1331', floor: '2nd Floor' },
  { client: 'Riverline',     building: 'Canvas 1331', floor: '2nd Floor' },
  { client: 'Valeo',         building: 'Canvas 1331', floor: '1st Floor' },
  { client: 'StepOut',       building: 'Canvas 435',  floor: '1st Floor' },
  { client: 'Lytmus AI',     building: 'Canvas 435',  floor: '1st Floor' },
  { client: 'ADPCX',         building: 'Canvas 435',  floor: '2nd Floor' },
  { client: 'PotPie',        building: 'Canvas 435',  floor: '3rd Floor' },
  { client: 'Spill Games',   building: 'Canvas 435',  floor: '3rd Floor' },
  { client: 'Slidely AI',    building: 'Canvas 434',  floor: '3rd Floor' },
  { client: 'Flabs',         building: 'Canvas 434',  floor: '3rd Floor' },
  { client: 'AYNA AI',       building: 'Canvas 434',  floor: '3rd Floor' },
  { client: 'DubDub',        building: 'Canvas 370',  floor: '3rd Floor' },
  { client: 'Onya Diamonds', building: 'Canvas 370',  floor: '3rd Floor' },
  { client: 'Devsthan',      building: 'Canvas 370',  floor: '3rd Floor' },
  { client: 'TrueNest',      building: 'Canvas 370',  floor: '3rd Floor' },
  { client: 'TrueFoundary',  building: 'Canvas 10',   floor: '2nd Floor' },
]

async function main() {
  console.log('Clearing client_locations, clients, floors, buildings...')

  // Clear in dependency order (tickets reference buildings/floors/clients, so skip those)
  await prisma.clientLocation.deleteMany({})

  // Deactivate all existing clients, buildings, floors (don't hard-delete in case tickets exist)
  await prisma.client.updateMany({ data: { is_active: false } })
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

  // Create or reactivate clients
  const clientNames = [...new Set(MAPPING.map(r => r.client))]
  const clientMap = new Map<string, string>() // name → id
  for (const name of clientNames) {
    const existing = await prisma.client.findFirst({ where: { name } })
    if (existing) {
      await prisma.client.update({ where: { id: existing.id }, data: { is_active: true } })
      clientMap.set(name, existing.id)
      console.log(`  Reactivated client: ${name}`)
    } else {
      const c = await prisma.client.create({ data: { name } })
      clientMap.set(name, c.id)
      console.log(`  Created client: ${name}`)
    }
  }

  // Create client_locations
  console.log('\nCreating client locations...')
  for (const row of MAPPING) {
    const clientId = clientMap.get(row.client)!
    const buildingId = buildingMap.get(row.building)!
    const floorId = floorMap.get(`${row.building}|${row.floor}`)!

    await prisma.clientLocation.upsert({
      where: { client_id_building_id_floor_id: { client_id: clientId, building_id: buildingId, floor_id: floorId } },
      create: { client_id: clientId, building_id: buildingId, floor_id: floorId },
      update: {},
    })
    console.log(`  ${row.client} → ${row.building} · ${row.floor}`)
  }

  console.log('\nDone! Seeded', MAPPING.length, 'client locations.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

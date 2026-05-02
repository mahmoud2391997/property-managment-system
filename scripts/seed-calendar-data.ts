// Seed calendar test data - sets up payments, expenses, tasks, leases, manual events with dates in current month

import { prisma } from '../lib/prisma'

async function main() {
  console.log('🌱 Seeding calendar test data...')

  // Get first organization
  const org = await prisma.organizations.findFirst()
  if (!org) {
    console.log('❌ No organization found')
    return
  }
  console.log(`✅ Found organization: ${org.id}`)

  // Get first staff member
  const staff = await prisma.staff.findFirst({
    where: { organization_id: org.id }
  })
  if (!staff) {
    console.log('❌ No staff found')
    return
  }
  console.log(`✅ Found staff: ${staff.id}`)

  // Get first property
  const property = await prisma.properties.findFirst({
    where: { organization_id: org.id }
  })
  if (!property) {
    console.log('❌ No property found')
    return
  }
  console.log(`✅ Found property: ${property.id}`)

  // Get first room for the property
  const room = await prisma.rooms.findFirst({
    where: { property_id: property.id }
  })
  if (!room) {
    console.log('❌ No room found for property')
    return
  }
  console.log(`✅ Found room: ${room.id}`)

  // Get or create a tenant for lease associations
  let tenant = await prisma.tenants.findFirst({
    where: { leases: { some: { organization_id: org.id } } }
  })
  
  if (!tenant) {
    // Create a test tenant with explicit UUID
    const tenantId = require('crypto').randomUUID()
    await prisma.$queryRaw`
      INSERT INTO auth.users (id, email, role, aud)
      VALUES (${tenantId}::uuid, ${`calendar-test-${Date.now()}@test.com`}, 'tenant', 'authenticated')
    `
    
    tenant = await prisma.tenants.create({
      data: {
        id: tenantId,
        type: 'Individual',
        created_by: staff.id
      }
    })
    
    await prisma.individual_tenants.create({
      data: {
        tenant_id: tenant.id,
        identity_type: 'mykad',
        identity_number: `TEST-${Date.now()}`,
        first_name: 'Calendar',
        last_name: 'TestTenant',
        phone_number: '+60123456789'
      }
    })
    
    console.log(`✅ Created test tenant: ${tenant.id}`)
  } else {
    console.log(`✅ Using existing tenant: ${tenant.id}`)
  }

  // Get today's date for reference
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Helper to create date in current month
  const getDate = (day: number) => {
    return new Date(currentYear, currentMonth, day, 12, 0, 0)
  }

  console.log(`\n📅 Seeding data for: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`)

  // 1. SEED LEASES (needed for payments, rent changes, lease starts/ends)
  console.log('\n1️⃣ Seeding leases...')
  const leaseStartDays = [1, 16]
  const leaseEndDays = [10, 25]
  const baseLeaseDays = [3, 7, 15, 20]

  const createdLeases: any[] = []

  // Create leases that start on specific days
  for (const day of leaseStartDays) {
    const startDate = getDate(day)
    const endedAt = new Date(currentYear, currentMonth + 12, 0)
    
    const lease = await prisma.leases.create({
      data: {
        reference_id: `LEASE-START-${day}`,
        organization_id: org.id,
        property_id: property.id,
        room_id: room.id,
        tenant_id: tenant.id,
        start_date: startDate,
        ended_at: endedAt,
        status: 'Current',
        payment_day: 1,
        monthly_rent: 1500,
        is_expiry_reminder: false
      }
    })

    createdLeases.push(lease)
    console.log(`   ✅ Lease ${lease.reference_id} starts on day ${day}`)
  }

  // Create leases that end on specific days (with expiry reminders)
  for (const day of leaseEndDays) {
    const endedAt = getDate(day)
    const startDate = new Date(currentYear, currentMonth - 12, 1)
    
    const lease = await prisma.leases.create({
      data: {
        reference_id: `LEASE-END-${day}`,
        organization_id: org.id,
        property_id: property.id,
        room_id: room.id,
        tenant_id: tenant.id,
        start_date: startDate,
        ended_at: endedAt,
        status: 'Current',
        payment_day: 1,
        monthly_rent: 1800,
        is_expiry_reminder: true,
        expiry_days_before_reminder: 30
      }
    })

    createdLeases.push(lease)
    console.log(`   ✅ Lease ${lease.reference_id} ends on day ${day} (with expiry reminder)`)
  }

  // Create base leases for payments
  for (const day of baseLeaseDays) {
    const startDate = new Date(currentYear, currentMonth - 1, 1)
    const endedAt = new Date(currentYear, currentMonth + 6, 0)
    
    const lease = await prisma.leases.create({
      data: {
        reference_id: `LEASE-BASE-${day}`,
        organization_id: org.id,
        property_id: property.id,
        room_id: room.id,
        tenant_id: tenant.id,
        start_date: startDate,
        ended_at: endedAt,
        status: 'Current',
        payment_day: day,
        monthly_rent: 2000,
        is_expiry_reminder: false
      }
    })

    createdLeases.push(lease)
  }

  // 2. SEED PAYMENTS with due dates throughout the month
  console.log('\n2️⃣ Seeding payments...')
  const paymentDays = [3, 7, 10, 15, 20, 25]
  for (let i = 0; i < paymentDays.length; i++) {
    const day = paymentDays[i]
    const dueDate = getDate(day)
    const lease = createdLeases[i % createdLeases.length]
    
    const payment = await prisma.payments.create({
      data: {
        reference_id: `PAY-CAL-${day}`,
        organization_id: org.id,
        lease_id: lease.id,
        type: 'Rental',
        status: 'Pending',
        due_payment_timestamp: dueDate,
        created_by: staff.id
      }
    })

    await prisma.charges.create({
      data: {
        payment_id: payment.id,
        title: `Rent Payment Day ${day}`,
        amount: 1500 + (day * 100),
        is_taxed: true,
        created_by: staff.id
      }
    })

    console.log(`   ✅ Payment ${payment.reference_id} due on day ${day}`)
  }

  // 3. SEED EXPENSES with due dates
  console.log('\n3️⃣ Seeding expenses...')
  const expenseDays = [5, 12, 18, 22]
  for (const day of expenseDays) {
    const dueDate = getDate(day)
    
    const expense = await prisma.expenses.create({
      data: {
        reference_id: `EXP-CAL-${day}`,
        organization_id: org.id,
        status: 'Pending',
        category: 'Property_Related',
        due_payment_date: dueDate,
        created_by: staff.id
      }
    })

    await prisma.charges.create({
      data: {
        expense_id: expense.id,
        title: `Expense Charge Day ${day}`,
        amount: 200 + (day * 50),
        is_taxed: false,
        created_by: staff.id
      }
    })

    await prisma.property_expenses.create({
      data: {
        id: expense.id,
        property_id: property.id,
        type: 'Maintenance',
        expense_month: new Date(currentYear, currentMonth, 1)
      }
    })

    console.log(`   ✅ Expense ${expense.reference_id} due on day ${day}`)
  }

  // 4. SEED TASKS with due dates
  console.log('\n4️⃣ Seeding tasks...')
  const taskDays = [2, 8, 14, 21, 28]
  for (const day of taskDays) {
    const dueDate = getDate(day)
    
    const task = await prisma.tasks.create({
      data: {
        title: `Calendar Test Task ${day}`,
        description: `This is a test task due on day ${day}`,
        reference_id: `TSK-CAL-${day}`,
        organization_id: org.id,
        property_id: property.id,
        created_by: staff.id
      }
    })

    await prisma.task_due_dates.create({
      data: {
        task_id: task.id,
        due_date: dueDate,
        created_by: staff.id
      }
    })

    await prisma.task_types.create({
      data: {
        task_id: task.id,
        type: 'Maintenance',
        created_by: staff.id
      }
    })

    await prisma.task_statuses.create({
      data: {
        task_id: task.id,
        state: 'Open'
      }
    })

    await prisma.task_priorities.create({
      data: {
        task_id: task.id,
        priority: 'Medium',
        created_by: staff.id
      }
    })

    console.log(`   ✅ Task ${task.reference_id} due on day ${day}`)
  }

  // 5. SEED RENT CHANGES (scheduled rental changes)
  console.log('\n5️⃣ Seeding scheduled rent changes...')
  const rentChangeDays = [5, 20]
  for (const day of rentChangeDays) {
    const effectiveDate = getDate(day)
    const lease = createdLeases[0] // Use first created lease
    
    const rentChange = await prisma.scheduled_rental_changes.create({
      data: {
        lease_id: lease.id,
        new_monthly_rent: 2000 + (day * 100),
        old_monthly_rent: lease.monthly_rent,
        effective_from: effectiveDate,
        status: 'Scheduled',
        created_by: staff.id
      }
    })

    console.log(`   ✅ Rent change effective on day ${day}`)
  }

  // 6. SEED MANUAL CALENDAR EVENTS
  console.log('\n6️⃣ Seeding manual calendar events...')
  const eventDays = [4, 11, 17, 24]
  for (const day of eventDays) {
    const eventDate = getDate(day)
    
    const event = await prisma.calendar_events.create({
      data: {
        organization_id: org.id,
        title: `Calendar Event ${day}`,
        description: `This is a manual calendar event on day ${day}`,
        timestamp: eventDate,
        duration_minutes: 60,
        is_for_all_staff: true,
        created_by: staff.id
      }
    })

    // Add staff as attendee
    await prisma.calendar_event_attendees.create({
      data: {
        event_id: event.id,
        staff_id: staff.id
      }
    })

    console.log(`   ✅ Calendar event on day ${day}`)
  }

  console.log('\n✅ Calendar test data seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`   - Leases: ${createdLeases.length} total`)
  console.log(`   - Lease Starts: ${leaseStartDays.length} (days ${leaseStartDays.join(', ')})`)
  console.log(`   - Lease Ends: ${leaseEndDays.length} (days ${leaseEndDays.join(', ')})`)
  console.log(`   - Payments: ${paymentDays.length} (due on days ${paymentDays.join(', ')})`)
  console.log(`   - Expenses: ${expenseDays.length} (due on days ${expenseDays.join(', ')})`)
  console.log(`   - Tasks: ${taskDays.length} (due on days ${taskDays.join(', ')})`)
  console.log(`   - Rent Changes: ${rentChangeDays.length} (days ${rentChangeDays.join(', ')})`)
  console.log(`   - Manual Events: ${eventDays.length} (days ${eventDays.join(', ')})`)
}

main()
  .catch(e => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

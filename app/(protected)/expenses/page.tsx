export const dynamic = 'force-dynamic'
import { UnderDevelopment } from '@/components/costume-ui/under-development'
// import { Suspense } from 'react'
// import { cn } from '@/lib/utils'
// import { prisma } from '@/lib/prisma'
// import { createClient } from '@/utils/supabase/server'
// import ExpensesSection from '@/components/sections/expenses-section'
// import { transformExpense, ExpenseWithDetails } from '@/lib/expenses-utils'
// import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'

// const PAGE_SIZE = 10

// // Shared select for expense queries
// const expenseSelect = {
//   reference_id: true,
//   type: true,
//   status: true,
//   due_payment_date: true,
//   created_at: true,
//   properties: {
//     select: {
//       id: true,
//       code: true,
//       projects: {
//         select: {
//           title: true
//         }
//       }
//     }
//   },
//   charges: {
//     select: {
//       amount: true,
//       is_taxed: true
//     }
//   },
//   payment_history: {
//     orderBy: {
//       paid_at: 'desc' as const
//     },
//     select: {
//       paid_at: true,
//       amount: true,
//       status: true
//     }
//   },
//   recurring_configs: {
//     select: {
//       every: true,
//       time_unit: true,
//       event_on: true
//     }
//   }
// }

// async function getExpenses(): Promise<{ data: ExpenseWithDetails[]; total: number }> {
//   try {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()

//     if (!user) {
//       return { data: [], total: 0 }
//     }

//     // Get staff organization
//     const staff = await prisma.staff.findUnique({
//       where: { id: user.id },
//       select: { organization_id: true }
//     })

//     if (!staff) {
//       return { data: [], total: 0 }
//     }

//     const whereClause = {
//       organization_id: staff.organization_id,
//       category: 'Property_Related' as const
//     }

//     // Fetch first page of expenses and total count in parallel
//     const [expenses, total] = await Promise.all([
//       prisma.expenses.findMany({
//         where: whereClause,
//         select: expenseSelect,
//         orderBy: { created_at: 'desc' },
//         take: PAGE_SIZE
//       }),
//       prisma.expenses.count({ where: whereClause })
//     ])

//     return {
//       data: expenses.map(transformExpense),
//       total
//     }
//   } catch (error) {
//     console.error('Error fetching expenses:', error)
//     return { data: [], total: 0 }
//   }
// }

const Expenses = async () => {
  // const { data: initialData, total: initialTotal } = await getExpenses()

  // return (
  //   <Suspense fallback={<TablePageSkeleton />}>
  //     <div className={cn('flex flex-col gap-2.5', 'h-full')}>
  //       Heading
  //       <div>
  //         <h1>Expenses</h1>
  //       </div>
  //       <ExpensesSection
  //         initialData={initialData}
  //         initialTotal={initialTotal}
  //       />
  //     </div>
  //   </Suspense>
  // )

  return <UnderDevelopment />
}

export default Expenses

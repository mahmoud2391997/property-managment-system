'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get contract_id from query params
    const searchParams = request.nextUrl.searchParams
    const contractId = searchParams.get('contract_id')

    if (!contractId) {
      return NextResponse.json(
        { error: 'contract_id is required' },
        { status: 400 }
      )
    }

    // Find all expenses of type 'Contract_Initial_Charges' for this contract
    const expenses = await prisma.expenses.findMany({
      where: {
        organization_id: staff.organization_id,
        category: 'Contract_Related',
        contract_expenses: {
          contract_id: contractId,
          type: 'Contract_Initial_Charges'
        }
      },
      select: {
        charges: {
          select: {
            title: true
          }
        }
      }
    })

    // Extract unique charge titles
    const usedChargeTitles = [
      ...new Set(expenses.flatMap(expense => expense.charges.map(charge => charge.title)))
    ]

    return NextResponse.json({ usedChargeTitles })
  } catch (error: any) {
    console.error('Error fetching contract initial charges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract initial charges' },
      { status: 500 }
    )
  }
}

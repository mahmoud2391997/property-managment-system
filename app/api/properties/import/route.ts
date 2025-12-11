import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

type ImportError = {
  row: number
  field: string
  message: string
  value?: string
}

type PropertyRow = {
  code?: string
  street_address?: string
  city?: string
  postal_code?: string
  type?: string
  status?: string
}

const VALID_TYPES = ['House', 'Apartment', 'Studio', 'Commercial_Unit'] as const
const VALID_STATUSES = ['Ready', 'Pending_Inspection', 'Under_Preparation'] as const

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff info to get organization_id
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Verify project exists and belongs to organization
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        organization_id: staff.organization_id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })
    }

    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<PropertyRow>(worksheet, {
      defval: ''
    })

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
    }

    // Validate all rows first
    const errors: ImportError[] = []
    const validatedRows: {
      code: string
      street_address: string
      city: string
      postal_code: string
      type: typeof VALID_TYPES[number]
      status: typeof VALID_STATUSES[number]
    }[] = []

    // Check for duplicate codes within the file
    const codesInFile = new Map<string, number>()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel rows start at 1, plus header row

      // Validate code
      const code = String(row.code || '').trim()
      if (!code) {
        errors.push({ row: rowNum, field: 'code', message: 'Code is required' })
      } else if (code.length > 50) {
        errors.push({ row: rowNum, field: 'code', message: 'Code must be 50 characters or less', value: code })
      } else {
        // Check for duplicate within file
        if (codesInFile.has(code)) {
          errors.push({
            row: rowNum,
            field: 'code',
            message: `Duplicate code found in row ${codesInFile.get(code)}`,
            value: code
          })
        } else {
          codesInFile.set(code, rowNum)
        }
      }

      // Validate street_address
      const streetAddress = String(row.street_address || '').trim()
      if (!streetAddress) {
        errors.push({ row: rowNum, field: 'street_address', message: 'Street address is required' })
      } else if (streetAddress.length < 5) {
        errors.push({ row: rowNum, field: 'street_address', message: 'Street address must be at least 5 characters', value: streetAddress })
      } else if (streetAddress.length > 300) {
        errors.push({ row: rowNum, field: 'street_address', message: 'Street address must be 300 characters or less', value: streetAddress })
      }

      // Validate city
      const city = String(row.city || '').trim()
      if (!city) {
        errors.push({ row: rowNum, field: 'city', message: 'City is required' })
      } else if (city.length > 100) {
        errors.push({ row: rowNum, field: 'city', message: 'City must be 100 characters or less', value: city })
      }

      // Validate postal_code
      const postalCode = String(row.postal_code || '').trim()
      if (!postalCode) {
        errors.push({ row: rowNum, field: 'postal_code', message: 'Postal code is required' })
      } else if (postalCode.length < 4) {
        errors.push({ row: rowNum, field: 'postal_code', message: 'Postal code must be at least 4 characters', value: postalCode })
      } else if (postalCode.length > 10) {
        errors.push({ row: rowNum, field: 'postal_code', message: 'Postal code must be 10 characters or less', value: postalCode })
      }

      // Validate type
      const type = String(row.type || '').trim()
      if (!type) {
        errors.push({ row: rowNum, field: 'type', message: 'Type is required' })
      } else if (!VALID_TYPES.includes(type as any)) {
        errors.push({
          row: rowNum,
          field: 'type',
          message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          value: type
        })
      }

      // Validate status
      const status = String(row.status || '').trim()
      if (!status) {
        errors.push({ row: rowNum, field: 'status', message: 'Status is required' })
      } else if (!VALID_STATUSES.includes(status as any)) {
        errors.push({
          row: rowNum,
          field: 'status',
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          value: status
        })
      }

      // If no errors for this row, add to validated rows
      if (!errors.some(e => e.row === rowNum)) {
        validatedRows.push({
          code,
          street_address: streetAddress,
          city,
          postal_code: postalCode,
          type: type as typeof VALID_TYPES[number],
          status: status as typeof VALID_STATUSES[number]
        })
      }
    }

    // Check for existing codes in database (scoped to the selected project)
    if (codesInFile.size > 0) {
      const existingProperties = await prisma.properties.findMany({
        where: {
          project_id: projectId,
          code: { in: Array.from(codesInFile.keys()) }
        },
        select: { code: true }
      })

      for (const existing of existingProperties) {
        const rowNum = codesInFile.get(existing.code)
        if (rowNum) {
          errors.push({
            row: rowNum,
            field: 'code',
            message: 'A property with this code already exists in this project',
            value: existing.code
          })
        }
      }
    }

    // If any errors, return them all
    if (errors.length > 0) {
      // Sort errors by row number
      errors.sort((a, b) => a.row - b.row)
      return NextResponse.json({ errors }, { status: 400 })
    }

    // All validations passed, create properties in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdProperties = await tx.properties.createMany({
        data: validatedRows.map(row => ({
          code: row.code,
          street_address: row.street_address,
          city: row.city,
          postal_code: row.postal_code,
          type: row.type,
          status: row.status,
          project_id: projectId,
          organization_id: staff.organization_id,
          created_by: user.id
        }))
      })

      return createdProperties.count
    })

    return NextResponse.json(
      {
        success: true,
        count: result,
        message: `Successfully imported ${result} properties`
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error importing properties:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import properties' },
      { status: 500 }
    )
  }
}

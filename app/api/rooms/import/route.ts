import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import * as XLSX from 'xlsx'

type ImportError = {
  row: number
  field: string
  message: string
  value?: string
}

type RoomRow = {
  property_code?: string
  title?: string
  status?: string
}

const VALID_STATUSES = ['Ready', 'Pending_Inspection', 'Under_Preparation'] as const
const VALID_PROPERTY_TYPES = ['House', 'Apartment'] as const

export async function POST(req: NextRequest) {
  try {
    const { user, staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'rooms.import'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        organization_id: currentStaff.organization_id
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
    const data = XLSX.utils.sheet_to_json<RoomRow>(worksheet, {
      defval: ''
    })

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
    }

    // Fetch all properties in this project for validation
    const propertiesInProject = await prisma.properties.findMany({
      where: {
        project_id: projectId,
        organization_id: currentStaff.organization_id
      },
      select: {
        id: true,
        code: true,
        type: true
      }
    })

    // Create a map for quick lookup
    const propertyMap = new Map(propertiesInProject.map(p => [p.code, p]))

    // Fetch existing rooms for duplicate checking
    const existingRooms = await prisma.rooms.findMany({
      where: {
        property_id: { in: propertiesInProject.map(p => p.id) }
      },
      select: {
        property_id: true,
        title: true
      }
    })

    // Create a set for existing room titles per property
    const existingRoomSet = new Set(
      existingRooms.map(r => `${r.property_id}:${r.title.toLowerCase()}`)
    )

    // Validate all rows first
    const errors: ImportError[] = []
    const validatedRows: {
      property_id: string
      title: string
      status: typeof VALID_STATUSES[number]
    }[] = []

    // Track for duplicates within file (property_code + title combination)
    const roomsInFile = new Map<string, number>()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel rows start at 1, plus header row

      // Validate property_code
      const propertyCode = String(row.property_code || '').trim()
      let propertyId: string | null = null

      if (!propertyCode) {
        errors.push({ row: rowNum, field: 'property_code', message: 'Property code is required' })
      } else {
        const property = propertyMap.get(propertyCode)
        if (!property) {
          errors.push({
            row: rowNum,
            field: 'property_code',
            message: 'Property not found in the selected project',
            value: propertyCode
          })
        } else if (!VALID_PROPERTY_TYPES.includes(property.type as any)) {
          errors.push({
            row: rowNum,
            field: 'property_code',
            message: `Property type "${property.type}" does not support rooms. Only House and Apartment properties can have rooms.`,
            value: propertyCode
          })
        } else {
          propertyId = property.id
        }
      }

      // Validate title
      const title = String(row.title || '').trim()
      if (!title) {
        errors.push({ row: rowNum, field: 'title', message: 'Title is required' })
      } else if (title.length > 100) {
        errors.push({
          row: rowNum,
          field: 'title',
          message: 'Title must be 100 characters or less',
          value: title
        })
      }

      // Check for duplicate title within file (for same property)
      if (propertyCode && title) {
        const key = `${propertyCode.toLowerCase()}:${title.toLowerCase()}`
        if (roomsInFile.has(key)) {
          errors.push({
            row: rowNum,
            field: 'title',
            message: `Duplicate room title for property "${propertyCode}" found in row ${roomsInFile.get(key)}`,
            value: title
          })
        } else {
          roomsInFile.set(key, rowNum)
        }
      }

      // Check for existing room with same title in database
      if (propertyId && title) {
        const existingKey = `${propertyId}:${title.toLowerCase()}`
        if (existingRoomSet.has(existingKey)) {
          errors.push({
            row: rowNum,
            field: 'title',
            message: `A room with title "${title}" already exists for this property`,
            value: title
          })
        }
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
      if (!errors.some(e => e.row === rowNum) && propertyId) {
        validatedRows.push({
          property_id: propertyId,
          title,
          status: status as typeof VALID_STATUSES[number]
        })
      }
    }

    // If any errors, return them all
    if (errors.length > 0) {
      // Sort errors by row number
      errors.sort((a, b) => a.row - b.row)
      return NextResponse.json({ errors }, { status: 400 })
    }

    // All validations passed, create rooms in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdRooms = await tx.rooms.createMany({
        data: validatedRows.map(row => ({
          property_id: row.property_id,
          title: row.title,
          status: row.status,
          created_by: user.id
        }))
      })

      return createdRooms.count
    })

    return NextResponse.json(
      {
        success: true,
        count: result,
        message: `Successfully imported ${result} rooms`
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error importing rooms:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import rooms' },
      { status: 500 }
    )
  }
}

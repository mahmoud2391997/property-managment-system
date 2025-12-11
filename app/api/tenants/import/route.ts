import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createAdminClient } from '@/utils/supabase/admin'
import * as XLSX from 'xlsx'
import { getBaseUrl } from '@/utils/get-base-url'

type ImportError = {
  row: number
  field: string
  message: string
  value?: string
}

type TenantRow = {
  identity_type?: string
  identity_number?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  email?: string
}

const VALID_IDENTITY_TYPES = ['mykad', 'passport'] as const
const MAX_TENANTS_PER_IMPORT = 50

export async function POST(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const createdAuthUsers: string[] = [] // Track created auth users for rollback

  try {
    const { user, staff: currentStaff, error } = await getUserAndStaff()

    if (error) return error

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
    const data = XLSX.utils.sheet_to_json<TenantRow>(worksheet, {
      defval: ''
    })

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
    }

    // Check maximum limit
    if (data.length > MAX_TENANTS_PER_IMPORT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TENANTS_PER_IMPORT} tenants can be imported at once. Your file contains ${data.length} tenants.` },
        { status: 400 }
      )
    }

    // Validate all rows first
    const errors: ImportError[] = []
    const validatedRows: {
      identity_type: 'mykad' | 'passport'
      identity_number: string
      first_name: string
      last_name: string | null
      phone_number: string
      email: string
    }[] = []

    // Track for duplicates within file
    const identityNumbersInFile = new Map<string, number>()
    const emailsInFile = new Map<string, number>()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel rows start at 1, plus header row

      // Validate identity_type
      const identityType = String(row.identity_type || '').trim().toLowerCase()
      if (!identityType) {
        errors.push({ row: rowNum, field: 'identity_type', message: 'Identity type is required' })
      } else if (!VALID_IDENTITY_TYPES.includes(identityType as any)) {
        errors.push({
          row: rowNum,
          field: 'identity_type',
          message: `Invalid identity type. Must be one of: ${VALID_IDENTITY_TYPES.join(', ')}`,
          value: identityType
        })
      }

      // Validate identity_number
      const identityNumber = String(row.identity_number || '').trim()
      if (!identityNumber) {
        errors.push({ row: rowNum, field: 'identity_number', message: 'Identity number is required' })
      } else if (identityType === 'mykad') {
        // MyKad must be exactly 12 digits
        if (!/^[0-9]{12}$/.test(identityNumber)) {
          errors.push({
            row: rowNum,
            field: 'identity_number',
            message: 'MyKad must be exactly 12 digits (numbers only)',
            value: identityNumber
          })
        }
      } else if (identityType === 'passport') {
        // Passport must be 6-20 characters
        if (identityNumber.length < 6 || identityNumber.length > 20) {
          errors.push({
            row: rowNum,
            field: 'identity_number',
            message: 'Passport number must be 6-20 characters',
            value: identityNumber
          })
        }
      }

      // Check for duplicate identity numbers within file
      if (identityNumber) {
        if (identityNumbersInFile.has(identityNumber)) {
          errors.push({
            row: rowNum,
            field: 'identity_number',
            message: `Duplicate identity number found in row ${identityNumbersInFile.get(identityNumber)}`,
            value: identityNumber
          })
        } else {
          identityNumbersInFile.set(identityNumber, rowNum)
        }
      }

      // Validate first_name
      const firstName = String(row.first_name || '').trim()
      if (!firstName) {
        errors.push({ row: rowNum, field: 'first_name', message: 'First name is required' })
      } else if (firstName.length > 100) {
        errors.push({
          row: rowNum,
          field: 'first_name',
          message: 'First name must be 100 characters or less',
          value: firstName
        })
      }

      // Validate last_name (optional but check length if provided)
      const lastName = String(row.last_name || '').trim() || null
      if (lastName && lastName.length > 100) {
        errors.push({
          row: rowNum,
          field: 'last_name',
          message: 'Last name must be 100 characters or less',
          value: lastName
        })
      }

      // Validate phone_number (without + prefix, we'll add it when saving)
      const phoneNumber = String(row.phone_number || '').trim()
      if (!phoneNumber) {
        errors.push({ row: rowNum, field: 'phone_number', message: 'Phone number is required' })
      } else if (!/^[0-9]+$/.test(phoneNumber)) {
        errors.push({
          row: rowNum,
          field: 'phone_number',
          message: 'Phone number must contain only numbers with country code (e.g., 60123456789)',
          value: phoneNumber
        })
      } else if (phoneNumber.length < 8 || phoneNumber.length > 20) {
        errors.push({
          row: rowNum,
          field: 'phone_number',
          message: 'Phone number must be 8-20 digits',
          value: phoneNumber
        })
      }

      // Validate email
      const email = String(row.email || '').trim().toLowerCase()
      if (!email) {
        errors.push({ row: rowNum, field: 'email', message: 'Email is required' })
      } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
        errors.push({
          row: rowNum,
          field: 'email',
          message: 'Invalid email format',
          value: email
        })
      }

      // Check for duplicate emails within file
      if (email) {
        if (emailsInFile.has(email)) {
          errors.push({
            row: rowNum,
            field: 'email',
            message: `Duplicate email found in row ${emailsInFile.get(email)}`,
            value: email
          })
        } else {
          emailsInFile.set(email, rowNum)
        }
      }

      // If no errors for this row, add to validated rows
      if (!errors.some(e => e.row === rowNum)) {
        validatedRows.push({
          identity_type: identityType as 'mykad' | 'passport',
          identity_number: identityNumber,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          email: email
        })
      }
    }

    // Check for existing identity numbers in database
    if (identityNumbersInFile.size > 0) {
      const existingTenants = await prisma.individual_tenants.findMany({
        where: {
          identity_number: { in: Array.from(identityNumbersInFile.keys()) }
        },
        select: { identity_number: true }
      })

      for (const existing of existingTenants) {
        const rowNum = identityNumbersInFile.get(existing.identity_number)
        if (rowNum) {
          errors.push({
            row: rowNum,
            field: 'identity_number',
            message: 'A tenant with this identity number already exists',
            value: existing.identity_number
          })
        }
      }
    }

    // Check for existing emails in Supabase Auth
    for (const [email, rowNum] of emailsInFile) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email)
      if (existingUser) {
        errors.push({
          row: rowNum,
          field: 'email',
          message: 'A user with this email already exists',
          value: email
        })
      }
    }

    // If any errors, return them all
    if (errors.length > 0) {
      // Sort errors by row number
      errors.sort((a, b) => a.row - b.row)
      return NextResponse.json({ errors }, { status: 400 })
    }

    // All validations passed, create tenants one by one
    // We can't use createMany because we need to create auth users first
    let createdCount = 0

    for (const tenant of validatedRows) {
      // ============ OLD (uncomment when ready to send emails) ============
      // // Create auth user
      // const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      //   email: tenant.email,
      //   email_confirm: false,
      //   user_metadata: {
      //     user_type: 'tenant'
      //   }
      // })

      // if (authError || !authData.user) {
      //   // Rollback all created auth users
      //   for (const userId of createdAuthUsers) {
      //     await supabaseAdmin.auth.admin.deleteUser(userId)
      //   }
      //   return NextResponse.json(
      //     { error: `Failed to create auth user for ${tenant.email}: ${authError?.message}` },
      //     { status: 500 }
      //   )
      // }

      // createdAuthUsers.push(authData.user.id)

      // // Send invitation email
      // const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      //   tenant.email,
      //   {
      //     redirectTo: `${getBaseUrl()}/api/auth/confirm-tenant`
      //   }
      // )
      // ============ END OLD ============

      // ============ TEMPORARY NEW (remove when ready to send emails) ============
      // Use generateLink with type 'invite' to create user in invited/pending state WITHOUT sending email
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: tenant.email,
        options: {
          redirectTo: `${getBaseUrl()}/api/auth/confirm-tenant`,
          data: {
            user_type: 'tenant'
          }
        }
      })

      if (linkError || !linkData.user) {
        // Rollback all created auth users
        for (const userId of createdAuthUsers) {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        }
        return NextResponse.json(
          { error: `Failed to create auth user for ${tenant.email}: ${linkError?.message}` },
          { status: 500 }
        )
      }

      const authData = { user: linkData.user }
      createdAuthUsers.push(authData.user.id)
      // ============ END TEMPORARY NEW ============

      // Create database records in a transaction
      try {
        await prisma.$transaction(async (tx) => {
          // Create tenant record
          await tx.tenants.create({
            data: {
              id: authData.user.id,
              type: 'Individual',
              profile_pic: null,
              profile_thumb: null,
              created_by: user.id
            }
          })

          // Create individual_tenant record (add + prefix to phone number)
          await tx.individual_tenants.create({
            data: {
              tenant_id: authData.user.id,
              identity_type: tenant.identity_type,
              identity_number: tenant.identity_number,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              phone_number: `+${tenant.phone_number}`
            }
          })

          // Link tenant to organization
          await tx.organizations_tenants.create({
            data: {
              tenant_id: authData.user.id,
              organization_id: currentStaff.organization_id,
              created_by: user.id
            }
          })
        })

        createdCount++
      } catch (dbError: any) {
        // Rollback all created auth users
        for (const userId of createdAuthUsers) {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        }
        return NextResponse.json(
          { error: `Failed to create tenant record: ${dbError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: createdCount,
        message: `Successfully imported ${createdCount} tenants`
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Rollback all created auth users on any error
    for (const userId of createdAuthUsers) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    }
    console.error('Error importing tenants:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import tenants' },
      { status: 500 }
    )
  }
}

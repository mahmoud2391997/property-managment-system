import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { tenantId } = await params

    // Verify tenant belongs to organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenantId,
        organization_id: staff.organization_id
      },
      include: {
        tenants: true
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, PDF' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${tenantId}/identity_card.${ext}`

    // Remove old file if exists
    const oldUrl = organizationTenant.tenants.identity_card_url
    if (oldUrl) {
      try {
        const oldPath = new URL(oldUrl).pathname.split('/tenants/').pop()
        if (oldPath) {
          await supabase.storage.from('tenants').remove([oldPath])
        }
      } catch {
        // Ignore removal errors
      }
    }

    // Upload file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tenants')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading identity document:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tenants')
      .getPublicUrl(uploadData.path)

    // Update tenant record
    await prisma.tenants.update({
      where: { id: tenantId },
      data: { identity_card_url: urlData.publicUrl }
    })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    })
  } catch (error: any) {
    console.error('Error uploading identity document:', error)
    return NextResponse.json(
      { error: 'Failed to upload identity document' },
      { status: 500 }
    )
  }
}
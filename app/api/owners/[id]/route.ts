import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id } = await params

    // Fetch owner with properties and contracts
    const owner = await prisma.owners.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        profile_pic: true,
        profile_thumb: true,
        created_at: true,
        properties: {
          select: {
            id: true,
            code: true,
            street_address: true,
            city: true,
            type: true,
            status: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        contracts: {
          select: {
            id: true,
            reference_id: true,
            status: true,
            start_date: true,
            monthly_rent: true,
            number_of_months: true,
            ended_at: true,
            rental_period: true,
            frequency: true,
            properties: {
              select: {
                id: true,
                code: true,
                street_address: true,
                city: true
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { start_date: 'desc' }
          ]
        }
      }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found or unauthorized' },
        { status: 404 }
      )
    }

    const formattedContracts = owner.contracts.map(contract => ({
      id: contract.id,
      reference_id: contract.reference_id,
      status: contract.status,
      start_date: contract.start_date.toISOString(),
      monthly_rent: Number(contract.monthly_rent),
      number_of_months: contract.number_of_months,
      ended_at: contract.ended_at?.toISOString() || null,
      rental_period: contract.rental_period,
      frequency: contract.frequency,
      property: {
        id: contract.properties.id,
        code: contract.properties.code,
        street_address: contract.properties.street_address,
        city: contract.properties.city
      }
    }))

    return NextResponse.json({
      success: true,
      owner: {
        id: owner.id,
        first_name: owner.first_name,
        last_name: owner.last_name,
        phone_number: owner.phone_number,
        email: owner.email,
        profile_pic: owner.profile_pic,
        profile_thumb: owner.profile_thumb,
        createdAt: owner.created_at.toISOString()
      },
      properties: owner.properties,
      contracts: formattedContracts,
      propertyCount: owner.properties.length,
      currentContractCount: formattedContracts.filter(c => c.status === 'Current').length,
      totalContractCount: formattedContracts.length
    })
  } catch (error: any) {
    console.error('Error fetching owner details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owner details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id } = await params

    // Verify the owner exists and belongs to the same organization
    const existingOwner = await prisma.owners.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      }
    })

    if (!existingOwner) {
      return NextResponse.json(
        { error: 'Owner not found or unauthorized' },
        { status: 404 }
      )
    }

    const formData = await request.formData()

    const firstName = formData.get('firstName') as string | null
    const lastName = formData.get('lastName') as string | null
    const phoneNo = formData.get('phoneNo') as string | null
    const email = formData.get('email') as string | null
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // Validation
    if (firstName !== null && !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name cannot be empty' },
        { status: 400 }
      )
    }

    if (phoneNo !== null && !phoneNo.trim()) {
      return NextResponse.json(
        { error: 'Phone number cannot be empty' },
        { status: 400 }
      )
    }

    let profilePicUrl: string | null = existingOwner.profile_pic
    let profileThumbUrl: string | null = existingOwner.profile_thumb

    // Upload new images to Supabase Storage if provided
    if (profileImage && profileThumb) {
      const supabase = await createClient()

      // Delete old images if they exist
      if (existingOwner.profile_pic || existingOwner.profile_thumb) {
        await supabase.storage.from('owners').remove([
          `${id}/profile.jpg`,
          `${id}/thumb.jpg`
        ])
      }

      // Upload main profile image
      const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
      const { data: mainData, error: mainError } = await supabase.storage
        .from('owners')
        .upload(`${id}/profile.jpg`, mainImageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (mainError) {
        console.error('Error uploading main image:', mainError)
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        )
      }

      // Upload thumbnail
      const thumbImageBuffer = Buffer.from(await profileThumb.arrayBuffer())
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('owners')
        .upload(`${id}/thumb.jpg`, thumbImageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError)
        return NextResponse.json(
          { error: 'Failed to upload thumbnail image' },
          { status: 500 }
        )
      }

      // Get public URLs
      const { data: mainUrl } = supabase.storage
        .from('owners')
        .getPublicUrl(mainData.path)

      const { data: thumbUrl } = supabase.storage
        .from('owners')
        .getPublicUrl(thumbData.path)

      profilePicUrl = mainUrl.publicUrl
      profileThumbUrl = thumbUrl.publicUrl
    }

    // Build update data
    const updateData: any = {
      profile_pic: profilePicUrl,
      profile_thumb: profileThumbUrl
    }

    if (firstName) updateData.first_name = firstName.trim()
    if (lastName !== null) updateData.last_name = lastName.trim() || null
    if (phoneNo) updateData.phone_number = phoneNo.trim()
    if (email !== null) updateData.email = email.trim() || null

    const updatedOwner = await prisma.owners.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      owner: {
        id: updatedOwner.id,
        firstName: updatedOwner.first_name,
        lastName: updatedOwner.last_name,
        phoneNo: updatedOwner.phone_number,
        email: updatedOwner.email,
        profilePic: updatedOwner.profile_pic,
        profileThumb: updatedOwner.profile_thumb
      }
    })
  } catch (error: any) {
    console.error('Error updating owner:', error)
    return NextResponse.json(
      { error: 'Failed to update owner' },
      { status: 500 }
    )
  }
}

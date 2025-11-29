import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET () {
  try {
    const { user, staff, error } = await getUserAndStaff()

    if (error) return error

    // Get owners with contracts count
    const owners = await prisma.owners.findMany({
      where: {
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
        _count: {
          select: {
            contracts: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(
      {
        success: true,
        owners
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    )
  }
}

export async function POST (request: Request) {
  try {
    const { user, staff, error } = await getUserAndStaff()

    if (error) return error

    const formData = await request.formData()
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string | null
    const phoneNo = formData.get('phoneNo') as string
    const email = formData.get('email') as string | null
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // Validation
    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!phoneNo || !phoneNo.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    let profilePicUrl: string | null = null
    let profileThumbUrl: string | null = null

    // Upload images to Supabase Storage if provided
    if (profileImage && profileThumb) {
      const supabase = await createClient()
      const ownerId = crypto.randomUUID()

      // Upload main profile image
      const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
      const { data: mainData, error: mainError } = await supabase.storage
        .from('owners')
        .upload(`${ownerId}/profile.jpg`, mainImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
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
        .upload(`${ownerId}/thumb.jpg`, thumbImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError)
        // Clean up main image if thumb upload fails
        await supabase.storage.from('owners').remove([mainData.path])
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

    // Create owner
    const owner = await prisma.owners.create({
      data: {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone_number: phoneNo.trim(),
        email: email?.trim() || null,
        profile_pic: profilePicUrl,
        profile_thumb: profileThumbUrl,
        organization_id: staff.organization_id,
        created_by: user.id
      }
    })

    return NextResponse.json(
      {
        success: true,
        owner: {
          id: owner.id,
          firstName: owner.first_name,
          lastName: owner.last_name,
          phoneNo: owner.phone_number,
          email: owner.email,
          profilePic: owner.profile_pic,
          profileThumb: owner.profile_thumb
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating owner:', error)
    return NextResponse.json(
      { error: 'Failed to create owner' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

const BUCKET_NAME = 'properties'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const mainImage = formData.get('main_image') as File
    const thumbImage = formData.get('thumb_image') as File
    const propertyId = formData.get('property_id') as string | null
    const roomId = formData.get('room_id') as string | null

    if (!mainImage || !thumbImage) {
      return NextResponse.json({ error: 'Both main and thumbnail images are required' }, { status: 400 })
    }

    if (!propertyId && !roomId) {
      return NextResponse.json({ error: 'Either property_id or room_id is required' }, { status: 400 })
    }

    // Generate unique filenames
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const prefix = propertyId ? `properties/${propertyId}` : `rooms/${roomId}`

    const mainFileName = `${prefix}/${timestamp}-${randomId}-main.jpg`
    const thumbFileName = `${prefix}/${timestamp}-${randomId}-thumb.jpg`

    // Upload main image
    const { error: mainError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(mainFileName, mainImage, {
        cacheControl: '3600',
        contentType: 'image/jpeg'
      })

    if (mainError) {
      console.error('Main image upload error:', mainError)
      return NextResponse.json({ error: 'Failed to upload main image' }, { status: 500 })
    }

    // Upload thumbnail
    const { error: thumbError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbFileName, thumbImage, {
        cacheControl: '3600',
        contentType: 'image/jpeg'
      })

    if (thumbError) {
      // Cleanup main image if thumb fails
      await supabase.storage.from(BUCKET_NAME).remove([mainFileName])
      console.error('Thumbnail upload error:', thumbError)
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
    }

    // Get public URLs
    const { data: { publicUrl: mainUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(mainFileName)

    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(thumbFileName)

    // Create database record
    const imageRecord = await prisma.property_images.create({
      data: {
        image_url: mainUrl,
        thumb_url: thumbUrl,
        property_id: propertyId || null,
        room_id: roomId || null,
        organization_id: staff.organization_id,
        created_by: user.id
      }
    })

    return NextResponse.json({
      success: true,
      image: {
        id: imageRecord.id,
        image_url: mainUrl,
        thumb_url: thumbUrl
      }
    })

  } catch (error: any) {
    console.error('Property image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Get the image record
    const image = await prisma.property_images.findUnique({
      where: { id: imageId }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Extract file paths from URLs
    const extractPath = (url: string) => {
      const bucketUrl = `/storage/v1/object/public/${BUCKET_NAME}/`
      const index = url.indexOf(bucketUrl)
      if (index !== -1) {
        return url.substring(index + bucketUrl.length)
      }
      // Try alternative URL format
      const parts = url.split(`/${BUCKET_NAME}/`)
      return parts.length > 1 ? parts[1] : null
    }

    const mainPath = extractPath(image.image_url)
    const thumbPath = extractPath(image.thumb_url)

    // Delete files from storage
    const filesToDelete = [mainPath, thumbPath].filter(Boolean) as string[]
    if (filesToDelete.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(filesToDelete)
    }

    // Delete database record
    await prisma.property_images.delete({
      where: { id: imageId }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Property image delete error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

'use server'

import { NextRequest, NextResponse } from 'next/server'
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

    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Try to get file size via HEAD request
    try {
      const response = await fetch(url, { method: 'HEAD' })

      if (response.ok) {
        const contentLength = response.headers.get('content-length')
        const contentType = response.headers.get('content-type')

        return NextResponse.json({
          size: contentLength ? parseInt(contentLength, 10) : null,
          type: contentType || null
        })
      }
    } catch (e) {
      // HEAD request failed, try to extract from Supabase path
    }

    // If the URL is a Supabase storage URL, try to get metadata from Supabase
    if (url.includes('supabase')) {
      try {
        // Extract bucket and path from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/')

        if (pathParts.length === 2) {
          const [bucket, ...filePath] = pathParts[1].split('/')
          const path = filePath.join('/')

          // List files in the bucket to get metadata
          const { data, error } = await supabase.storage
            .from(bucket)
            .list(path.split('/').slice(0, -1).join('/'), {
              search: path.split('/').pop()
            })

          if (!error && data && data.length > 0) {
            const file = data.find(f => f.name === path.split('/').pop())
            if (file && file.metadata) {
              return NextResponse.json({
                size: file.metadata.size || null,
                type: file.metadata.mimetype || null
              })
            }
          }
        }
      } catch (e) {
        // Supabase metadata fetch failed
      }
    }

    // Return null if we couldn't get the metadata
    return NextResponse.json({
      size: null,
      type: null
    })
  } catch (error: any) {
    console.error('Error fetching file metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file metadata' },
      { status: 500 }
    )
  }
}

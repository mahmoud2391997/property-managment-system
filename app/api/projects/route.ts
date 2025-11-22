import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Fetch projects for this organization
    const projects = await prisma.projects.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        title: true,
        state: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ projects }, { status: 200 })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get staff info to find organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, state } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    if (!state || !state.trim()) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.projects.create({
      data: {
        title: title.trim(),
        state: state.trim(),
        organization_id: staff.organization_id,
        created_by: user.id
      }
    })

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          title: project.title,
          state: project.state
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}

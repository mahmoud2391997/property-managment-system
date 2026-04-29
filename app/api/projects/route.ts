import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET() {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'projects.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    const { staff, user, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'projects.create'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // Check if project title already exists in this organization
    const existingProject = await prisma.projects.findFirst({
      where: {
        title: title.trim(),
        organization_id: staff.organization_id
      }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: `A project with the name "${title.trim()}" already exists` },
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
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

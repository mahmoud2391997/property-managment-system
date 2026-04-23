import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'projects.access'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    // Fetch project by ID for this organization
    const project = await prisma.projects.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        title: true,
        state: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project }, { status: 200 })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, user, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'projects.update'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
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

    // Check if project exists and belongs to this organization
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project title already exists in this organization (excluding current project)
    const duplicateProject = await prisma.projects.findFirst({
      where: {
        title: title.trim(),
        organization_id: staff.organization_id,
        id: {
          not: id
        }
      }
    })

    if (duplicateProject) {
      return NextResponse.json(
        { error: `A project with the name "${title.trim()}" already exists` },
        { status: 400 }
      )
    }

    // Update project
    const updatedProject = await prisma.projects.update({
      where: {
        id
      },
      data: {
        title: title.trim(),
        state: state.trim()
      }
    })

    return NextResponse.json(
      {
        success: true,
        project: {
          id: updatedProject.id,
          title: updatedProject.title,
          state: updatedProject.state
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'projects.delete'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    // Check if project exists and belongs to this organization
    const existingProject = await prisma.projects.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      },
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has properties
    if (existingProject._count.properties > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with associated properties' },
        { status: 400 }
      )
    }

    // Delete project
    await prisma.projects.delete({
      where: {
        id
      }
    })

    return NextResponse.json(
      { success: true, message: 'Project deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}

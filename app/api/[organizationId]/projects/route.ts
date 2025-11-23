import { prisma } from '@/lib/prisma'
import { OrganizationIdParams } from '@/types'

export async function GET (req: Request, { params }: OrganizationIdParams) {
  const { organizationId } = params

  try {
    const projects = await prisma.projects.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' }
    })
    return Response.json(projects)
  } catch (error) {
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
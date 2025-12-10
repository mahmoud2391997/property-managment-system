import { prisma } from '@/lib/prisma'

export async function GET (
  req: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params

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
import { cn } from '@/lib/utils'
import ProjectsSection from '@/components/sections/projects-section'

async function getProjects() {
  const { data: { user } } = 

  if (!user) {
    return []
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  // Get projects with property count
  const projects = await prisma.projects.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      title: true,
      state: true,
      _count: {
        select: {
          properties: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return projects.map(project => ({
    id: project.id,
    name: project.title,
    state: project.state,
    property_count: project._count.properties
  }))
}

const Projects = async () => {
  await requirePermission('projects.access')
  const projects = await getProjects()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Projects</h1>
      </div>
      <ProjectsSection projects={projects} />
    </div>
  )
}

export default Projects

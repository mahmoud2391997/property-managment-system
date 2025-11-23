import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import {
  DeleteButtonIcon,
  ImportButtonIcon
} from '@/components/costume-ui/icon'
import ProjectsTable from '@/components/tables/projects-table'
import AddProjectDialog from '@/components/dialogs/add-project-dialog'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getProjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
  const projects = await getProjects()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Projects</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search projects' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            variant='secondary'
            icon={<ImportButtonIcon className='text-neutral-400' />}
            label='Import'
          />

          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <AddProjectDialog />
        </div>
      </div>
      {/* Table */}
      <div>
        <ProjectsTable data={projects} />
      </div>
    </div>
  )
}

export default Projects

'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import {
  DeleteButtonIcon,
  ImportButtonIcon
} from '@/components/costume-ui/icon'
import ProjectsTable from '@/components/tables/projects-table'
import AddProjectDialog from '@/components/dialogs/add-project-dialog'
import { Project } from '@/types'
import { usePermissions } from '@/hooks/use-permissions'

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { can } = usePermissions()

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return projects
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return projects.filter(project => {
      const nameMatch = project.name?.toLowerCase().includes(lowerSearch)
      const stateMatch = project.state?.toLowerCase().includes(lowerSearch)
      const propertyCountMatch = project.property_count?.toString().includes(lowerSearch)

      return nameMatch || stateMatch || propertyCountMatch
    })
  }, [projects, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search projects'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            variant='secondary'
            icon={<ImportButtonIcon className='text-neutral-400' />}
            label='Import'
          />

          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}

          {can('projects.create') && <AddProjectDialog />}
        </div>
      </div>
      {/* Table */}
      <div>
        <ProjectsTable data={filteredProjects} />
      </div>
    </>
  )
}

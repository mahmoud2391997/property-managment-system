'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import AgentsTable, { AgentWithDetails } from '@/components/tables/agents-table'
import AddAgentDialog from '@/components/dialogs/add-agent-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'

interface AgentsSectionProps {
  agents: AgentWithDetails[]
}

export default function AgentsSection({ agents }: AgentsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { can } = usePermissions()

  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) {
      return agents
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return agents.filter(agent => {
      // Search by name (first name, last name, or full name)
      const firstName = agent.first_name?.toLowerCase() || ''
      const lastName = agent.last_name?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const nameMatch = firstName.includes(lowerSearch) ||
                        lastName.includes(lowerSearch) ||
                        fullName.includes(lowerSearch)

      // Search by phone number
      const phoneMatch = agent.phone_number?.toLowerCase().includes(lowerSearch)

      // Search by email
      const emailMatch = agent.email?.toLowerCase().includes(lowerSearch)

      // Search by lease count
      const leaseCountMatch = agent._count.leases.toString().includes(lowerSearch)

      return nameMatch || phoneMatch || emailMatch || leaseCountMatch
    })
  }, [agents, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search agents'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {can('agents.create') && <AddAgentDialog />}
        </div>
      </div>
      {/* Table */}
      <div>
        <AgentsTable data={filteredAgents} />
      </div>
    </>
  )
}

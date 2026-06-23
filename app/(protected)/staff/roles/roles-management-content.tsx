'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Shield, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import RoleDialog from '@/components/dialogs/role-dialog'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { toast } from 'sonner'

type Role = {
  id: string
  title: string
  is_owner: boolean
  permission_count: number
  staff_count: number
}

type Permission = {
  id: string
  action: string
  title: string
  description: string
}

type PermissionsResponse = {
  success: boolean
  permissions: Record<string, Permission[]>
}

export default function RolesManagementContent() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles)
      } else {
        toast.error('Failed to fetch roles')
      }
    } catch (error) {
      toast.error('Error fetching roles')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data: PermissionsResponse = await response.json()
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const handleCreateRole = () => {
    setEditingRole(null)
    setDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    if (role.is_owner) {
      toast.error('Cannot edit the Owner role')
      return
    }
    setEditingRole(role)
    setDialogOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    if (role.is_owner) {
      toast.error('Cannot delete the Owner role')
      return
    }
    if (role.staff_count > 0) {
      toast.error('Cannot delete role with assigned staff members')
      return
    }
    setDeletingRole(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingRole) return

    try {
      const response = await fetch(`/api/roles/${deletingRole.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Role deleted successfully')
        fetchRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete role')
      }
    } catch (error) {
      toast.error('Error deleting role')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingRole(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingRole(null)
  }

  const handleRoleSaved = () => {
    fetchRoles()
    handleDialogClose()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i: any) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Staff', href: '/staff' },
              { label: 'Manage Roles' }
            ]}
          />
          <h1 className="text-2xl font-bold">Roles Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  {role.is_owner && (
                    <Badge variant="secondary">Owner</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!role.is_owner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role)}
                        disabled={role.staff_count > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>{role.permission_count} permissions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{role.staff_count} staff members</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roles found</h3>
            <p className="text-muted-foreground mb-4">Create your first role to get started</p>
            <Button onClick={handleCreateRole}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </CardContent>
        </Card>
      )}

      <RoleDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleRoleSaved}
        editingRole={editingRole}
        permissions={permissions}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={
          deletingRole ? (
            <>
              Are you sure you want to delete the role <strong>{deletingRole.title}</strong>? 
              This action cannot be undone.
            </>
          ) : (
            'Are you sure you want to delete this role? This action cannot be undone.'
          )
        }
        confirmButtonLabel="Delete"
        confirmButtonLoadingLabel="Deleting..."
        onConfirm={confirmDelete}
        variant="danger"
      />
    </div>
  )
}

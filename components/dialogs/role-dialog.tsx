'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
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

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editingRole?: Role | null
  permissions: Record<string, Permission[]>
}

export default function RoleDialog({ open, onClose, onSaved, editingRole, permissions }: Props) {
  const [title, setTitle] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const normalizedPermissions = useMemo(() => {
    // Permissions are already grouped by module from the API
    // No need for deduplication since each module has unique actions
    return permissions
  }, [permissions])

  const getPermissionTitle = (module: string, permission: Permission) => {
    if (permission.title === `${module}.${permission.action}` || permission.title.includes('.')) {
      return permission.action
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    return permission.title
  }

  useEffect(() => {
    if (open) {
      if (editingRole) {
        setTitle(editingRole.title)
        setLoadingPermissions(true)
        fetch(`/api/roles/${editingRole.id}`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Failed to load role permissions')
            }
            const data = await response.json()
            const permissionIds: string[] = data?.role?.permissionIds ?? []
            setSelectedPermissions(new Set(permissionIds))
          })
          .catch(() => {
            toast.error('Failed to load role permissions')
            setSelectedPermissions(new Set())
          })
          .finally(() => {
            setLoadingPermissions(false)
          })
      } else {
        setTitle('')
        setSelectedPermissions(new Set())
        setLoadingPermissions(false)
      }
    } else {
      setLoadingPermissions(true)
    }
  }, [open, editingRole])

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    
    // Find which module this permission belongs to
    let targetModule: string | null = null
    let targetModulePermissions: Permission[] = []
    
    Object.entries(normalizedPermissions).forEach(([module, modulePermissions]) => {
      if (modulePermissions.some(p => p.id === permissionId)) {
        targetModule = module
        targetModulePermissions = modulePermissions
      }
    })
    
    if (checked) {
      newSelected.add(permissionId)
      
      // Special logic: If dashboard access is granted, grant access to all dashboard sections
      if (targetModule === 'dashboard' && permissionId.includes('dashboard') && targetModulePermissions.some(p => p.action === 'access' && p.id === permissionId)) {
        console.log('Dashboard access granted, auto-granting all module permissions')
        
        // Grant access to all module access permissions (financial, expenses, rentals, etc.)
        Object.entries(normalizedPermissions).forEach(([module, modulePermissions]) => {
          const accessPermission = modulePermissions.find((p: Permission) => p.action === 'access')
          if (accessPermission) {
            console.log(`Adding ${module} access permission: ${accessPermission.id}`)
            newSelected.add(accessPermission.id)
          }
        })
        
        // Also grant specific dashboard-related permissions
        Object.entries(normalizedPermissions).forEach(([module, modulePermissions]) => {
          // Grant financial overview permission
          if (module === 'financial') {
            const overviewPermission = modulePermissions.find((p: Permission) => p.action === 'overview')
            if (overviewPermission) {
              console.log(`Adding financial overview permission: ${overviewPermission.id}`)
              newSelected.add(overviewPermission.id)
            }
          }
        })
      }
      
      // Auto-check access permission for this module if it exists
      if (targetModulePermissions.length > 0) {
        const accessPermission = targetModulePermissions.find((p: Permission) => p.action === 'access')
        if (accessPermission) {
          newSelected.add(accessPermission.id)
        }
      }
    } else {
      newSelected.delete(permissionId)
      
      // Special logic: If dashboard access is removed, remove access to all dashboard sections
      if (targetModule === 'dashboard') {
        // Remove all module access permissions
        Object.entries(normalizedPermissions).forEach(([module, modulePermissions]) => {
          const accessPermission = modulePermissions.find((p: Permission) => p.action === 'access')
          if (accessPermission) {
            newSelected.delete(accessPermission.id)
          }
        })
        
        // Remove specific dashboard-related permissions
        Object.entries(normalizedPermissions).forEach(([module, modulePermissions]) => {
          if (module === 'financial') {
            const overviewPermission = modulePermissions.find((p: Permission) => p.action === 'overview')
            if (overviewPermission) {
              newSelected.delete(overviewPermission.id)
            }
          }
        })
      }
      
      // If unchecking access permission, uncheck all other permissions in this module
      if (targetModulePermissions.length > 0) {
        const accessPermission = targetModulePermissions.find((p: Permission) => p.action === 'access')
        if (accessPermission && permissionId === accessPermission.id) {
          // This is the access permission being unchecked, so uncheck all others
          targetModulePermissions.forEach((p: Permission) => {
            if (p.id !== accessPermission.id) {
              newSelected.delete(p.id)
            }
          })
        }
      }
    }
    setSelectedPermissions(newSelected)
  }

  const handleModuleToggle = (modulePermissions: Permission[], checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    modulePermissions.forEach((permission: Permission) => {
      if (checked) {
        newSelected.add(permission.id)
      } else {
        newSelected.delete(permission.id)
      }
    })
    setSelectedPermissions(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Role title is required')
      return
    }

    setLoading(true)

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles'
      const method = editingRole ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          permissionIds: Array.from(selectedPermissions)
        })
      })

      if (response.ok) {
        toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully')
        onSaved()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save role')
      }
    } catch (error) {
      toast.error('Error saving role')
    } finally {
      setLoading(false)
    }
  }

  const isModuleSelected = (modulePermissions: Permission[]) => {
    return modulePermissions.every(p => selectedPermissions.has(p.id))
  }

  const isModulePartiallySelected = (modulePermissions: Permission[]) => {
    const selectedCount = modulePermissions.filter(p => selectedPermissions.has(p.id)).length
    return selectedCount > 0 && selectedCount < modulePermissions.length
  }

  if (loadingPermissions) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Role Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter role title"
              disabled={editingRole?.is_owner}
              required
            />
            {editingRole?.is_owner && (
              <p className="text-sm text-muted-foreground">
                Owner role title cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(normalizedPermissions).map(([module, modulePermissions]) => (
                  <Card key={module}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm capitalize">{module}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Select all</Label>
                          <Checkbox
                            checked={isModuleSelected(modulePermissions)}
                            onCheckedChange={(checked) =>
                              handleModuleToggle(modulePermissions, checked as boolean)
                            }
                            disabled={editingRole?.is_owner}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked as boolean)
                            }
                            disabled={editingRole?.is_owner}
                          />
                          <div className="flex-1 space-y-1">
                            <Label 
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {getPermissionTitle(module, permission)}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedPermissions.size} permissions selected
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Settings } from 'lucide-react'
import { Prisma } from '@prisma/client'

type StaffWithRole = Prisma.staffGetPayload<{
  select: {
    id: true
    staff_id: true
    first_name: true
    last_name: true
    phone_number: true
    profile_thumb: true
    roles: {
      select: {
        title: true
      }
    }
  }
}> & {
  email?: string
  accountStatus?: 'Activated' | 'Pending'
}

interface RolePopupDialogProps {
  open: boolean
  onClose: () => void
  staff: StaffWithRole[]
  currentUserId?: string
}

export default function RolePopupDialog({ open, onClose, staff, currentUserId }: RolePopupDialogProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      // Small delay to show loading state, then set loading to false
      const timer = setTimeout(() => {
        setLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Find current user's role from the staff data
  const currentUserRole = useMemo(() => {
    if (!currentUserId) return 'No role assigned'
    
    const currentUser = staff.find(member => member.id === currentUserId)
    return currentUser?.roles?.title || 'No role assigned'
  }, [staff, currentUserId])

  const getRoleStats = () => {
    const roleCounts = staff.reduce((acc, member) => {
      const roleTitle = member.roles?.title || 'No Role'
      acc[roleTitle] = (acc[roleTitle] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(roleCounts).map(([role, count]) => ({ role, count }))
  }

  const getRoleDistribution = () => {
    const total = staff.length
    const roleCounts = getRoleStats()
    
    return roleCounts.map(({ role, count }) => ({
      role,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Role
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Roles & Permissions Overview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current User's Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Current Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{currentUserRole}</p>
                  <p className="text-sm text-muted-foreground">
                    This determines your access level in the system
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRoleDistribution().map(({ role, count }) => (
                  <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium">{role}</p>
                        <p className="text-sm text-muted-foreground">{count} staff member{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total staff: {staff.length} members
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

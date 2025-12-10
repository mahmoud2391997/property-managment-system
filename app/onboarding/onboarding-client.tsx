'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CustomInput from '@/components/costume-ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2Icon, Building2, User } from 'lucide-react'
import { createOrganization, completeStaffProfile } from './actions'
import { useRouter } from 'next/navigation'

export default function OnboardingClient() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [organizationData, setOrganizationData] = useState({
    title: '',
    type: '' as 'Owner' | 'Property_Manager' | '',
  })

  const [organizationId, setOrganizationId] = useState('')
  const [roleId, setRoleId] = useState('')

  const [staffData, setStaffData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  })

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organizationData.title.trim() || !organizationData.type) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    const result = await createOrganization(organizationData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.organizationId && result?.roleId) {
      setOrganizationId(result.organizationId)
      setRoleId(result.roleId)
      setStep(2)
      setLoading(false)
    }
  }

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!staffData.first_name.trim() || !staffData.phone_number.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    const result = await completeStaffProfile({
      ...staffData,
      organization_id: organizationId,
      role_id: roleId,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/properties`)
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6 gap-2">
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-slate-300'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-slate-300'}`} />
        </div>

        {/* Header icon */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground">
            {step === 1 ? <Building2 className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
        </div>

        {/* Step 1: Organization */}
        {step === 1 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
              <CardDescription>
                Create your organization to start managing properties
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleOrganizationSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Organization Name</Label>
                    <Input
                      id="title"
                      value={organizationData.title}
                      onChange={(e) => setOrganizationData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Acme Property Management"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Organization Type</Label>
                    <Select
                      value={organizationData.type}
                      onValueChange={(value) => setOrganizationData(prev => ({ ...prev, type: value as 'Owner' | 'Property_Manager' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owner">Property Owner</SelectItem>
                        <SelectItem value="Property_Manager">Property Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the type that best describes your organization
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-red-600 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading || !organizationData.title || !organizationData.type}
                >
                  {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Staff Profile */}
        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <CardDescription>
                Add your staff details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleStaffSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={staffData.first_name}
                      onChange={(e) => setStaffData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={staffData.last_name}
                      onChange={(e) => setStaffData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <CustomInput
                      phoneNumber
                      value={staffData.phone_number}
                      onChange={(phone) => setStaffData(prev => ({ ...prev, phone_number: phone }))}
                      className="bg-background! border-input! h-9! rounded-md!"
                    />
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Organization:</span> {organizationData.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Role:</span> Admin
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-red-600 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading || !staffData.first_name || !staffData.phone_number}
                >
                  {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
                  {loading ? 'Completing...' : 'Complete Setup'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

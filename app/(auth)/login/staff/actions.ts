'use server'

import { login as mainLogin } from '@/app/(auth)/login/actions'

// Staff login uses the same unified login action
export async function login(formData: FormData): Promise<string | void> {
  return mainLogin(formData)
}

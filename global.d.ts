interface SupabaseClient {
  auth: {
    getUser(): Promise<{ data: { user: any } | null; error: any }>
    getSession(): Promise<{ data: { session: any } | null; error: any }>
    signOut(): Promise<{ error: any }>
    setSession(params: { access_token: string; refresh_token: string }): Promise<{ error: any }>
    resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ data: any; error: any }>
  }
  channel(name: string): any
  removeChannel(channel: any): void
}

interface PrismaClient {
  [key: string]: any
}

declare const supabase: SupabaseClient
declare const prisma: PrismaClient

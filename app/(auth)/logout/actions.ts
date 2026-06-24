'use server';

import { redirect } from 'next/navigation';

export async function logout(redirectPath: string = '/login') {
    // Demo mode: No backend authentication to clear
    // Simply redirect to login page
    redirect(redirectPath);
}

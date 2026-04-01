'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setActiveProject(projectId: string) {
  cookies().set('ledgerly_project_id', projectId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  revalidatePath('/', 'layout')
}

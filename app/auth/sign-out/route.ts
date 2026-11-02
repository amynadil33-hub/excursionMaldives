import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, cookieOptions } from '@/lib/supabase/config'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url), 303)
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Cookie expiry below still signs this browser out if Supabase is unavailable.
  }

  // Clear every chunk of this project's session cookie even if the remote
  // logout request fails or the stored session is already invalid.
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  const authCookiePrefix = `sb-${projectRef}-auth-token`
  request.cookies.getAll().forEach(({ name }) => {
    if (name === authCookiePrefix || name.startsWith(`${authCookiePrefix}.`)) {
      response.cookies.set(name, '', {
        ...cookieOptions,
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      })
    }
  })

  return response
}

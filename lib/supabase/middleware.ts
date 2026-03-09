import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoginPage = pathname.startsWith('/login');
    const isPublicPath = pathname.startsWith('/auth') || pathname.startsWith('/_next') || pathname.startsWith('/api');

    // ── DEMO MODE: check for the demo auth cookie first ──
    // If it's set, allow everything through without hitting Supabase
    const demoCookie = request.cookies.get('allegra_auth_demo');
    if (demoCookie?.value === 'true') {
        // If they're on login while already auth'd in demo mode, redirect to dashboard
        if (isLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
        return NextResponse.next({ request });
    }

    // ── SUPABASE MODE: try the real session ──
    let supabaseResponse = NextResponse.next({ request });

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({ request })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isLoginPage && !isPublicPath) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        if (user && isLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

    } catch {
        // If Supabase is misconfigured or throws (e.g. no env vars),
        // don't crash the app — just redirect to login for protected routes
        if (!isLoginPage && !isPublicPath) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

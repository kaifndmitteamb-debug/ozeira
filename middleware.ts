import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  // In production, this would check a Supabase session cookie
  // For demo mode, the admin layout component handles client-side auth checking
  if (pathname.startsWith('/admin')) {
    // Check for auth cookie (when Supabase is configured)
    const supabaseAuth = request.cookies.get('sb-access-token')?.value;
    
    // In demo mode, we rely on client-side auth context
    // In production, we'd validate the JWT here
    // For now, let the request through and let the admin layout handle auth
  }

  // Security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Emergency cookie reset — accessible even during HTTP 431 loops
 * because it only runs a tiny script with no auth checks.
 * Visit: http://localhost:3000/api/reset
 */
export async function GET(request: NextRequest) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Resetting Session — Verified Hub</title>
  <style>
    body { margin: 0; background: #09090b; color: #fff; font-family: system-ui, sans-serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { text-align: center; }
    h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p  { color: #9ca3af; font-size: 0.875rem; }
  </style>
  <script>
    // Nuke every cookie this domain has ever set
    function clearAll() {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var name = cookies[i].split('=')[0].trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost';
      }
      try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
      window.location.replace('/');
    }
    window.onload = clearAll;
  </script>
</head>
<body>
  <div class="box">
    <h2>Clearing your session…</h2>
    <p>You will be redirected automatically.</p>
  </div>
</body>
</html>`

  // Build the response with all cookies cleared in headers too
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })

  // Clear every auth-related cookie via Set-Cookie headers
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    res.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  return res
}

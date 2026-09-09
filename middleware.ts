import { NextRequest, NextResponse } from "next/server";

// HTTP Basic Auth gate for /admin — set ADMIN_PASSWORD to enable. No login
// page, no session/cookie plumbing; the browser's native basic-auth prompt
// covers it.
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Admin dashboard disabled — set ADMIN_PASSWORD.", { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const providedPassword = auth?.startsWith("Basic ")
    ? Buffer.from(auth.slice(6), "base64").toString().split(":")[1]
    : undefined;
  if (providedPassword !== password) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="admin"' },
    });
  }

  return NextResponse.next();
}

export const config = { matcher: "/admin/:path*" };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  );
}

function checkBasicAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const base64 = authHeader.slice(6);
  let decoded: string;
  try {
    decoded = atob(base64);
  } catch {
    return false;
  }
  const [user, pass] = decoded.split(":", 2);
  const expectedUser = process.env.ADMIN_BASIC_USER;
  const expectedPass = process.env.ADMIN_BASIC_PASSWORD;

  if (!expectedUser || !expectedPass) return false;
  return user === expectedUser && pass === expectedPass;
}

export function middleware(req: NextRequest) {
  if (!isAdminPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (checkBasicAuth(req)) {
    return NextResponse.next();
  }

  return new NextResponse("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin panel"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

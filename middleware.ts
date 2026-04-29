import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicPaths.some((prefix) => path.startsWith(prefix));

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (token && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};



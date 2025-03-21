import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  console.log("Middleware triggered for path:", request.nextUrl.pathname); // Debug log

  // Skip middleware for public routes
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    console.log("Skipping middleware for auth route"); // Debug log
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  console.log("Auth Header:", authHeader); // Debug log

  const token = authHeader?.split(" ")[1];
  console.log("Token:", token); // Debug log

  if (!token) {
    console.log("No token found"); // Debug log
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    console.log("JWT_SECRET:", process.env.JWT_SECRET); // Debug log

    // Convert JWT_SECRET to Uint8Array for jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);
    console.log("Decoded token:", payload); // Debug log

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("user", JSON.stringify(payload));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error); // Debug log
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/tasks/:path*", "/api/tasks"],
};

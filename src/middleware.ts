import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for middleware
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function middleware(request: NextRequest) {
  console.log("Middleware triggered for path:", request.nextUrl.pathname); // Debug log

  // Skip middleware for public routes
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    console.log("Skipping middleware for auth route"); // Debug log
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  console.log("Auth Header:", authHeader); // Debug log

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Invalid authorization header format"); // Debug log
    return NextResponse.json({ error: "Invalid authorization header format" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token:", token); // Debug log

  if (!token) {
    console.log("No token found"); // Debug log
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError); // Debug log

      // Check if the error is due to token expiration
      if (authError.message.includes("expired")) {
        // Get the refresh token from the cookie
        const refreshToken = request.cookies.get("refresh_token")?.value;
        if (!refreshToken) {
          return NextResponse.json({ error: "Token expired and no refresh token found" }, { status: 401 });
        }

        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError || !session) {
          return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
        }

        // Update the request with the new access token
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
        requestHeaders.set(
          "user",
          JSON.stringify({
            userId: session.user.id,
          })
        );

        // Return response with new token
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // Set the new access token in the response headers
        response.headers.set("x-new-access-token", session.access_token);

        // Update the refresh token cookie
        response.cookies.set({
          name: "refresh_token",
          value: session.refresh_token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        return response;
      }

      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("Authenticated user:", {
      id: user.id,
      email: user.email,
    }); // Debug log

    // Clone the request headers and add the user info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "user",
      JSON.stringify({
        userId: user.id,
      })
    );

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error); // Debug log
    return NextResponse.json(
      { error: "Invalid token", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/tasks/:path*", "/api/tasks"],
};

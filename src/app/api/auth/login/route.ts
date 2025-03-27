import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    console.log("Login attempt for email:", email); // Debug log

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Auth error:", authError); // Debug log
      return NextResponse.json({ error: "Invalid credentials", details: authError.message }, { status: 401 });
    }

    if (!authData.session) {
      console.error("No session returned from auth"); // Debug log
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    console.log("Login successful for user:", authData.user.id); // Debug log

    // Create the response with user data and access token
    const response = NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: authData.user.user_metadata?.first_name,
        last_name: authData.user.user_metadata?.last_name,
      },
      session: {
        access_token: authData.session.access_token,
        expires_at: authData.session.expires_at,
      },
    });

    // Set the refresh token as an HTTP-only cookie
    response.cookies.set({
      name: "refresh_token",
      value: authData.session.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Error in login:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

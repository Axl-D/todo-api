import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refresh_token } = refreshSchema.parse(body);

    // Use the refresh token to get a new session
    const {
      data: { session },
      error: refreshError,
    } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError) {
      console.error("Refresh error:", refreshError);
      return NextResponse.json({ error: "Invalid refresh token", details: refreshError.message }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "No session returned" }, { status: 401 });
    }

    // Return the new session data
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Error in refresh:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

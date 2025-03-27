import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name } = registerSchema.parse(body);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Failed to create user", details: authError.message }, { status: 400 });
    }

    // Return success without sensitive data
    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        first_name: authData.user?.user_metadata?.first_name,
        last_name: authData.user?.user_metadata?.last_name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Error in register:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

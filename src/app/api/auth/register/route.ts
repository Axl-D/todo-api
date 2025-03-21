import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { supabase } from "@/lib/supabase";

const registerSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name } = registerSchema.parse(body);

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          role: "user",
          first_name,
          last_name,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

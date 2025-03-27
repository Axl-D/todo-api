import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";

// Validation schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().datetime().optional(),
});

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Get the authenticated user from the middleware
    const user = JSON.parse(request.headers.get("user") || "{}");
    console.log("Authenticated user in GET:", user); // Debug log

    if (!user.userId) {
      console.log("No user ID found in request headers"); // Debug log
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build the query - RLS will handle access control
    let query = supabase.from("tasks").select("*", { count: "exact" });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end).order("created_at", { ascending: false });

    const { data: tasks, error: fetchError, count } = await query;

    if (fetchError) {
      console.error("Error fetching tasks:", fetchError); // Debug log
      throw fetchError;
    }

    return NextResponse.json({
      tasks,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error("Error in GET /api/tasks:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from the middleware
    const user = JSON.parse(request.headers.get("user") || "{}");
    console.log("Authenticated user in POST:", user); // Debug log

    if (!user.userId) {
      console.log("No user ID found in request headers"); // Debug log
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body); // Debug log

    const taskData = createTaskSchema.parse(body);
    console.log("Validated task data:", taskData); // Debug log

    // Insert the task - created_by will be set automatically by the database
    const { data: task, error: createError } = await supabase.from("tasks").insert([taskData]).select().single();

    if (createError) {
      console.error("Error creating task:", createError); // Debug log
      console.error("Error details:", {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
      });
      throw createError;
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Validation error:", err.errors); // Debug log
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Error in POST /api/tasks:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

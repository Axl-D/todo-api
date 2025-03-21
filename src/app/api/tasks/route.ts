import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

// Validation schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().datetime().optional(),
});

// GET /api/tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Get the authenticated user from the middleware
    const user = JSON.parse(request.headers.get("user") || "{}");

    // Build the query
    let query = supabase.from("tasks").select("*", { count: "exact" });

    // Only filter by created_by if user is not an admin
    if (user.role !== "admin") {
      query = query.eq("created_by", user.userId);
    }

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

    if (fetchError) throw fetchError;

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = JSON.parse(request.headers.get("user") || "{}");

    const taskData = createTaskSchema.parse(body);

    const { data: task, error: createError } = await supabase
      .from("tasks")
      .insert([
        {
          ...taskData,
          created_by: user.userId,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Error in POST /api/tasks:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

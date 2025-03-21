import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

// Validation schema for task updates
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.string().datetime().optional(),
});

// GET /api/tasks/:id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = JSON.parse(request.headers.get("user") || "{}");
    const taskId = params.id;

    // Build the query
    let query = supabase.from("tasks").select("*").eq("id", taskId);

    // Only filter by created_by if user is not an admin
    if (user.role !== "admin") {
      query = query.eq("created_by", user.userId);
    }

    const { data: task, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tasks/:id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const user = JSON.parse(request.headers.get("user") || "{}");
    const taskId = params.id;

    // Build the query to check task existence and ownership
    let query = supabase.from("tasks").select("id").eq("id", taskId);

    // Only filter by created_by if user is not an admin
    if (user.role !== "admin") {
      query = query.eq("created_by", user.userId);
    }

    const { data: existingTask, error: fetchError } = await query.single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      throw fetchError;
    }

    const taskData = updateTaskSchema.parse(body);

    const { data: task, error } = await supabase
      .from("tasks")
      .update({
        ...taskData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = JSON.parse(request.headers.get("user") || "{}");
    const taskId = params.id;

    // Build the query to check task existence and ownership
    let query = supabase.from("tasks").select("id").eq("id", taskId);

    // Only filter by created_by if user is not an admin
    if (user.role !== "admin") {
      query = query.eq("created_by", user.userId);
    }

    const { data: existingTask, error: fetchError } = await query.single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      throw fetchError;
    }

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

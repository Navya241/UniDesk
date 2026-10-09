import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageDepartments } from "@/lib/rbac";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { staffMembers: true, tickets: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageDepartments(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, defaultCategory } = body;

    const dept = await prisma.department.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        description,
        defaultCategory,
      },
    });

    return NextResponse.json({ success: true, department: dept });
  } catch (error: any) {
    console.error("POST /api/departments error:", error);
    return NextResponse.json({ error: error.message || "Failed to create department" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageDepartments(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, defaultCategory } = body;

    const dept = await prisma.department.update({
      where: { id },
      data: { name, description, defaultCategory },
    });

    return NextResponse.json({ success: true, department: dept });
  } catch (error: any) {
    console.error("PATCH /api/departments error:", error);
    return NextResponse.json({ error: error.message || "Failed to update department" }, { status: 500 });
  }
}

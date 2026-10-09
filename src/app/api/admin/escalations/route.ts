import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageEscalation } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageEscalation(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const configs = await prisma.escalationConfig.findMany({
      orderBy: { category: "asc" },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("GET /api/admin/escalations error:", error);
    return NextResponse.json({ error: "Failed to fetch escalation settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageEscalation(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { category, lowHours, mediumHours, highHours, urgentHours, notifyAdmin } = body;

    const updated = await prisma.escalationConfig.upsert({
      where: { category },
      update: {
        lowHours: Number(lowHours),
        mediumHours: Number(mediumHours),
        highHours: Number(highHours),
        urgentHours: Number(urgentHours),
        notifyAdmin: Boolean(notifyAdmin),
      },
      create: {
        category,
        lowHours: Number(lowHours),
        mediumHours: Number(mediumHours),
        highHours: Number(highHours),
        urgentHours: Number(urgentHours),
        notifyAdmin: Boolean(notifyAdmin),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/escalations error:", error);
    return NextResponse.json({ error: error.message || "Failed to update escalation settings" }, { status: 500 });
  }
}

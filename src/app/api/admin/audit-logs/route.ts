import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const history = await prisma.ticketHistory.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, role: true, email: true } },
        ticket: { select: { id: true, ticketNumber: true, title: true, isAnonymous: true } },
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit trail" }, { status: 500 });
  }
}

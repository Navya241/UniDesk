import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runEscalationCheck } from "@/lib/escalation";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Allow admin or cron / local trigger
    if (user && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await runEscalationCheck();
    return NextResponse.json({
      success: true,
      message: `Escalation engine checked. Found ${result.escalatedCount} overdue ticket(s).`,
      ...result,
    });
  } catch (error: any) {
    console.error("Escalation check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute SLA escalation check" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageFAQs } from "@/lib/rbac";
import { z } from "zod";

const FAQSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  category: z.enum(["HOSTEL", "ACADEMICS", "IT", "LIBRARY", "ADMINISTRATION", "OTHER"]),
  isPublished: z.boolean().default(true),
  order: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (user?.role !== "ADMIN") {
      where.isPublished = true;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("GET /api/faqs error:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageFAQs(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin permissions required." }, { status: 403 });
    }

    const body = await req.json();
    const result = FAQSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: result.data,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error("POST /api/faqs error:", error);
    return NextResponse.json({ error: error.message || "Failed to create FAQ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageFAQs(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin permissions required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    const updated = await prisma.fAQ.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (error: any) {
    console.error("PATCH /api/faqs error:", error);
    return NextResponse.json({ error: error.message || "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageFAQs(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin permissions required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
    }

    await prisma.fAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/faqs error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete FAQ" }, { status: 500 });
  }
}

import { TicketCategory } from "@/types";
import { prisma } from "@/lib/prisma";

export const CATEGORY_DEPARTMENT_MAP: Record<TicketCategory, string> = {
  HOSTEL: "HOSTEL",
  ACADEMICS: "ACAD",
  IT: "IT",
  LIBRARY: "LIB",
  ADMINISTRATION: "ADMIN",
  OTHER: "GEN",
};

export async function resolveDepartmentForCategory(category: TicketCategory): Promise<string> {
  const targetCode = CATEGORY_DEPARTMENT_MAP[category] || "GEN";
  const department = await prisma.department.findUnique({
    where: { code: targetCode },
  });

  if (department) {
    return department.id;
  }

  // Fallback to any department or create default
  const fallback = await prisma.department.findFirst();
  if (fallback) return fallback.id;

  throw new Error("No department configured in the system. Please run database seed.");
}

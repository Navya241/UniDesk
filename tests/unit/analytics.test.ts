import { describe, it, expect } from "vitest";
import { getAnalyticsMetrics } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

describe("Analytics Calculation Engine", () => {
  it("calculates total counts and mathematical resolution rates accurately", async () => {
    const metrics = await getAnalyticsMetrics();

    expect(metrics.totalTickets).toBeGreaterThanOrEqual(5);
    expect(metrics.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(metrics.resolutionRate).toBeLessThanOrEqual(100);

    // Verify mathematical integrity: resolutionRate = ((resolved + closed) / total) * 100
    const expectedRate = Math.round(
      ((metrics.resolvedTickets + metrics.closedTickets) / metrics.totalTickets) * 100
    );
    expect(metrics.resolutionRate).toBe(expectedRate);

    // Verify departments and categories exist in data
    expect(metrics.ticketsByCategory.length).toBe(6);
    expect(metrics.ticketsByPriority.length).toBe(4);
    expect(metrics.ticketsByDepartment.length).toBeGreaterThanOrEqual(1);
  });
});

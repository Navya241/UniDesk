import { describe, it, expect } from "vitest";
import { CATEGORY_DEPARTMENT_MAP } from "@/lib/routing";

describe("Category to Department Mapping", () => {
  it("maps categories correctly to university department codes", () => {
    expect(CATEGORY_DEPARTMENT_MAP.IT).toBe("IT");
    expect(CATEGORY_DEPARTMENT_MAP.HOSTEL).toBe("HOSTEL");
    expect(CATEGORY_DEPARTMENT_MAP.ACADEMICS).toBe("ACAD");
    expect(CATEGORY_DEPARTMENT_MAP.LIBRARY).toBe("LIB");
    expect(CATEGORY_DEPARTMENT_MAP.ADMINISTRATION).toBe("ADMIN");
    expect(CATEGORY_DEPARTMENT_MAP.OTHER).toBe("GEN");
  });
});

import { TicketCategory } from "@/types";

export interface CategorySuggestion {
  category: TicketCategory;
  categoryLabel: string;
  matchedKeywords: string[];
}

const KEYWORD_DICTIONARY: Record<TicketCategory, { label: string; keywords: string[] }> = {
  IT: {
    label: "IT Support",
    keywords: [
      "wifi", "wi-fi", "network", "computer", "password", "login", "internet",
      "lan", "server", "portal", "software", "laptop", "vpn", "email", "printer", "ip", "dns", "screen"
    ],
  },
  HOSTEL: {
    label: "Hostel Department",
    keywords: [
      "hostel", "room", "mess", "food", "accommodation", "warden", "geyser",
      "plumbing", "plumber", "water", "bed", "bathroom", "cleaning", "fan", "switchboard", "leakage"
    ],
  },
  ACADEMICS: {
    label: "Academic Affairs",
    keywords: [
      "course", "exam", "marks", "faculty", "timetable", "grade", "syllabus",
      "professor", "attendance", "re-evaluation", "curriculum", "semester", "credits", "cgpa", "sgpa"
    ],
  },
  LIBRARY: {
    label: "Library Services",
    keywords: [
      "book", "return", "issue", "library", "journal", "fine", "borrow",
      "catalog", "reading room", "thesis", "ieee", "springer", "ebook", "shelf"
    ],
  },
  ADMINISTRATION: {
    label: "Administration",
    keywords: [
      "certificate", "office", "document", "administration", "fees", "scholarship",
      "transcript", "bonafide", "id card", "challan", "refund", "bus", "transport", "security"
    ],
  },
  OTHER: {
    label: "General Support",
    keywords: ["general", "feedback", "inquiry", "help", "query", "complaint"],
  },
};

export function suggestCategoryFromText(text: string): CategorySuggestion | null {
  if (!text || text.trim().length < 3) return null;

  const normalized = text.toLowerCase();
  // Tokenize words
  const words = normalized.split(/[\s,.;:!?()\[\]{}"'\\/\-_]+/);

  let bestCategory: TicketCategory | null = null;
  let maxMatches = 0;
  let bestMatchedKeywords: string[] = [];

  for (const [catKey, { keywords }] of Object.entries(KEYWORD_DICTIONARY)) {
    const category = catKey as TicketCategory;
    if (category === "OTHER") continue;

    const matched: string[] = [];
    for (const kw of keywords) {
      if (kw.includes(" ")) {
        if (normalized.includes(kw)) {
          matched.push(kw);
        }
      } else {
        if (words.includes(kw) || normalized.includes(kw)) {
          matched.push(kw);
        }
      }
    }

    if (matched.length > maxMatches) {
      maxMatches = matched.length;
      bestCategory = category;
      bestMatchedKeywords = matched;
    }
  }

  if (bestCategory && maxMatches > 0) {
    return {
      category: bestCategory,
      categoryLabel: KEYWORD_DICTIONARY[bestCategory].label,
      matchedKeywords: bestMatchedKeywords,
    };
  }

  return null;
}

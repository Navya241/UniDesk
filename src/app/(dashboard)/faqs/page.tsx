"use client";

import * as React from "react";
import { TicketCategory, SessionUser } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  HelpCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: TicketCategory;
  isPublished: boolean;
  order: number;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = React.useState<FAQItem[]>([]);
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // Admin Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingFaq, setEditingFaq] = React.useState<FAQItem | null>(null);
  const [formQuestion, setFormQuestion] = React.useState("");
  const [formAnswer, setFormAnswer] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<TicketCategory>("IT");
  const [formPublished, setFormPublished] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchFaqs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);

      const [faqsRes, meRes] = await Promise.all([
        fetch(`/api/faqs?${params.toString()}`),
        fetch("/api/auth/me"),
      ]);

      if (faqsRes.ok) {
        const data = await faqsRes.json();
        setFaqs(data.faqs || []);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory]);

  React.useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory("IT");
    setFormPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category);
    setFormPublished(faq.isPublished);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formQuestion.trim() || !formAnswer.trim()) return;
    setIsSaving(true);
    try {
      if (editingFaq) {
        await fetch("/api/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingFaq.id,
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
            category: formCategory,
            isPublished: formPublished,
          }),
        });
      } else {
        await fetch("/api/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
            category: formCategory,
            isPublished: formPublished,
          }),
        });
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error("Failed to save FAQ:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ entry?")) return;
    try {
      await fetch(`/api/faqs?id=${id}`, { method: "DELETE" });
      fetchFaqs();
    } catch (err) {
      console.error("Failed to delete FAQ:", err);
    }
  };

  const categories = ["ALL", "IT", "HOSTEL", "ACADEMICS", "LIBRARY", "ADMINISTRATION", "OTHER"];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <HelpCircle className="h-7 w-7 text-primary" />
            <span>Campus Knowledge Base & FAQs</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Instant self-service answers to frequently asked campus and department queries
          </p>
        </div>

        {currentUser?.role === "ADMIN" && (
          <Button size="sm" variant="primary" onClick={handleOpenAddModal} className="font-semibold shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add FAQ</span>
          </Button>
        )}
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search keywords, solutions, Wi-Fi guide, hostel rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full pl-10 pr-4 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat === "ALL" ? "All Categories" : CATEGORY_LABELS[cat as TicketCategory] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs Accordion */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground">Loading FAQs...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base text-foreground">No FAQs Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search ? "No questions matched your search criteria." : "No FAQs created for this category yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="group rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 transition-colors"
            >
              <details className="group/details">
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                      {CATEGORY_LABELS[faq.category] || faq.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover/details:text-primary transition-colors">
                      {faq.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    {currentUser?.role === "ADMIN" && (
                      <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(faq)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                          title="Edit FAQ"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open/details:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/40 whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Admin FAQ Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? "Edit FAQ Article" : "Create New FAQ Article"}
        description="Provide a clear, helpful answer to recurring student & faculty questions."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Question / Issue Title *"
            placeholder="e.g. How to access institutional IEEE digital library from off-campus?"
            value={formQuestion}
            onChange={(e) => setFormQuestion(e.target.value)}
            required
          />

          <Textarea
            label="Comprehensive Answer / Resolution Steps *"
            placeholder="Provide exact step-by-step guidance, URLs, and prerequisites..."
            rows={5}
            value={formAnswer}
            onChange={(e) => setFormAnswer(e.target.value)}
            required
          />

          <Select
            label="Category *"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
            options={[
              { value: "IT", label: "IT Support" },
              { value: "HOSTEL", label: "Hostel Department" },
              { value: "ACADEMICS", label: "Academic Affairs" },
              { value: "LIBRARY", label: "Library Services" },
              { value: "ADMINISTRATION", label: "Administration" },
              { value: "OTHER", label: "General Support" },
            ]}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="faq-published"
              checked={formPublished}
              onChange={(e) => setFormPublished(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="faq-published" className="text-xs font-semibold text-foreground">
              Publish immediately (visible to students & faculty)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
              Save Article
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

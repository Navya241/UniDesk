"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { suggestCategoryFromText } from "@/lib/categorization";
import { TicketCategory, TicketPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Sparkles,
  Paperclip,
  Upload,
  X,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from "lucide-react";

export default function CreateTicketPage() {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<TicketCategory>("IT");
  const [priority, setPriority] = React.useState<TicketPriority>("MEDIUM");
  const [isAnonymous, setIsAnonymous] = React.useState(false);

  const [attachments, setAttachments] = React.useState<
    Array<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }>
  >([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [categorySuggestion, setCategorySuggestion] = React.useState<{
    category: TicketCategory;
    categoryLabel: string;
    matchedKeywords: string[];
  } | null>(null);

  // Trigger keyword suggestion as user types title or description
  React.useEffect(() => {
    const combinedText = `${title} ${description}`;
    const suggestion = suggestCategoryFromText(combinedText);
    if (suggestion && suggestion.category !== category) {
      setCategorySuggestion(suggestion);
    } else {
      setCategorySuggestion(null);
    }
  }, [title, description, category]);

  const handleApplySuggestion = () => {
    if (categorySuggestion) {
      setCategory(categorySuggestion.category);
      setCategorySuggestion(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError(`File "${file.name}" is larger than 5MB limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.file) {
          setAttachments((prev) => [...prev, data.file]);
        } else {
          setError(data.error || "Failed to upload attachment");
        }
      }
    } catch {
      setError("An error occurred during file upload.");
    } finally {
      setIsUploading(false);
      // Reset input value
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.trim().length < 5) {
      setError("Please provide a descriptive title (at least 5 characters).");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please provide complete details in the description (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          isAnonymous,
          attachments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create ticket.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/tickets/${data.ticket.id}`);
    } catch {
      setError("Network error while submitting ticket. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/tickets" className="hover:text-primary transition-colors">
              Tickets
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">New Ticket</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Submit Support & Grievance Request
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Fill in the details below. Our routing engine will dispatch your ticket to the responsible department.
          </p>
        </div>

        <Link href="/faqs">
          <Button variant="outline" size="sm" className="text-xs">
            <HelpCircle className="h-4 w-4 mr-1.5 text-primary" />
            <span>Search FAQs First</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          {/* Title */}
          <div>
            <Input
              label="Issue Title / Summary *"
              id="title"
              placeholder="e.g. Wi-Fi dropping in Computer Lab 3 or Hostel Room 204 Geyser not heating"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Detailed Problem Description *"
              id="description"
              placeholder="Describe the issue in detail. Include locations, equipment IDs, error messages, or previous ticket references..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Keyword Category Suggestion Pill */}
          {categorySuggestion && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Sparkles className="h-4 w-4 shrink-0 animate-spin" />
                <span>
                  Suggested Department: <strong>{categorySuggestion.categoryLabel}</strong> (matched: &ldquo;{categorySuggestion.matchedKeywords.join(", ")}&rdquo;)
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
              >
                Apply Suggestion
              </button>
            </div>
          )}

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Select
                label="Department / Category *"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                options={[
                  { value: "IT", label: "IT Support (Wi-Fi, Lab PCs, Portal, Hardware)" },
                  { value: "HOSTEL", label: "Hostel Department (Room, Plumbing, Mess Food, Warden)" },
                  { value: "ACADEMICS", label: "Academic Affairs (Exams, Grades, Curriculum, Courses)" },
                  { value: "LIBRARY", label: "Library Services (Books, Journals, Archives, Subscriptions)" },
                  { value: "ADMINISTRATION", label: "Administration (Fees, Certificates, Security, Estate)" },
                  { value: "OTHER", label: "Other / General Campus Support" },
                ]}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Auto-routed to the corresponding university department.
              </p>
            </div>

            <div>
              <Select
                label="Priority Level *"
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                options={[
                  { value: "LOW", label: "Low (General inquiry, SLA 72h)" },
                  { value: "MEDIUM", label: "Medium (Standard issue, SLA 48h)" },
                  { value: "HIGH", label: "High (Significant disruption, SLA 24h)" },
                  { value: "URGENT", label: "Urgent (Critical failure / Emergency, SLA 12h)" },
                ]}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Sets SLA target resolution timeframe and escalation triggers.
              </p>
            </div>
          </div>

          {/* Anonymous Reporting Toggle */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3">
            <div className="pt-0.5">
              <input
                type="checkbox"
                id="anonymous-toggle"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="anonymous-toggle"
                className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-primary" />
                Submit as Anonymous Grievance
              </label>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                When enabled, ordinary department staff will NOT see your name, email, or profile. Your identity is scrubbed from API outputs and internal URLs.
              </p>
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Attachments (Screenshots, Receipts, Logs)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                <span>{isUploading ? "Uploading..." : "Upload File (Max 5MB)"}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,.docx,.doc"
                  multiple
                />
              </label>
              <span className="text-[11px] text-muted-foreground">
                Supported formats: PNG, JPG, PDF, DOCX, TXT
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">{att.fileName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({(att.fileSize / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/tickets">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="font-bold shadow-lg shadow-primary/20 px-8"
          >
            <span>Submit Ticket</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

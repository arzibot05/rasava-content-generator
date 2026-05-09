"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Search } from "lucide-react";
import GenerateForm from "@/components/GenerateForm";
import ContentCard from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

function HomeContent() {
  const [activeTab, setActiveTab] = useState<"generate" | "gallery">("generate");
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["contents"],
    queryFn: async () => {
      const res = await fetch("/api/content");
      const data = await res.json();
      return data.contents || [] as any[];
    },
  });

  const contents = data || [];

  const filtered = contents.filter((c: any) => {
    const matchSearch = c.caption.toLowerCase().includes(search.toLowerCase());
    const matchFormat = formatFilter === "ALL" || c.format === formatFilter;
    return matchSearch && matchFormat;
  });

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-white border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-brand-navy">Rasava</h1>
                <p className="text-xs text-brand-slate">Content Generator</p>
              </div>
            </div>

            {/* Nav tabs */}
            <div className="flex gap-1 bg-brand-bg rounded-xl p-1">
              <button
                onClick={() => setActiveTab("generate")}
                className={cn(
                  "px-5 py-2 rounded-lg font-medium text-sm transition-all",
                  activeTab === "generate"
                    ? "bg-brand-orange text-white shadow-sm"
                    : "text-brand-slate hover:text-brand-navy"
                )}
              >
                ✨ Generate
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={cn(
                  "px-5 py-2 rounded-lg font-medium text-sm transition-all",
                  activeTab === "gallery"
                    ? "bg-brand-orange text-white shadow-sm"
                    : "text-brand-slate hover:text-brand-navy"
                )}
              >
                🗂️ Gallery
                <span className="ml-1.5 text-xs opacity-70">({contents.length})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "generate" ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6">
              <h2 className="text-lg font-bold text-brand-navy mb-6">Create New Content</h2>
              <GenerateForm />
            </div>

            {/* Right: Recent */}
            <div>
              <h2 className="text-lg font-bold text-brand-navy mb-4">Recent</h2>
              {isLoading ? (
                <div className="bg-white rounded-2xl border border-brand-border p-8 text-center text-brand-slate">
                  Loading...
                </div>
              ) : contents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border p-8 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-brand-slate">No content yet. Start generating!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contents.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="bg-white rounded-xl border border-brand-border p-3 flex gap-4 hover:shadow-sm transition-all">
                      <div className={cn(
                        "relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0",
                        c.format === "SQUARE" ? "w-20 h-20" : c.format === "PORTRAIT" ? "w-16 h-20" : "w-14 h-20"
                      )}>
                        <Image src={c.imageUrl} alt="Thumbnail" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-navy line-clamp-2">{c.caption}</p>
                        <p className="text-xs text-brand-muted mt-1">{c.format}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Gallery */
          <div>
            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search captions..."
                  className="w-full pl-10 pr-4 py-3 rounded-full border border-brand-border bg-white text-brand-navy placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                />
              </div>
              <div className="flex gap-2">
                {["ALL", "SQUARE", "PORTRAIT", "STORY"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormatFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      formatFilter === f
                        ? "bg-brand-orange text-white"
                        : "bg-white border border-brand-border text-brand-slate hover:border-brand-orange"
                    )}
                  >
                    {f === "ALL" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="text-center py-20 text-brand-slate">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-brand-slate">
                  {search || formatFilter !== "ALL" ? "No results found" : "Gallery empty. Create your first content!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((content: any) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeContent />
    </QueryClientProvider>
  );
}
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Copy, Download, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Content = {
  id: string;
  caption: string;
  imageUrl: string;
  format: string;
  createdAt: string;
};

export default function ContentCard({ content }: { content: Content }) {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/content/${content.id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(content.caption);
    setShowMenu(false);
  };

  const handleDownloadCaption = () => {
    const blob = new Blob([content.caption], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caption-${content.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const aspectClass: Record<string, string> = {
    SQUARE: "aspect-square",
    PORTRAIT: "aspect-[4/5]",
    STORY: "aspect-[9/16]",
  };

  const formatLabel: Record<string, string> = {
    SQUARE: "1:1",
    PORTRAIT: "4:5",
    STORY: "9:16",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden hover:shadow-md transition-all animate-fade-in group">
      {/* Image */}
      <div className="relative bg-gray-100">
        <div className={cn("mx-auto", aspectClass[content.format] || "aspect-square", content.format !== "SQUARE" ? (content.format === "PORTRAIT" ? "max-w-[80%]" : "max-w-[60%]") : "")}>
          <div className={cn("relative w-full", aspectClass[content.format] || "aspect-square")}>
            <Image src={content.imageUrl} alt="Content" fill className="object-cover" />
          </div>
        </div>
        {/* Format badge */}
        <div className="absolute top-3 left-3 bg-brand-navy/70 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
          {formatLabel[content.format] || "1:1"}
        </div>
        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={handleCopy}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-navy hover:bg-white transition-all shadow-sm"
            title="Copy caption"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadCaption}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-navy hover:bg-white transition-all shadow-sm"
            title="Download caption"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-navy hover:bg-white transition-all shadow-sm"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute top-12 right-3 bg-white rounded-xl shadow-lg border border-brand-border py-2 min-w-[140px] z-10">
            <button onClick={handleCopy} className="w-full px-4 py-2 text-left text-sm text-brand-navy hover:bg-brand-bg transition-all flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" /> Copy Caption
            </button>
            <button onClick={handleDownloadCaption} className="w-full px-4 py-2 text-left text-sm text-brand-navy hover:bg-brand-bg transition-all flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Download Caption
            </button>
            <hr className="my-2 border-brand-border" />
            <button
              onClick={() => { if (confirm("Delete this content?")) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="w-full px-4 py-2 text-left text-sm text-brand-error hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Caption preview */}
      <div className="p-4">
        <p className="text-sm text-brand-slate line-clamp-2">{content.caption}</p>
        <p className="text-xs text-brand-muted mt-2">
          {new Date(content.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
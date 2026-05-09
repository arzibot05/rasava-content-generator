"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Upload, X, Loader2, Sparkles, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(2200),
  imageDescription: z.string().optional(),
  format: z.enum(["SQUARE", "PORTRAIT", "STORY"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function GenerateForm() {
  const queryClient = useQueryClient();
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      imageDescription: "",
      format: "SQUARE",
    },
    mode: "onChange",
  });

  const format = watch("format");
  const caption = watch("caption");

  const generateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: data.caption,
          imageDescription: data.imageDescription || "",
          format: data.format,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setImagePrompt(data.imagePrompt);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedImage || !caption) throw new Error("No image to save");
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          imageUrl: generatedImage,
          imagePrompt: imagePrompt || caption,
          format,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      // Reset
      setGeneratedImage(null);
      setImagePrompt(null);
      setReferencePreview(null);
      setReferenceFile(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setReferencePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const formatLabel = { SQUARE: "1:1 Feed", PORTRAIT: "4:5 Portrait", STORY: "9:16 Story" };
  const aspectClass = { SQUARE: "aspect-square", PORTRAIT: "aspect-[4/5]", STORY: "aspect-[9/16]" };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-5">
        {/* Caption */}
        <div>
          <Label htmlFor="caption" className="text-sm font-semibold text-brand-navy mb-1.5 block">
            Caption
          </Label>
          <Textarea
            id="caption"
            {...register("caption")}
            placeholder="Enter your Instagram caption..."
            rows={4}
            className={cn("resize-none", errors.caption && "border-brand-error")}
          />
          <div className="flex justify-between mt-1">
            {errors.caption && (
              <p className="text-xs text-brand-error">{errors.caption.message}</p>
            )}
            <p className="text-xs text-brand-slate ml-auto">{caption.length}/2,200</p>
          </div>
        </div>

        {/* Reference Image */}
        <div>
          <Label className="text-sm font-semibold text-brand-navy mb-1.5 block">
            Reference Image <span className="text-brand-muted font-normal">(optional)</span>
          </Label>
          <div
            onClick={() => document.getElementById("ref-image")?.click()}
            className="border-2 border-dashed border-brand-border rounded-xl p-6 text-center cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all"
          >
            {referencePreview ? (
              <div className="relative inline-block">
                <Image
                  src={referencePreview}
                  alt="Reference"
                  width={120}
                  height={120}
                  className="mx-auto rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReferenceFile(null);
                    setReferencePreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-brand-error text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-brand-slate">
                <Upload className="w-8 h-8 mx-auto mb-2 text-brand-muted" />
                <p className="text-sm">Click to upload reference image</p>
                <p className="text-xs mt-1 text-brand-muted">JPG, PNG up to 5MB</p>
              </div>
            )}
          </div>
          <input id="ref-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Image Description */}
        <div>
          <Label htmlFor="imageDescription" className="text-sm font-semibold text-brand-navy mb-1.5 block">
            Image Description <span className="text-brand-muted font-normal">(optional)</span>
          </Label>
          <Input
            id="imageDescription"
            {...register("imageDescription")}
            placeholder="e.g., warm lighting, outdoor setting, minimalist..."
          />
        </div>

        {/* Format Selector */}
        <div>
          <Label className="text-sm font-semibold text-brand-navy mb-2 block">Format</Label>
          <div className="flex gap-3">
            {(["SQUARE", "PORTRAIT", "STORY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setValue("format", f, { shouldValidate: true })}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
                  format === f
                    ? "bg-brand-orange text-white shadow-md"
                    : "bg-white border border-brand-border text-brand-navy hover:border-brand-orange"
                )}
              >
                {formatLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {!generatedImage && (
          <Button
            type="button"
            onClick={handleSubmit((data) => generateMutation.mutate(data))}
            disabled={!isValid || generateMutation.isPending}
            className="w-full bg-brand-orange hover:bg-orange-600 text-white font-semibold"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        )}
      </form>

      {/* Preview & Actions */}
      {generatedImage && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <p className="text-sm font-semibold text-brand-navy mb-2">Preview</p>
            <div
              className={cn(
                "mx-auto rounded-xl overflow-hidden bg-black max-w-80",
                aspectClass[format as keyof typeof aspectClass]
              )}
            >
              <div className={cn("relative w-full", aspectClass[format as keyof typeof aspectClass])}>
                <Image
                  src={generatedImage}
                  alt="Generated"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 bg-brand-success hover:bg-green-600 text-white font-semibold"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              onClick={() => setGeneratedImage(null)}
              variant="outline"
              className="flex-1 border-brand-border text-brand-navy hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-sm text-brand-success text-center">✅ Saved to gallery!</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-brand-error text-center">❌ Failed to save</p>
          )}
        </div>
      )}
    </div>
  );
}
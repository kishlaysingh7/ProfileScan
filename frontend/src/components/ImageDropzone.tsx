import { Crop, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { useApp } from "../context/AppContext";
import { formatBytes, validateImageFile } from "../lib/validation";
import { ImageCropper } from "./ImageCropper";
import { Button } from "./ui";

export function ImageDropzone({ disabled }: { disabled?: boolean }) {
  const { image, setImage } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);

  function accept(file: File | undefined) {
    if (!file) return;
    const err = validateImageFile(file);
    setError(err);
    if (!err) setImage(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) accept(e.dataTransfer.files[0]);
  }

  if (image && cropping) {
    return (
      <ImageCropper
        src={image.previewUrl}
        fileName={image.file.name}
        mimeType={image.file.type}
        onCancel={() => setCropping(false)}
        onApply={(f) => {
          setImage(f);
          setCropping(false);
        }}
      />
    );
  }

  if (image) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <img
          src={image.previewUrl}
          alt="Preview of your uploaded photo"
          className="h-40 w-40 rounded-xl border border-slate-200 object-cover"
        />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="break-all font-medium text-slate-900">{image.file.name}</p>
            <p className="text-sm text-slate-500">{formatBytes(image.file.size)}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button variant="secondary" onClick={() => setCropping(true)}>
              <Crop className="h-4 w-4" aria-hidden="true" /> Crop
            </Button>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" /> Replace
            </Button>
            <Button variant="ghost" onClick={() => { setImage(null); setError(null); }}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-50 ${
          dragging ? "border-violet-500 bg-violet-50" : "border-slate-300 bg-slate-50 hover:border-violet-400"
        }`}
      >
        <UploadCloud className="h-9 w-9 text-violet-600" aria-hidden="true" />
        <span className="font-semibold text-slate-900">Drag and drop a photo, or click to browse</span>
        <span className="text-sm text-slate-500">JPG, PNG or WEBP · up to 5 MB</span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

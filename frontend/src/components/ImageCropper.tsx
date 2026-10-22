import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

const OUTPUT_SIZE = 640;

export function ImageCropper({
  src,
  fileName,
  mimeType,
  onApply,
  onCancel,
}: {
  src: string;
  fileName: string;
  mimeType: string;
  onApply: (file: File) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!loaded || !img || !canvas) return;
    const side = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
    const sx = ((img.naturalWidth - side) * x) / 100;
    const sy = ((img.naturalHeight - side) * y) / 100;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    canvas.getContext("2d")?.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  }, [loaded, zoom, x, y]);

  function apply() {
    canvasRef.current?.toBlob(
      (blob) => {
        if (blob) onApply(new File([blob], fileName, { type: blob.type || mimeType }));
      },
      mimeType,
      0.92,
    );
  }

  const slider = "w-full accent-violet-600";

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        aria-label="Crop preview"
        className="mx-auto aspect-square w-full max-w-xs rounded-xl border border-slate-200 bg-slate-100"
      />
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <label className="block">
          <span className="font-medium text-slate-700">Zoom</span>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} className={slider} />
        </label>
        <label className="block">
          <span className="font-medium text-slate-700">Horizontal</span>
          <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} className={slider} />
        </label>
        <label className="block">
          <span className="font-medium text-slate-700">Vertical</span>
          <input type="range" min={0} max={100} value={y} onChange={(e) => setY(+e.target.value)} className={slider} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={apply} disabled={!loaded}>Apply crop</Button>
      </div>
    </div>
  );
}

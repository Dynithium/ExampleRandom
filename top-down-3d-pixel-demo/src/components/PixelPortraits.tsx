import { useEffect, useRef } from "react";

export type PortraitKey =
  | "Father"
  | "Minslaire"
  | "Tinslaire"
  | "Elder Moss"
  | "Elder Sage"
  | "Elder Thorn"
  | "Widow Oren"
  | "Bazaar Trader"
  | "Central Well"
  | "Sword Case"
  | "The Council of Elders";

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

export function drawPortrait(ctx: CanvasRenderingContext2D, name: string) {
  ctx.clearRect(0, 0, 24, 24);

  // Background tone
  px(ctx, 0, 0, 24, 24, "#182038");

  if (name === "Father") {
    // Father: Tan tunic, graying brown hair, gray temples, kind beard, warm skin
    // Tunic
    px(ctx, 4, 18, 16, 6, "#d0b078");
    px(ctx, 9, 18, 6, 2, "#906848");
    // Face
    px(ctx, 6, 7, 12, 11, "#f0c090");
    px(ctx, 5, 8, 14, 8, "#f0c090");
    // Hair & Gray Temples
    px(ctx, 5, 3, 14, 5, "#503828");
    px(ctx, 5, 6, 2, 4, "#c0c0c0");
    px(ctx, 17, 6, 2, 4, "#c0c0c0");
    px(ctx, 7, 2, 10, 3, "#503828");
    // Eyes
    px(ctx, 8, 9, 2, 2, "#201810");
    px(ctx, 14, 9, 2, 2, "#201810");
    px(ctx, 9, 9, 1, 1, "#ffffff");
    px(ctx, 15, 9, 1, 1, "#ffffff");
    // Beard
    px(ctx, 7, 13, 10, 6, "#3a281c");
    px(ctx, 8, 15, 8, 4, "#503828");
    px(ctx, 10, 17, 4, 3, "#705040");
  } else if (name === "Tinslaire") {
    // Tinslaire: Blue tunic, boyish eyes, brown hair, youthful blush
    // Blue tunic
    px(ctx, 5, 18, 14, 6, "#4a90d9");
    px(ctx, 9, 18, 6, 2, "#204888");
    // Face
    px(ctx, 6, 8, 12, 10, "#f0c090");
    px(ctx, 5, 9, 14, 8, "#f0c090");
    // Cheeks
    px(ctx, 6, 12, 2, 2, "#f8a090");
    px(ctx, 16, 12, 2, 2, "#f8a090");
    // Tousled Hair
    px(ctx, 5, 4, 14, 5, "#503828");
    px(ctx, 4, 5, 3, 4, "#503828");
    px(ctx, 17, 5, 3, 4, "#503828");
    px(ctx, 7, 3, 10, 3, "#705040");
    px(ctx, 10, 6, 3, 3, "#503828");
    // Eyes
    px(ctx, 8, 10, 2, 3, "#201810");
    px(ctx, 14, 10, 2, 3, "#201810");
    px(ctx, 8, 10, 1, 1, "#ffffff");
    px(ctx, 14, 10, 1, 1, "#ffffff");
    // Mouth
    px(ctx, 11, 15, 2, 1, "#d07060");
  } else if (name === "Elder Moss") {
    // Elder Moss: Green robe, bald top, gray beard, narrow observant eyes
    // Green robe
    px(ctx, 4, 18, 16, 6, "#386018");
    px(ctx, 8, 18, 8, 2, "#e8b040");
    // Face
    px(ctx, 6, 7, 12, 10, "#e8c6a0");
    // Bald crown & Gray sides
    px(ctx, 7, 4, 10, 4, "#d0a070");
    px(ctx, 5, 6, 2, 6, "#d0d0d0");
    px(ctx, 17, 6, 2, 6, "#d0d0d0");
    // Eyes
    px(ctx, 8, 9, 3, 1, "#201810");
    px(ctx, 13, 9, 3, 1, "#201810");
    // Long Beard
    px(ctx, 6, 12, 12, 9, "#d0d0d0");
    px(ctx, 7, 15, 10, 6, "#f0f0f0");
    px(ctx, 9, 19, 6, 4, "#ffffff");
  } else if (name === "Elder Sage") {
    // Elder Sage: Scholar purple robe, spectacles, scholar gray beard
    // Purple robe
    px(ctx, 4, 18, 16, 6, "#503868");
    px(ctx, 8, 18, 8, 2, "#9370db");
    // Face
    px(ctx, 6, 7, 12, 10, "#f0c090");
    // Hair
    px(ctx, 6, 4, 12, 4, "#c0c0c0");
    px(ctx, 5, 6, 2, 6, "#c0c0c0");
    px(ctx, 17, 6, 2, 6, "#c0c0c0");
    // Glasses / Spectacles
    px(ctx, 7, 8, 4, 3, "#e8b040");
    px(ctx, 13, 8, 4, 3, "#e8b040");
    px(ctx, 8, 9, 2, 1, "#181818");
    px(ctx, 14, 9, 2, 1, "#181818");
    px(ctx, 11, 9, 2, 1, "#e8b040");
    // Beard
    px(ctx, 7, 13, 10, 7, "#c0c0c0");
    px(ctx, 9, 16, 6, 5, "#e0e0e0");
  } else if (name === "Elder Thorn") {
    // Elder Thorn: Slate-gray robe, warrior scars, stern gray beard
    // Slate robe
    px(ctx, 4, 18, 16, 6, "#3b4858");
    px(ctx, 8, 18, 8, 2, "#8a9aa8");
    // Face
    px(ctx, 6, 7, 12, 10, "#d8a880");
    // Short Gray Hair
    px(ctx, 5, 4, 14, 4, "#808890");
    px(ctx, 5, 7, 2, 4, "#808890");
    px(ctx, 17, 7, 2, 4, "#808890");
    // Eyes
    px(ctx, 8, 9, 2, 2, "#181818");
    px(ctx, 14, 9, 2, 2, "#181818");
    // Trimmed Beard
    px(ctx, 7, 13, 10, 6, "#707880");
    px(ctx, 9, 15, 6, 4, "#9098a0");
  } else if (name === "Widow Oren") {
    // Widow Oren: Warm woolen shawl, gray hair bun, sweet wrinkled face
    // Shawl
    px(ctx, 4, 18, 16, 6, "#a87860");
    px(ctx, 8, 18, 8, 2, "#d0b090");
    // Face
    px(ctx, 6, 8, 12, 10, "#f0c090");
    // Gray Bun & Hair
    px(ctx, 9, 2, 6, 4, "#d0d0d0");
    px(ctx, 5, 5, 14, 5, "#c0c0c0");
    px(ctx, 5, 8, 2, 5, "#c0c0c0");
    px(ctx, 17, 8, 2, 5, "#c0c0c0");
    // Eyes
    px(ctx, 8, 10, 2, 2, "#302018");
    px(ctx, 14, 10, 2, 2, "#302018");
    // Smile
    px(ctx, 10, 15, 4, 1, "#b05050");
  } else if (name === "Bazaar Trader") {
    // Bazaar Trader: Orange/tan turban hood, merchant mustache
    // Clothes
    px(ctx, 4, 18, 16, 6, "#c07840");
    px(ctx, 8, 18, 8, 2, "#ffd75e");
    // Face
    px(ctx, 6, 9, 12, 9, "#e0b080");
    // Turban
    px(ctx, 4, 3, 16, 7, "#c07840");
    px(ctx, 6, 2, 12, 3, "#e89050");
    px(ctx, 11, 4, 3, 3, "#ffd75e");
    // Eyes & Mustache
    px(ctx, 8, 10, 2, 2, "#201810");
    px(ctx, 14, 10, 2, 2, "#201810");
    px(ctx, 8, 13, 8, 2, "#402818");
    px(ctx, 10, 15, 4, 2, "#402818");
  } else if (name === "Central Well") {
    // Well: Shingle roof, stone cylinder, blue water depth
    // Roof
    px(ctx, 3, 4, 18, 4, "#c04038");
    px(ctx, 5, 2, 14, 3, "#e05848");
    // Wooden Posts
    px(ctx, 5, 7, 2, 8, "#684830");
    px(ctx, 17, 7, 2, 8, "#684830");
    // Stone Rim
    px(ctx, 4, 14, 16, 8, "#889098");
    px(ctx, 6, 15, 12, 6, "#185888");
    px(ctx, 8, 16, 8, 4, "#2888c8");
  } else if (name === "Sword Case") {
    // Sword Case: Glass frame, glowing blade, gold hilt
    // Glass Case
    px(ctx, 5, 2, 14, 20, "#90d0f0");
    px(ctx, 7, 4, 10, 16, "#f0f8ff");
    // Blade
    px(ctx, 11, 5, 2, 10, "#c8d0d8");
    px(ctx, 10, 7, 4, 1, "#ffffff");
    // Gold Crossguard & Hilt
    px(ctx, 8, 14, 8, 2, "#ffd75e");
    px(ctx, 11, 16, 2, 3, "#684830");
    px(ctx, 10, 19, 4, 2, "#ffd75e");
  } else {
    // The Council of Elders / Emblem
    px(ctx, 4, 4, 16, 16, "#203868");
    px(ctx, 6, 6, 12, 12, "#305898");
    // Gold Crown & Seal
    px(ctx, 7, 8, 10, 8, "#ffd75e");
    px(ctx, 9, 10, 6, 4, "#ff9900");
    px(ctx, 11, 7, 2, 3, "#ffffff");
  }

  // Pixel border highlight
  px(ctx, 0, 0, 24, 1, "rgba(255,255,255,0.15)");
  px(ctx, 0, 0, 1, 24, "rgba(255,255,255,0.15)");
  px(ctx, 0, 23, 24, 1, "rgba(0,0,0,0.5)");
  px(ctx, 23, 0, 1, 24, "rgba(0,0,0,0.5)");
}

export function PixelPortrait({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawPortrait(ctx, name);
  }, [name]);

  return (
    <canvas
      ref={canvasRef}
      width={24}
      height={24}
      className="h-14 w-14 shrink-0 rounded border-2 border-[#b09048] bg-[#182038] shadow-md"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

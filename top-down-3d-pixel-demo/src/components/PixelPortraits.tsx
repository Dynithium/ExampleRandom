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
  | "The Council of Elders"
  | "Scholar's Journal"
  | "Archive Shelf"
  | "Harvest Grain"
  | "Outskirts Cave"
  | "???"
  | "Cave Machine"
  | "Life Suit"
  | "The Forge";

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
  } else if (name === "Minslaire") {
    // Minslaire: red tunic like his mesh, green cap with gold feather, determined eyes
    // Tunic
    px(ctx, 4, 18, 16, 6, "#e2544f");
    px(ctx, 9, 18, 6, 2, "#903838");
    // Bio-suit core glow
    px(ctx, 10, 19, 4, 3, "#70d6ff");
    // Face
    px(ctx, 6, 8, 12, 10, "#f0b98d");
    px(ctx, 5, 9, 14, 8, "#f0b98d");
    // Hair
    px(ctx, 5, 4, 14, 5, "#3f8f57");
    px(ctx, 7, 3, 10, 3, "#2f6b41");
    // Eyes
    px(ctx, 8, 10, 2, 2, "#241a14");
    px(ctx, 14, 10, 2, 2, "#241a14");
    px(ctx, 8, 10, 1, 1, "#ffffff");
    px(ctx, 14, 10, 1, 1, "#ffffff");
    // Determined mouth
    px(ctx, 10, 15, 4, 1, "#b06050");
    // Gold feather in cap
    px(ctx, 16, 2, 2, 4, "#ffd75e");
  } else if (name === "Scholar's Journal" || name === "Archive Shelf") {
    // Open journal: leather cover, lined pages, ink script
    px(ctx, 3, 5, 18, 15, "#684830");
    px(ctx, 5, 6, 14, 13, "#f0e8d0");
    px(ctx, 11, 6, 2, 13, "#c8b890");
    // Script lines
    px(ctx, 6, 8, 4, 1, "#584830");
    px(ctx, 6, 10, 4, 1, "#584830");
    px(ctx, 6, 12, 3, 1, "#584830");
    px(ctx, 13, 8, 4, 1, "#584830");
    px(ctx, 13, 10, 4, 1, "#584830");
    px(ctx, 13, 12, 3, 1, "#584830");
    // Elemental margin notes: green, blue, red, gold
    px(ctx, 6, 15, 2, 2, "#48a028");
    px(ctx, 9, 15, 2, 2, "#3890c8");
    px(ctx, 13, 15, 2, 2, "#d03838");
    px(ctx, 16, 15, 2, 2, "#e8b040");
    // Ribbon bookmark
    px(ctx, 17, 3, 2, 5, "#c04038");
  } else if (name === "Harvest Grain") {
    // Heavy golden sack, tied neck, a few stray grains
    px(ctx, 5, 7, 14, 14, "#e8c878");
    px(ctx, 6, 8, 12, 12, "#d4b462");
    px(ctx, 9, 4, 6, 4, "#c8a050");
    px(ctx, 10, 3, 4, 2, "#8a6830");
    // Sack stitching
    px(ctx, 6, 12, 12, 1, "#b89050");
    px(ctx, 6, 15, 12, 1, "#b89050");
    // Stray grains
    px(ctx, 4, 20, 2, 2, "#f0d890");
    px(ctx, 18, 20, 2, 2, "#f0d890");
    px(ctx, 11, 21, 2, 2, "#f0d890");
  } else if (name === "Outskirts Cave") {
    // Dark cave mouth in gray rock, cold blue depth, one torch glow
    px(ctx, 2, 3, 20, 19, "#5a564c");
    px(ctx, 4, 5, 16, 17, "#6e6a5e");
    px(ctx, 6, 8, 12, 14, "#0a0c16");
    px(ctx, 8, 10, 8, 12, "#05060c");
    // Rock teeth
    px(ctx, 6, 7, 2, 3, "#7a766a");
    px(ctx, 16, 7, 2, 3, "#7a766a");
    px(ctx, 10, 6, 4, 2, "#8a8276");
    // Torch glow at the entrance
    px(ctx, 5, 16, 2, 3, "#ff9038");
    px(ctx, 5, 15, 2, 1, "#ffe9a0");
  } else if (name === "???") {
    // The unknown: pure dark, two faint red eyes blinking open
    px(ctx, 0, 0, 24, 24, "#05060c");
    px(ctx, 0, 0, 24, 24, "#0a0e1c");
    px(ctx, 6, 10, 4, 2, "#7a1016");
    px(ctx, 14, 10, 4, 2, "#7a1016");
    px(ctx, 7, 10, 2, 1, "#ff2030");
    px(ctx, 15, 10, 2, 1, "#ff2030");
  } else if (name === "Cave Machine") {
    // The rusted first machine: chassis plates, rivets, one great red eye
    px(ctx, 3, 6, 18, 14, "#7a4f34");
    px(ctx, 4, 7, 16, 12, "#8f6446");
    px(ctx, 14, 8, 6, 5, "#5f4028");
    // Rivets
    px(ctx, 5, 8, 2, 2, "#4a3020");
    px(ctx, 5, 16, 2, 2, "#4a3020");
    px(ctx, 17, 15, 2, 2, "#4a3020");
    // The great eye
    px(ctx, 7, 10, 8, 6, "#1a0a0a");
    px(ctx, 8, 11, 6, 4, "#ff1a20");
    px(ctx, 9, 12, 2, 2, "#ffd0c0");
    // Antenna tip
    px(ctx, 6, 3, 2, 3, "#4a3020");
    px(ctx, 6, 2, 2, 2, "#ffd75e");
    // Jaw grills
    px(ctx, 6, 18, 12, 1, "#3a2818");
    px(ctx, 6, 20, 12, 1, "#3a2818");
  } else if (name === "Life Suit") {
    // The bio-synthetic suit core: dark chest, glowing blue membrane
    px(ctx, 3, 4, 18, 16, "#222838");
    px(ctx, 5, 6, 14, 12, "#2a3248");
    // Core
    px(ctx, 9, 9, 6, 7, "#0a2a3a");
    px(ctx, 10, 10, 4, 5, "#70d6ff");
    px(ctx, 11, 11, 2, 2, "#d0f4ff");
    // Chest seams
    px(ctx, 5, 8, 14, 1, "#3a4a68");
    px(ctx, 5, 16, 14, 1, "#3a4a68");
    // Shoulder vents
    px(ctx, 4, 6, 3, 2, "#50c8ff");
    px(ctx, 17, 6, 3, 2, "#50c8ff");
  } else if (name === "The Forge") {
    // Anvil, coals, and thecompass being forged: warm fire under steel
    px(ctx, 4, 4, 16, 4, "#40444c");
    px(ctx, 6, 2, 12, 3, "#585c64");
    // Anvil
    px(ctx, 5, 8, 14, 3, "#c8d0d8");
    px(ctx, 10, 11, 4, 5, "#a0a8b0");
    px(ctx, 7, 16, 10, 2, "#c8d0d8");
    // Fire
    px(ctx, 5, 19, 14, 3, "#f87828");
    px(ctx, 7, 18, 10, 2, "#ffc852");
    px(ctx, 10, 17, 4, 2, "#fff0b0");
    // Brass disc with the red eye — the compass
    px(ctx, 15, 5, 5, 5, "#e8b040");
    px(ctx, 16, 6, 3, 3, "#b08020");
    px(ctx, 17, 7, 1, 1, "#ff2030");
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

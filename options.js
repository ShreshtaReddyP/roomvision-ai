// The "id" values MUST match the option lists in backend/services/prompt_builder.py.

export const MAX_UPLOAD_MB = 10;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_INSTRUCTIONS = 800;
export const MAX_CUSTOM_PALETTE = 120;

export const ROOM_TYPES = [
  { id: "bedroom", label: "Bedroom" },
  { id: "living_room", label: "Living room" },
  { id: "kitchen", label: "Kitchen" },
  { id: "dining_room", label: "Dining room" },
  { id: "bathroom", label: "Bathroom" },
  { id: "other", label: "Other" },
];

export const DESIGN_STYLES = [
  { id: "modern", label: "Modern", blurb: "Clean lines and statement lighting" },
  { id: "minimalist", label: "Minimalist", blurb: "Only the essentials, lots of calm" },
  { id: "scandinavian", label: "Scandinavian", blurb: "Light wood and soft textiles" },
  { id: "bohemian", label: "Bohemian", blurb: "Layered patterns and plants" },
  { id: "industrial", label: "Industrial", blurb: "Raw textures and black metal" },
  { id: "contemporary", label: "Contemporary", blurb: "Current trends, bold accents" },
  { id: "luxury", label: "Luxury", blurb: "Marble, brass and velvet" },
  { id: "japandi", label: "Japandi", blurb: "Japanese calm, Nordic warmth" },
  { id: "traditional", label: "Traditional", blurb: "Classic shapes, rich wood" },
];

export const COLOR_PALETTES = [
  { id: "warm_neutrals", label: "Warm neutrals", swatches: ["#F1E7D6", "#DCC8A8", "#B89B78", "#8A6F55"] },
  { id: "cool_neutrals", label: "Cool neutrals", swatches: ["#EEF0F0", "#CBD0D2", "#9BA3A8", "#5F686E"] },
  { id: "earthy_tones", label: "Earthy tones", swatches: ["#C27A5A", "#A3503A", "#7D8A5B", "#5A4632"] },
  { id: "monochrome", label: "Monochrome", swatches: ["#F5F5F5", "#BDBDBD", "#6B6B6B", "#1F1F1F"] },
  { id: "pastel", label: "Pastel", swatches: ["#F6D5D8", "#CFE6DA", "#CFDDF1", "#E5DAF2"] },
  { id: "bold_colors", label: "Bold colours", swatches: ["#0F5A63", "#1F2F5C", "#D99A1E", "#C4552B"] },
  { id: "custom", label: "Custom palette", swatches: [] },
];

export const BUDGETS = [
  { id: "low", label: "Low", blurb: "Affordable finds" },
  { id: "moderate", label: "Moderate", blurb: "Quality mid-range" },
  { id: "premium", label: "Premium", blurb: "Designer-level" },
  { id: "luxury", label: "Luxury", blurb: "Bespoke, high-end" },
];

export const DEFAULT_FORM = {
  room_type: "living_room",
  design_style: "scandinavian",
  color_palette: "warm_neutrals",
  custom_palette: "",
  budget: "moderate",
  additional_instructions: "",
  preserve_layout: true,
};

export function labelFor(list, id) {
  return list.find((item) => item.id === id)?.label ?? id;
}

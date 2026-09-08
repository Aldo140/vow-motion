import type { Opening } from "@/lib/types";
export const OPENINGS: {
  id: Opening;
  name: string;
  description: string;
  detail: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "envelope",
    name: "The suite",
    description:
      "A photograph, a card and a lined envelope laid out together. The guest presses a seal to open it.",
    detail: "Unfolds across the page · best on a large screen",
    preview: (
      <span className="preview-suite">
        <i className="preview-photo" />
        <i className="preview-card" />
        <i className="preview-seal" />
      </span>
    ),
  },
  {
    id: "seal",
    name: "The sealed envelope",
    description:
      "One printed envelope, held closed by a wax seal. The guest breaks the seal and the card rises out.",
    detail: "Reads as one object · best in a hand",
    preview: (
      <span className="preview-sealed">
        <i className="preview-flap" />
        <i className="preview-wax" />
      </span>
    ),
  },
];

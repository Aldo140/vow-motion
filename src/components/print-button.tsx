"use client";

import { PrinterIcon } from "@phosphor-icons/react";

export default function PrintButton() {
  return (
    <button className="button primary" onClick={() => window.print()}>
      Print the set
      <PrinterIcon size={16} />
    </button>
  );
}

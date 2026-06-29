"use client";

export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={`btn-primary no-print ${className}`}>
      ⬇︎ Download als PDF
    </button>
  );
}

import type { IconKey } from "@/lib/catalog";

// Abstracte, geometrische line-art iconen — één per categorie.
// Bewust minimalistisch/abstract i.p.v. letterlijke pictogrammen.

const paths: Record<IconKey, React.ReactNode> = {
  branding: (
    <>
      <path d="M16 3l4 6-4 6-4-6 4-6z" />
      <path d="M16 15l4 6-4 8-4-8 4-6z" opacity="0.55" />
      <circle cx="16" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  print: (
    <>
      <rect x="6" y="9" width="20" height="14" rx="2" />
      <path d="M9 9V5h10l4 4" opacity="0.6" />
      <path d="M10 15h12M10 19h8" />
    </>
  ),
  websites: (
    <>
      <rect x="4" y="6" width="24" height="20" rx="2.5" />
      <path d="M4 12h24" />
      <circle cx="8" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <path d="M9 18h9M9 22h6" opacity="0.6" />
    </>
  ),
  webshop: (
    <>
      <path d="M7 10h18l-2 12H9L7 10z" />
      <path d="M11 10a5 5 0 0 1 10 0" />
      <circle cx="13" cy="26" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="21" cy="26" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  webapps: (
    <>
      <rect x="4" y="5" width="24" height="22" rx="2.5" />
      <path d="M4 11h24M12 11v16" />
      <path d="M16 15h8M16 19h8M16 23h5" opacity="0.6" />
    </>
  ),
  apps: (
    <>
      <rect x="9" y="3" width="14" height="26" rx="3.5" />
      <path d="M13 6h6" opacity="0.6" />
      <circle cx="16" cy="25" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  hosting: (
    <>
      <circle cx="16" cy="16" r="4.5" />
      <ellipse cx="16" cy="16" rx="12.5" ry="5.5" />
      <ellipse cx="16" cy="16" rx="12.5" ry="5.5" transform="rotate(60 16 16)" />
      <ellipse cx="16" cy="16" rx="12.5" ry="5.5" transform="rotate(120 16 16)" />
    </>
  ),
  support: (
    <>
      <path d="M16 3l11 4v8c0 7-4.8 11.2-11 14C9.8 26.2 5 22 5 15V7l11-4z" />
      <path d="M11.5 15.5l3 3 6-6.5" />
    </>
  ),
  organic: (
    <>
      <path d="M4 16c6 0 6-9 12-9s6 9 12 9" />
      <path d="M4 22c6 0 6-6 12-6s6 6 12 6" opacity="0.5" />
      <circle cx="16" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  paid: (
    <>
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="6.5" />
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  tracking: (
    <>
      <path d="M4 26V6M4 26h24" />
      <path d="M8 22l6-7 5 4 8-11" />
      <circle cx="27" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  seo: (
    <>
      <circle cx="13" cy="13" r="8.5" />
      <path d="M19.5 19.5L27 27" />
      <path d="M13 4.5v3M13 18.5v3M4.5 13h3M18.5 13h3" opacity="0.6" />
    </>
  ),
  funnels: (
    <>
      <path d="M4 6h24l-9 11v9l-6-3v-6L4 6z" />
      <path d="M11 11h10" opacity="0.6" />
    </>
  ),
  crm: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="24" cy="8" r="3" />
      <circle cx="16" cy="24" r="3" />
      <path d="M10.5 9.5L21.5 22.5M21.5 9.5L10.5 22.5M11 8h10" opacity="0.7" />
    </>
  ),
};

export function CategoryIcon({
  name,
  className = "",
}: {
  name: IconKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

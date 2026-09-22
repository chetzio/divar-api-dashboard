"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function IconRadio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="9" x2="6" y2="3" />
      <rect x="4" y="9" width="16" height="10" rx="2" />
      <circle cx="9" cy="14" r="2" />
      <circle cx="16" cy="14" r="1.3" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4a4 4 0 0 0-4 4v2.5c0 1-.4 2-1.1 2.7L6 14.5h12l-.9-1.3A3.7 3.7 0 0 1 16 10.5V8a4 4 0 0 0-4-4Z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6" />
      <line x1="15" y1="15" x2="20" y2="20" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="14" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="9" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}

function IconContacts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "داشبورد", Icon: IconDashboard },
  { href: "/items", label: "اجناس", Icon: IconRadio },
  { href: "/contacts", label: "مخاطبین", Icon: IconContacts },
  { href: "/finds", label: "یافته‌ها", Icon: IconBell },
  { href: "/searches", label: "جستجوها", Icon: IconSearch },
  { href: "/settings", label: "تنظیمات", Icon: IconSettings },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-muted/30 bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-between px-2 py-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[11px] transition-colors ${
                active ? "text-primary font-bold" : "text-subtle"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

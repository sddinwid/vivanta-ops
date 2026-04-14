"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearToken, getToken } from "../../lib/auth/token";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/documents", label: "Documents" },
  { href: "/communications", label: "Communications" },
  { href: "/ai-runs", label: "AI Runs" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const isLogin = pathname === "/login";

  useEffect(() => {
    setToken(getToken());
  }, [pathname]);

  useEffect(() => {
    if (isLogin) return;
    const t = getToken();
    if (!t) {
      router.replace("/login");
    }
  }, [isLogin, router, pathname]);

  const activeHref = useMemo(() => {
    const exact = NAV.find((n) => n.href === pathname)?.href;
    if (exact) return exact;
    const prefix = NAV.find((n) => pathname.startsWith(n.href + "/"))?.href;
    return prefix ?? null;
  }, [pathname]);

  return (
    <div className="shell">
      {!isLogin ? (
        <header className="header">
          <div className="brand">
            <Link href="/dashboard" className="brandLink">
              Vivanta Ops
            </Link>
            <span className="brandSub">Operator UI</span>
          </div>
          <nav className="nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === activeHref ? "navLink navLinkActive" : "navLink"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="headerRight">
            <span className={token ? "pill pillOk" : "pill pillWarn"}>
              {token ? "Authenticated" : "No token"}
            </span>
            <button
              className="btn btnGhost"
              onClick={() => {
                clearToken();
                setToken(null);
                router.replace("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
      ) : null}
      <main className="main">{children}</main>
    </div>
  );
}

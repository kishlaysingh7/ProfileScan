import { Search } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/upload", label: "Search" },
  { to: "/collection", label: "My collection" },
  { to: "/services", label: "Services" },
  { to: "/saved", label: "Saved" },
  { to: "/settings", label: "Privacy & settings" },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Search className="h-4 w-4" aria-hidden="true" />
            </span>
            ProfileFinder
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-100"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-slate-500">
          <span>Guest mode · photos never leave your browser</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy policy</Link>
            <Link to="/terms" className="hover:underline">Terms of service</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

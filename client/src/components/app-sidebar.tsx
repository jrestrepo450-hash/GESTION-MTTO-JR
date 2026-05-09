import { useState, useRef, useEffect } from "react";
import { Building2, LayoutDashboard, MapPin, Users, ClipboardList, Zap, CalendarCheck, Package, FileBarChart, Search, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Panel Principal", url: "/", icon: LayoutDashboard },
  { title: "Espacios", url: "/spaces", icon: MapPin },
  { title: "Pendientes", url: "/pendientes", icon: ClipboardList },
  { title: "Consumo Energético", url: "/consumo", icon: Zap },
  { title: "Preventivo", url: "/preventivo", icon: CalendarCheck },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Reporte Mensual", url: "/reporte", icon: FileBarChart },
  { title: "Usuarios WhatsApp", url: "/usuarios", icon: Users },
];

type SearchResult = {
  spaces: { id: number; name: string; code: string }[];
  tickets: { id: number; title: string; spaceId: number }[];
};

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await r.json();
        setResults(data);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const total = (results?.spaces.length ?? 0) + (results?.tickets.length ?? 0);

  return (
    <div ref={boxRef} className="relative mt-3 mx-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar espacios, tickets…"
          data-testid="input-global-search"
          className="w-full pl-8 pr-7 py-2 text-xs bg-secondary rounded-lg border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <p className="text-xs text-muted-foreground p-3">Buscando…</p>
          ) : total === 0 ? (
            <p className="text-xs text-muted-foreground p-3">Sin resultados para "{query}"</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {(results?.spaces.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 pt-2 pb-1 font-medium">Espacios</p>
                  {results!.spaces.map(s => (
                    <button key={s.id} onClick={() => { navigate(`/spaces/${s.id}`); setOpen(false); setQuery(""); }}
                      data-testid={`search-result-space-${s.id}`}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">({s.code})</span>
                    </button>
                  ))}
                </div>
              )}
              {(results?.tickets.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 pt-2 pb-1 font-medium">Tickets</p>
                  {results!.tickets.map(t => (
                    <button key={t.id} onClick={() => { navigate(`/pendientes`); setOpen(false); setQuery(""); }}
                      data-testid={`search-result-ticket-${t.id}`}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight text-sidebar-foreground">Gran Hotel</div>
            <div className="text-xs text-muted-foreground">Mantenimiento</div>
          </div>
        </div>
        <GlobalSearch />
      </SidebarHeader>
      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location === "/"
                    : location === item.url || location.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`rounded-xl py-5 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3" data-testid={`nav-${item.url.replace("/", "") || "home"}`}>
                        <item.icon
                          className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

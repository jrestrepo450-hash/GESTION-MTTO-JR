import { Building2, LayoutDashboard, MapPin, Users, ClipboardList } from "lucide-react";
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
  { title: "Usuarios WhatsApp", url: "/usuarios", icon: Users },
];

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
                      <Link href={item.url} className="flex items-center gap-3 px-3">
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

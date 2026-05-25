import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import SpacesList from "@/pages/spaces-list";
import SpaceDetail from "@/pages/space-detail";
import WaUsers from "@/pages/wa-users";
import Tickets from "@/pages/tickets";
import Consumo from "@/pages/consumo";
import Preventivo from "@/pages/preventivo";
import Inventario from "@/pages/inventario";
import Reporte from "@/pages/reporte";
import Piscina from "@/pages/piscina";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/spaces" component={SpacesList} />
      <Route path="/spaces/:id" component={SpaceDetail} />
      <Route path="/usuarios" component={WaUsers} />
      <Route path="/pendientes" component={Tickets} />
      <Route path="/consumo" component={Consumo} />
      <Route path="/preventivo" component={Preventivo} />
      <Route path="/inventario" component={Inventario} />
      <Route path="/reporte" component={Reporte} />
      <Route path="/piscina" component={Piscina} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
              <header className="h-14 flex items-center px-4 border-b border-border/50 bg-card/80 backdrop-blur-md shrink-0 lg:hidden">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <span className="ml-3 font-semibold text-foreground">Mantenimiento Hotel</span>
              </header>
              <main className="flex-1 overflow-y-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

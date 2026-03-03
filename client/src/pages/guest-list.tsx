import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Search, MoreVertical, Trash2, ChevronRight, Zap, Wind, ShieldAlert, Paintbrush, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

export default function GuestList() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: [api.rooms.list.path]
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.rooms.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
    }
  });

  const [search, setSearch] = useState("");

  const filteredRooms = rooms?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    return status === "ok" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Hojas de Vida Técnicas</h1>
          <p className="text-muted-foreground mt-1">Estado de mantenimiento por habitación</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 flex items-center bg-secondary/30">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar habitación..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-card shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center text-muted-foreground">Cargando habitaciones...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border/50">
                  <TableHead className="font-semibold text-foreground">Habitación</TableHead>
                  <TableHead className="font-semibold text-foreground">Responsable</TableHead>
                  <TableHead className="font-semibold text-foreground text-center"><Zap className="h-4 w-4 mx-auto" /></TableHead>
                  <TableHead className="font-semibold text-foreground text-center"><Wind className="h-4 w-4 mx-auto" /></TableHead>
                  <TableHead className="font-semibold text-foreground text-center"><ShieldAlert className="h-4 w-4 mx-auto" /></TableHead>
                  <TableHead className="font-semibold text-foreground text-center"><Paintbrush className="h-4 w-4 mx-auto" /></TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms?.map((room) => (
                  <TableRow key={room.id} className="group border-border/50 hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                        {room.roomNumber}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{room.name}</TableCell>
                    <TableCell className="text-center">{getStatusIcon(room.energyStatus)}</TableCell>
                    <TableCell className="text-center">{getStatusIcon(room.acStatus)}</TableCell>
                    <TableCell className="text-center">{getStatusIcon(room.smokeDetectorStatus)}</TableCell>
                    <TableCell className="text-center">{getStatusIcon(room.paintStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm" className="hover-elevate text-primary font-medium">
                          <Link href={`/guests/${room.roomNumber}`}>
                            Ver Hoja Técnica <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => deleteRoom.mutate(room.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useGuests, useDeleteGuest } from "@/hooks/use-guests";
import { GuestFormDialog } from "@/components/guest-form-dialog";
import { Search, MoreVertical, Trash2, Edit, ChevronRight } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GuestList() {
  const { data: guests, isLoading } = useGuests();
  const deleteGuest = useDeleteGuest();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredGuests = guests?.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: Date | string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Hojas de Vida</h1>
          <p className="text-muted-foreground mt-1">Directorio de huéspedes y residentes</p>
        </div>
        <GuestFormDialog />
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 flex items-center bg-secondary/30">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o habitación..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-card shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center text-muted-foreground">Cargando registros...</div>
          ) : filteredGuests?.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-1">No se encontraron huéspedes</h3>
              <p className="text-muted-foreground max-w-sm">No hay registros que coincidan con la búsqueda o el directorio está vacío.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border/50">
                  <TableHead className="font-semibold text-foreground">Habitación</TableHead>
                  <TableHead className="font-semibold text-foreground">Huésped</TableHead>
                  <TableHead className="font-semibold text-foreground hidden md:table-cell">Entrada</TableHead>
                  <TableHead className="font-semibold text-foreground hidden lg:table-cell">Salida</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests?.map((guest) => (
                  <TableRow key={guest.id} className="group border-border/50 hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                        {guest.roomNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{guest.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{formatDate(guest.checkIn)}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(guest.checkIn)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDate(guest.checkOut)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm" className="hidden sm:flex hover-elevate text-primary font-medium">
                          <Link href={`/guests/${guest.roomNumber}`}>
                            Ver Perfil <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem asChild>
                              <Link href={`/guests/${guest.roomNumber}`} className="cursor-pointer">
                                Ver Perfil completo
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => setDeletingId(guest.id)}
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

      <AlertDialog open={deletingId !== null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el registro del huésped permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && deleteGuest.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

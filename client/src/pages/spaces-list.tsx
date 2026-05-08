import { useState } from "react";
import { Link } from "wouter";
import { useSpaces, useDeleteSpace } from "@/hooks/use-spaces";
import { Search, Plus, MoreVertical, Trash2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SpaceFormDialog } from "@/components/space-form-dialog";
import { SPACE_TYPE_LABELS, type SpaceType } from "@shared/schema";

export default function SpacesList() {
  const { data: spaces, isLoading } = useSpaces();
  const deleteSpace = useDeleteSpace();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = spaces?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Espacios</h1>
          <p className="text-muted-foreground mt-1">Habitaciones, lobbies, cocinas, subestaciones y más</p>
        </div>
        <SpaceFormDialog />
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-secondary/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar espacio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-spaces"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Cargando...</div>
          ) : filtered?.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron espacios</p>
              <SpaceFormDialog trigger={<Button variant="outline"><Plus className="mr-2 h-4 w-4" />Agregar espacio</Button>} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map(space => (
                  <TableRow key={space.id} className="hover:bg-secondary/20">
                    <TableCell>
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                        {space.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{space.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{SPACE_TYPE_LABELS[space.type as SpaceType] || space.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{space.notes || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm" className="text-primary">
                          <Link href={`/spaces/${space.id}`}>
                            Hoja Técnica <ChevronRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <SpaceFormDialog
                              space={space}
                              trigger={
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="cursor-pointer">
                                  Editar
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => setDeletingId(space.id)}
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

      <AlertDialog open={deletingId !== null} onOpenChange={o => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar espacio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos sus ítems, tickets y mensajes asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deletingId) deleteSpace.mutate(deletingId); setDeletingId(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

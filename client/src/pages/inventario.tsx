import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Material } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  unit: z.string().min(1, "Requerido"),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  location: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function MaterialFormDialog({ existing, onSuccess }: { existing?: Material; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existing
      ? { name: existing.name, unit: existing.unit, stock: existing.stock ?? 0, minStock: existing.minStock ?? 0, location: existing.location ?? "", notes: existing.notes ?? "" }
      : { name: "", unit: "unidad", stock: 0, minStock: 0, location: "", notes: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => existing
      ? apiRequest("PATCH", `/api/materials/${existing.id}`, { ...data, location: data.location || null, notes: data.notes || null })
      : apiRequest("POST", "/api/materials", { ...data, location: data.location || null, notes: data.notes || null }),
    onSuccess: () => {
      toast({ title: existing ? "Material actualizado" : "Material creado" });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setOpen(false); form.reset(); onSuccess();
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing
          ? <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-edit-${existing.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
          : <Button data-testid="button-add-material"><Plus className="mr-2 h-4 w-4" /> Agregar material</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{existing ? "Editar material" : "Nuevo material"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="Ej: Filtro de aire 12x12" data-testid="input-material-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem><FormLabel>Unidad</FormLabel>
                  <FormControl><Input placeholder="unidad, m, kg…" data-testid="input-unit" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Ubicación</FormLabel>
                  <FormControl><Input placeholder="Bodega A, Estante 2…" data-testid="input-location" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="stock" render={({ field }) => (
                <FormItem><FormLabel>Stock actual</FormLabel>
                  <FormControl><Input type="number" step="0.01" data-testid="input-stock" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minStock" render={({ field }) => (
                <FormItem><FormLabel>Stock mínimo</FormLabel>
                  <FormControl><Input type="number" step="0.01" data-testid="input-minstock" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notas (opcional)</FormLabel>
                <FormControl><Input placeholder="Proveedor, referencia…" {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando…" : "Guardar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Inventario() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: mats = [], isLoading } = useQuery<Material[]>({ queryKey: ["/api/materials"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/materials/${id}`),
    onSuccess: () => { toast({ title: "Material eliminado" }); queryClient.invalidateQueries({ queryKey: ["/api/materials"] }); setDeleteId(null); },
  });

  const filtered = mats.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.location ?? "").toLowerCase().includes(search.toLowerCase()));
  const lowStock = mats.filter(m => (m.stock ?? 0) <= (m.minStock ?? 0) && m.minStock > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Inventario de Materiales
          </h1>
          <p className="text-muted-foreground mt-1">Stock de repuestos y materiales de mantenimiento</p>
        </div>
        <MaterialFormDialog onSuccess={() => {}} />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 mb-5 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Stock bajo:</strong>{" "}
            {lowStock.map(m => m.name).join(", ")} — requieren reabastecimiento.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total ítems", value: mats.length },
          { label: "Stock bajo", value: lowStock.length },
          { label: "Sin stock", value: mats.filter(m => (m.stock ?? 0) === 0).length },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar material o ubicación…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-material"
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>{mats.length === 0 ? "No hay materiales registrados." : "Sin resultados para la búsqueda."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {["Material", "Ubicación", "Stock", "Mínimo", "Estado", "Notas", ""].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const isLow = (m.stock ?? 0) <= (m.minStock ?? 0) && m.minStock > 0;
                const isEmpty = (m.stock ?? 0) === 0;
                return (
                  <tr key={m.id} data-testid={`row-material-${m.id}`}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{m.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{m.location || "—"}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {(m.stock ?? 0).toLocaleString("es-CO")} <span className="text-xs text-muted-foreground font-normal">{m.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">
                      {m.minStock > 0 ? `${m.minStock} ${m.unit}` : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEmpty
                        ? <Badge className="bg-red-500 hover:bg-red-500 text-white">Sin stock</Badge>
                        : isLow
                          ? <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Stock bajo</Badge>
                          : <Badge className="bg-green-500 hover:bg-green-500 text-white">OK</Badge>}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[140px] truncate">{m.notes || "—"}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1">
                        <MaterialFormDialog existing={m} onSuccess={() => {}} />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                          data-testid={`button-delete-material-${m.id}`}
                          onClick={() => setDeleteId(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

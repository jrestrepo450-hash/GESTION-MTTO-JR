import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateSpace, useUpdateSpace } from "@/hooks/use-spaces";
import { SPACE_TYPES, SPACE_TYPE_LABELS } from "@shared/schema";
import { Plus } from "lucide-react";
import type { Space } from "@shared/schema";

interface SpaceFormDialogProps {
  space?: Space;
  trigger?: React.ReactNode;
}

export function SpaceFormDialog({ space, trigger }: SpaceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("habitacion");
  const [notes, setNotes] = useState("");

  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();

  useEffect(() => {
    if (open && space) {
      setCode(space.code);
      setName(space.name);
      setType(space.type);
      setNotes(space.notes || "");
    } else if (!open) {
      setCode(""); setName(""); setType("habitacion"); setNotes("");
    }
  }, [open, space]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    const payload = { code: code.toUpperCase(), name, type, notes };
    if (space) {
      updateSpace.mutate({ id: space.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createSpace.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = createSpace.isPending || updateSpace.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-space">
            <Plus className="mr-2 h-4 w-4" />
            {space ? "Editar espacio" : "Nuevo espacio"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{space ? "Editar espacio" : "Nuevo espacio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Código *</label>
              <Input
                placeholder="Ej: 101, LOBBY, SUB-1"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                data-testid="input-space-code"
              />
              <p className="text-xs text-muted-foreground mt-1">Único. Por ej: 101, COCINA, LOBBY</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Tipo *</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-space-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPACE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{SPACE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Nombre descriptivo *</label>
            <Input
              placeholder="Ej: Habitación 101, Lobby Principal, Cocina Norte"
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-space-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Notas</label>
            <Textarea
              placeholder="Observaciones generales del espacio..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending || !code || !name}>
              {isPending ? "Guardando..." : space ? "Guardar cambios" : "Crear espacio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

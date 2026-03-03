import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRoom, useUpdateRoom } from "@/hooks/use-rooms";
import { Plus } from "lucide-react";
import type { Room } from "@shared/schema";

const formSchema = z.object({
  roomNumber: z.string().min(1, "El número de habitación es requerido"),
  name: z.string().min(2, "El nombre o responsable es requerido"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GuestFormDialogProps {
  room?: Room | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function GuestFormDialog({ room: existingRoom, open: controlledOpen, onOpenChange, trigger }: GuestFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditing = !!existingRoom;
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomNumber: "",
      name: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (existingRoom && open) {
      form.reset({
        roomNumber: existingRoom.roomNumber,
        name: existingRoom.name,
        notes: existingRoom.notes || "",
      });
    } else if (!open && !existingRoom) {
      form.reset({ roomNumber: "", name: "", notes: "" });
    }
  }, [existingRoom, open, form]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && existingRoom) {
      updateRoom.mutate(
        { id: existingRoom.id, ...values },
        { onSuccess: () => setOpen(false) }
      );
    } else {
      createRoom.mutate(
        values as any, 
        { onSuccess: () => setOpen(false) }
      );
    }
  };

  const isPending = createRoom.isPending || updateRoom.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !controlledOpen && (
        <DialogTrigger asChild>
          <Button className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Habitación
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Habitación" : "Nueva Habitación"}</DialogTitle>
          <DialogDescription>Ingrese los detalles técnicos de la habitación.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Habitación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable / Técnico</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones generales" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
import { useCreateGuest, useUpdateGuest } from "@/hooks/use-guests";
import type { Guest } from "@shared/schema";
import { Plus } from "lucide-react";

// Frontend schema that handles date strings properly for forms
const formSchema = z.object({
  roomNumber: z.string().min(1, "El número de habitación es requerido"),
  name: z.string().min(2, "El nombre completo es requerido"),
  documentId: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GuestFormDialogProps {
  guest?: Guest | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function GuestFormDialog({ guest, open: controlledOpen, onOpenChange, trigger }: GuestFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditing = !!guest;
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomNumber: "",
      name: "",
      documentId: "",
      checkIn: "",
      checkOut: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (guest && open) {
      form.reset({
        roomNumber: guest.roomNumber,
        name: guest.name,
        documentId: guest.documentId || "",
        checkIn: guest.checkIn ? new Date(guest.checkIn).toISOString().split('T')[0] : "",
        checkOut: guest.checkOut ? new Date(guest.checkOut).toISOString().split('T')[0] : "",
        notes: guest.notes || "",
      });
    } else if (!open && !guest) {
      form.reset({ roomNumber: "", name: "", documentId: "", checkIn: "", checkOut: "", notes: "" });
    }
  }, [guest, open, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      checkIn: values.checkIn ? new Date(values.checkIn) : null,
      checkOut: values.checkOut ? new Date(values.checkOut) : null,
      documentId: values.documentId || null,
      notes: values.notes || null,
    };

    if (isEditing && guest) {
      updateGuest.mutate(
        { id: guest.id, ...payload },
        { onSuccess: () => setOpen(false) }
      );
    } else {
      createGuest.mutate(
        payload as any, 
        { onSuccess: () => setOpen(false) }
      );
    }
  };

  const isPending = createGuest.isPending || updateGuest.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !controlledOpen && (
        <DialogTrigger asChild>
          <Button className="hover-elevate active-elevate-2 bg-primary text-primary-foreground shadow-lg rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Huésped
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="font-display text-2xl">
            {isEditing ? "Editar Huésped" : "Nuevo Huésped"}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/70 mt-1">
            Complete los datos de registro para la hoja de vida.
          </DialogDescription>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 bg-card">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Habitación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 101" className="rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Documento / Pasaporte</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. AB123456" className="rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-semibold">Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del huésped" className="rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Fecha Entrada</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Fecha Salida</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-semibold">Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Preferencias, alergias, etc." 
                      className="resize-none rounded-xl border-border/50 bg-secondary/50 focus-visible:ring-primary"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl hover-elevate">
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 hover-elevate shadow-md">
                {isPending ? "Guardando..." : "Guardar Registro"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

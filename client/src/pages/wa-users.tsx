import { useState } from "react";
import { useWaUsers, useCreateWaUser, useUpdateWaUser, useDeleteWaUser } from "@/hooks/use-wa-users";
import { Users, Plus, Trash2, Pencil, Phone, ShieldCheck, Hash, AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WaUser, InsertWaUser } from "@shared/schema";

const ROLE_LABELS: Record<string, string> = {
  tecnico: "Técnico",
  supervisor: "Supervisor",
  recepcion: "Recepción",
};

const ROLE_COLORS: Record<string, string> = {
  tecnico: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30",
  supervisor: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30",
  recepcion: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30",
};

function UserFormDialog({ user, trigger, onClose }: { user?: WaUser; trigger: React.ReactNode; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "tecnico");
  const createUser = useCreateWaUser();
  const updateUser = useUpdateWaUser();

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o && user) { setName(user.name); setPhone(user.phone); setRole(user.role); }
    if (!o) { setName(""); setPhone(""); setRole("tecnico"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const payload = { name, phone, role, active: true };
    if (user) {
      updateUser.mutate({ id: user.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createUser.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{user ? "Editar usuario" : "Nuevo usuario WhatsApp"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium block mb-1">Nombre completo</label>
            <Input
              placeholder="Ej: Carlos García"
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-user-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Número WhatsApp</label>
            <Input
              placeholder="+573001234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              data-testid="input-user-phone"
            />
            <p className="text-xs text-muted-foreground mt-1">Incluye el código de país. Ej: +57 para Colombia</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Rol</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="recepcion">Recepción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : user ? "Guardar cambios" : "Agregar usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WaUsers() {
  const { data: users, isLoading } = useWaUsers();
  const deleteUser = useDeleteWaUser();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Usuarios WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona quién puede crear y resolver pendientes vía WhatsApp
          </p>
        </div>
        <UserFormDialog
          trigger={
            <Button data-testid="button-add-user">
              <Plus className="mr-2 h-4 w-4" /> Agregar usuario
            </Button>
          }
        />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />¿Cómo funciona?</h3>
        <p className="text-sm text-muted-foreground">
          Cuando un usuario registrado envíe un mensaje o foto por WhatsApp, el sistema lo identifica por número, vincula el contenido al espacio indicado en el mensaje, y guarda automáticamente la imagen en la galería del espacio.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Texto */}
          <div className="p-3 bg-secondary/40 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-foreground">💬 Mensaje de texto</p>
            <p className="text-[11px] font-mono text-muted-foreground break-all">
              POST /api/webhook/whatsapp
            </p>
            <p className="text-[11px] font-mono bg-background/60 rounded p-2 break-all">
              {`{ "from": "+57300...",\n  "body": "101: TV dañada pendiente" }`}
            </p>
          </div>

          {/* Foto con URL */}
          <div className="p-3 bg-secondary/40 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-foreground">📸 Foto con URL</p>
            <p className="text-[11px] font-mono text-muted-foreground break-all">
              POST /api/webhook/whatsapp
            </p>
            <p className="text-[11px] font-mono bg-background/60 rounded p-2 break-all">
              {`{ "from": "+57300...",\n  "body": "LOBBY: mancha pared",\n  "mediaUrl": "https://cdn.wa.../foto.jpg",\n  "mediaType": "image/jpeg" }`}
            </p>
          </div>

          {/* Foto base64 */}
          <div className="p-3 bg-secondary/40 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-foreground">🖼️ Foto en Base64</p>
            <p className="text-[11px] font-mono bg-background/60 rounded p-2 break-all">
              {`{ "from": "+57300...",\n  "body": "101: revisión AC",\n  "mediaBase64": "data:image/jpeg;base64,...",\n  "mediaType": "image/jpeg" }`}
            </p>
          </div>

          {/* WhatsApp Cloud API */}
          <div className="p-3 bg-secondary/40 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-foreground">☁️ WhatsApp Cloud API</p>
            <p className="text-[11px] font-mono bg-background/60 rounded p-2 break-all">
              {`{ "entry": [{ "changes": [{ "value": {\n  "messages": [{ "type": "image",\n    "from": "+57300...",\n    "image": { "url": "https://...",\n    "caption": "SUB-1: revisión", "mime_type": "image/jpeg" }\n  }]\n}}]}]}`}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          🔑 El código del espacio va al inicio del mensaje seguido de dos puntos: <strong>"101: descripción"</strong>, <strong>"LOBBY: descripción"</strong>, etc.
        </p>
      </div>

      {/* ── Referencia rápida de palabras clave ── */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" /> Referencia rápida de palabras clave
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Código de espacio */}
          <div className="rounded-xl border border-border/60 p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-primary" /> Código del espacio
            </p>
            <p className="text-xs text-muted-foreground">
              Va <strong>al inicio</strong> del mensaje, seguido de dos puntos (<code>:</code>).
            </p>
            <div className="space-y-1">
              {[
                { code: "101", desc: "Habitación 101" },
                { code: "LOBBY", desc: "Lobby Principal" },
                { code: "SUB-1", desc: "Subestación 1" },
                { code: "COCINA", desc: "Cocina Central" },
                { code: "RCI", desc: "Red Contra Incendio" },
              ].map(({ code, desc }) => (
                <div key={code} className="flex items-center gap-2 text-xs">
                  <code className="bg-primary/10 text-primary font-mono px-1.5 py-0.5 rounded text-[10px]">{code}:</code>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Palabras que crean ticket */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Crean un pendiente automático
            </p>
            <p className="text-xs text-muted-foreground">
              Si el mensaje contiene alguna de estas palabras, se genera un ticket de mantenimiento.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {["pendiente", "dañado", "avería", "falla"].map(kw => (
                <span key={kw} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-mono px-2 py-0.5 rounded-full border border-amber-300/50">
                  {kw}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Ej: <em>"101: <strong>dañado</strong> el aire acondicionado"</em>
            </p>
          </div>

          {/* Fotos */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <Camera className="h-3.5 w-3.5" /> Fotos desde WhatsApp
            </p>
            <p className="text-xs text-muted-foreground">
              Si el mensaje incluye una imagen, se guarda automáticamente en la galería del espacio.
            </p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>• El <strong>caption</strong> de la foto debe incluir el código del espacio.</p>
              <p>• Ej: caption <em>"101: revisión AC"</em></p>
              <p>• La foto aparece en la pestaña <strong>Fotos</strong> del espacio.</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">Cargando usuarios...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users?.map(u => (
            <Card key={u.id} className="border border-border/50 shadow-sm hover-elevate">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{u.name}</span>
                    <Badge variant="outline" className={`text-xs shrink-0 ${ROLE_COLORS[u.role] || ""}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs">{u.phone}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs ${u.active ? "text-green-600" : "text-muted-foreground"}`}>
                      {u.active ? "● Activo" : "○ Inactivo"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <UserFormDialog
                    user={u}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-user-${u.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeletingId(u.id)}
                    data-testid={`button-delete-user-${u.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {users?.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={deletingId !== null} onOpenChange={o => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deletingId) deleteUser.mutate(deletingId); setDeletingId(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useRef } from "react";
import { useSpacePhotos, useUploadSpacePhoto, useDeleteSpacePhoto } from "@/hooks/use-photos";
import { useWaUsers } from "@/hooks/use-wa-users";
import { Camera, Upload, Trash2, X, ZoomIn, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  spaceId: number;
  spaceCode: string;
}

export function PhotoGallery({ spaceId, spaceCode }: PhotoGalleryProps) {
  const { data: photos, isLoading } = useSpacePhotos(spaceId);
  const uploadPhoto = useUploadSpacePhoto(spaceId);
  const deletePhoto = useDeleteSpacePhoto(spaceId);
  const { data: waUsers } = useWaUsers();
  const { toast } = useToast();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 16));
  const [sender, setSender] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("photo", selectedFile);
    fd.append("caption", caption);
    fd.append("takenAt", new Date(takenAt).toISOString());
    if (sender) fd.append("sender", sender);

    uploadPhoto.mutate(fd, {
      onSuccess: () => {
        toast({ title: "Foto subida", description: "La foto fue guardada correctamente." });
        setUploadOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption("");
        setSender("");
        setTakenAt(new Date().toISOString().slice(0, 16));
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    setUploadOpen(open);
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setSender("");
      setTakenAt(new Date().toISOString().slice(0, 16));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Registro fotográfico del espacio con fecha de realización
        </p>
        <Dialog open={uploadOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-upload-photo">
              <Camera className="mr-1.5 h-4 w-4" /> Subir foto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir foto — {spaceCode}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 mt-2">
              {/* File drop zone */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                onClick={() => fileRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-48 object-cover rounded-lg" />
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Haz clic para seleccionar imagen</p>
                    <p className="text-xs mt-1">JPG, PNG, WEBP — máx. 10 MB</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-photo-file"
                />
              </div>

              {/* Fecha de realización */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  <Calendar className="inline h-3.5 w-3.5 mr-1" />
                  Fecha de realización *
                </label>
                <Input
                  type="datetime-local"
                  value={takenAt}
                  onChange={e => setTakenAt(e.target.value)}
                  required
                  data-testid="input-photo-date"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm font-medium block mb-1">Descripción / observación</label>
                <Textarea
                  placeholder="Ej: Reparación completada, cambio de filtro, etc."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Quién subió */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  <User className="inline h-3.5 w-3.5 mr-1" />
                  Enviado por
                </label>
                <Select value={sender} onValueChange={setSender}>
                  <SelectTrigger data-testid="select-photo-sender">
                    <SelectValue placeholder="Seleccionar usuario (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin especificar</SelectItem>
                    {waUsers?.map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name} — {u.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={!selectedFile || uploadPhoto.isPending}>
                {uploadPhoto.isPending ? "Subiendo..." : "Guardar foto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery grid */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando fotos...</div>
      ) : photos?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay fotos registradas</p>
          <p className="text-sm mt-1">Sube la primera foto de este espacio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos?.map(photo => (
            <div key={photo.id} className="group relative bg-secondary/30 rounded-xl overflow-hidden border border-border/50 shadow-sm">
              {/* Image */}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.caption || "Foto de mantenimiento"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setLightboxPhoto(`/uploads/${photo.filename}`)}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setDeletingId(photo.id)}
                    data-testid={`button-delete-photo-${photo.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className="p-2">
                {photo.caption && (
                  <p className="text-xs font-medium leading-tight mb-1 truncate">{photo.caption}</p>
                )}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {photo.takenAt ? format(new Date(photo.takenAt), "dd MMM yyyy HH:mm", { locale: es }) : "Sin fecha"}
                </div>
                {photo.sender && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <User className="h-3 w-3" />
                    <span className="truncate">{photo.sender}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-5 w-5" />
          </Button>
          <img
            src={lightboxPhoto}
            alt="Vista ampliada"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={o => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription>La foto se eliminará permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deletingId) deletePhoto.mutate(deletingId); setDeletingId(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, ImagePlus, X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { submitClientPhoto } from "@/integrations/api";

const PRESTATION_TYPES = [
  "Ongles",
  "Sourcils",
  "Cils",
  "Press On Nails",
  "Autre",
];

interface Props { trigger: React.ReactNode; }

export const ClientPhotoForm = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxW = 800): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxW) { height = (height / width) * maxW; width = maxW; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList) => {
    const maxFiles = 5;
    const remaining = maxFiles - photos.length;
    if (remaining <= 0) { toast.error("Maximum 5 photos"); return; }
    const toProcess = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(toProcess.map(f => compressImage(f)));
    setPhotos(prev => [...prev, ...compressed]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const first_name = (formData.get("first_name") as string || "").trim();
    const last_name = (formData.get("last_name") as string || "").trim();
    const prestation_type = formData.get("prestation_type") as string || "";

    if (!first_name) { toast.error("Le prénom est requis"); return; }
    if (!last_name) { toast.error("Le nom est requis"); return; }
    if (!prestation_type) { toast.error("Sélectionnez le type de prestation"); return; }
    if (photos.length === 0) { toast.error("Ajoutez au moins une photo"); return; }

    setIsSubmitting(true);
    try {
      await submitClientPhoto({
        first_name,
        last_name,
        prestation_type,
        message: (formData.get("message") as string || "").trim() || undefined,
        photos,
      });
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center">
                Partagez votre résultat
              </DialogTitle>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Montrez à quel point vous êtes belle après votre passage chez Maison Belle ✨
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input id="first_name" name="first_name" placeholder="Votre prénom" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input id="last_name" name="last_name" placeholder="Votre nom" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestation_type">Prestation réalisée</Label>
                <select
                  id="prestation_type"
                  name="prestation_type"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Sélectionnez...</option>
                  {PRESTATION_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Photos {photos.length > 0 && <span className="text-muted-foreground">({photos.length}/5)</span>}</Label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-gold hover:text-gold transition-colors">
                      <ImagePlus className="h-6 w-6" />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                <p className="text-xs text-muted-foreground">Format JPEG/PNG · Max 5 photos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message <span className="text-muted-foreground">(optionnel)</span></Label>
                <Textarea id="message" name="message" placeholder="Votre expérience en quelques mots..." rows={3} />
              </div>

              <Button type="submit" className="w-full gradient-gold text-gold-foreground font-medium" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                {isSubmitting ? "Envoi en cours..." : "Envoyer mon retour"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="font-display text-xl">Merci {photos.length > 0 ? "🥰" : ""} !</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Votre retour a bien été envoyé. Il sera visible après validation par notre équipe.
            </p>
            <Button onClick={handleClose} variant="outline" className="mt-4">Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

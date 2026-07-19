import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Eye, EyeClosed, Check, Loader2, GraduationCap } from "lucide-react";
import { z } from "zod";
import { createFormation } from "@/integrations/api";

const formSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  phone: z.string().trim().min(6, "Téléphone invalide").max(20),
  email: z.string().trim().email("Email invalide").max(120),
});

interface Props { trigger: React.ReactNode; }

export const FormationDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"ongles" | "cils" | "sourcils" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(1); setType(null); setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!type) {
      toast.error("Veuillez choisir une formation");
      return;
    }
    setSubmitting(true);
    try {
      await createFormation({
        type,
        client_name: parsed.data.name,
        client_phone: parsed.data.phone,
        client_email: parsed.data.email,
      });
    } catch (error) {
      setSubmitting(false);
      toast.error("Erreur lors de l'envoi de la demande");
      return;
    }
    setSubmitting(false);
    toast.success("Demande envoyée ✨", {
      description: "La formatrice vous recontactera par email.",
    });
    setOpen(false);
    setTimeout(reset, 400);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 400); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 1 ? "Demander une formation" : "Vos coordonnées"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Choisissez le domaine de la formation</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setType("ongles"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <Sparkles className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Ongles</div>
              </button>
              <button onClick={() => { setType("cils_sourcils"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <Eye className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Cils / Sourcils</div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="rounded-xl bg-secondary p-3 text-sm">
              <span className="text-muted-foreground">Formation : </span>
              {type === "ongles" ? "Ongles" : "Cils / Sourcils"}
            </div>
            <div>
              <Label htmlFor="f-name">Nom complet</Label>
              <Input id="f-name" name="name" required maxLength={80} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="f-phone">Téléphone</Label>
              <Input
                id="f-phone"
                name="phone"
                type="tel"
                required
                maxLength={20}
                className="mt-1"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  e.target.value = val.slice(0, 20);
                }}
              />
            </div>
            <div>
              <Label htmlFor="f-email">Email</Label>
              <Input id="f-email" name="email" type="email" required maxLength={120} className="mt-1" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Envoyer ma demande</>}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)} disabled={submitting}>
              ← Retour
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

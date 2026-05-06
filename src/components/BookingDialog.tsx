import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Eye, Check } from "lucide-react";

const services = {
  ongles: [
    { name: "Pose gel", duration: "1h45", price: "55€" },
    { name: "Remplissage", duration: "1h30", price: "45€" },
    { name: "Vernis semi-permanent", duration: "1h", price: "35€" },
    { name: "Nail art (par ongle)", duration: "+15min", price: "+5€" },
    { name: "Dépose", duration: "30min", price: "15€" },
  ],
  sourcils: [
    { name: "Épilation sourcils", duration: "20min", price: "15€" },
    { name: "Restructuration", duration: "30min", price: "25€" },
    { name: "Brow lift (rehaussement)", duration: "45min", price: "45€" },
    { name: "Teinture sourcils", duration: "20min", price: "20€" },
    { name: "Microblading", duration: "2h", price: "350€" },
  ],
};

const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"];

interface Props {
  trigger: React.ReactNode;
}

export const BookingDialog = ({ trigger }: Props) => {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"ongles" | "sourcils" | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<string | null>(null);

  const reset = () => {
    setStep(1); setCategory(null); setService(null); setDate(""); setSlot(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Rendez-vous confirmé ✨", {
      description: `${service} le ${date} à ${slot}. Un email de confirmation vous a été envoyé.`,
    });
    setOpen(false);
    setTimeout(reset, 400);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 400); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Réserver — étape {step}/4
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Choisissez votre catégorie</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setCategory("ongles"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center group">
                <Sparkles className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Ongles</div>
              </button>
              <button onClick={() => { setCategory("sourcils"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <Eye className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Sourcils</div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && category && (
          <div className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground">Sélectionnez votre prestation</p>
            {services[category].map((s) => (
              <button key={s.name} onClick={() => { setService(s.name); setStep(3); }}
                className="w-full flex justify-between items-center rounded-xl border border-border p-4 hover:border-gold hover:bg-secondary transition text-left">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.duration}</div>
                </div>
                <div className="text-gold font-medium">{s.price}</div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <div>
              <Label>Date</Label>
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            {date && (
              <div>
                <Label>Créneaux disponibles</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {slots.map((t) => (
                    <button key={t} onClick={() => setSlot(t)}
                      className={`rounded-xl border p-2 text-sm transition ${slot === t ? "border-gold bg-secondary text-primary" : "border-border hover:border-gold"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button disabled={!date || !slot} onClick={() => setStep(4)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Continuer
            </Button>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="rounded-xl bg-secondary p-3 text-sm">
              <div><span className="text-muted-foreground">Prestation : </span>{service}</div>
              <div><span className="text-muted-foreground">Date : </span>{date} à {slot}</div>
            </div>
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" required maxLength={80} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" required maxLength={20} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required maxLength={120} className="mt-1" />
            </div>
            <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
              <Check className="mr-2 h-4 w-4" /> Confirmer ma réservation
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Confirmation par email + SMS. Rappel 24h avant.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

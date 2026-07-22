import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Eye, Check, Loader2, EyeClosed } from "lucide-react";
import { createAppointment, getPrestations, API_URL } from "@/integrations/api";
import { z } from "zod";
//commmentaire pour tester le déploiement sur vercel, à supprimer après
const ALL_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"];

const formSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  phone: z.string().trim().min(6, "Téléphone invalide").max(20),
  email: z.string().trim().email("Email invalide").max(120),
});

interface Prestation {
  id: number;
  category: string;
  name: string;
  duration: string;
  price: string;
}

interface Props { trigger: React.ReactNode; }

export const BookingDialog = ({ trigger }: Props) => {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"ongles" | "sourcils" | "cils" | "rehaussement de cils" | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [prestationsLoading, setPrestationsLoading] = useState(false);
  const [prestationsError, setPrestationsError] = useState(false);

  const loadPrestations = () => {
    setPrestationsLoading(true);
    setPrestationsError(false);
    getPrestations()
      .then(setPrestations)
      .catch((err) => {
        console.error(err);
        setPrestationsError(true);
      })
      .finally(() => setPrestationsLoading(false));
  };

  useEffect(() => {
    if (open) loadPrestations();
  }, [open]);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setSlot(null);
    fetch(`${API_URL}/api/booked-slots?date=${date}`)
      .then(res => res.json())
      .then(data => {
        setBookedSlots((data || []).map((r: any) => r.appointment_time));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [date]);

  const reset = () => {
    setStep(1); setCategory(null); setService(null); setDate(""); setSlot(null); setBookedSlots([]);
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
    setSubmitting(true);
    try {
      await createAppointment({
        category: category!,
        service: service!,
        appointment_date: date,
        appointment_time: slot!,
        client_name: parsed.data.name,
        client_phone: parsed.data.phone,
        client_email: parsed.data.email,
      });
    } catch (error) {
      setSubmitting(false);
      toast.error("Erreur lors de la réservation");
      return;
    }
    setSubmitting(false);
    toast.success("Rendez-vous confirmé ✨", {
      description: `${service} le ${date} à ${slot}`,
    });
    setOpen(false);
    setTimeout(reset, 400);
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredServices = prestations.filter(p => {
    if (category === "rehaussement de cils") return p.name.startsWith("Rehaussement de cils");
    return p.category === category && !p.name.startsWith("Rehaussement de cils");
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 400); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Réserver — étape {step}/4</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Choisissez votre catégorie</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setCategory("ongles"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <Sparkles className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Ongles</div>
              </button>
              <button onClick={() => { setCategory("sourcils"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <Eye className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Sourcils</div>
              </button>
              <button onClick={() => { setCategory("cils"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <EyeClosed className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Cils</div>
              </button>
              <button onClick={() => { setCategory("rehaussement de cils"); setStep(2); }}
                className="rounded-2xl border border-border p-6 hover:border-gold hover:bg-secondary transition text-center">
                <EyeClosed className="mx-auto mb-2 text-gold" />
                <div className="font-display text-lg">Rehaussement de cils</div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && category && (
          <div className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground">Sélectionnez votre prestation</p>
            {prestationsLoading && (
              <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement des prestations...
              </div>
            )}
            {!prestationsLoading && prestationsError && (
              <div className="p-8 text-center space-y-3">
                <p className="text-muted-foreground text-sm">Impossible de charger les prestations.</p>
                <Button variant="outline" onClick={loadPrestations} className="rounded-full">Réessayer</Button>
              </div>
            )}
            {!prestationsLoading && !prestationsError && filteredServices.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Aucune prestation disponible pour cette catégorie.</div>
            )}
            {!prestationsLoading && filteredServices.map((s) => (
              <button key={s.id} onClick={() => { setService(s.name); setStep(3); }}
                className="w-full flex justify-between items-center rounded-xl border border-border p-4 hover:border-gold hover:bg-secondary transition text-left">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.duration}</div>
                </div>
                <div className="text-gold font-medium whitespace-nowrap">{s.price}</div>
              </button>
            ))}
            <Button variant="ghost" className="w-full mt-2" onClick={() => setStep(1)}>
              ← Retour
            </Button>
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
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gold" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ALL_SLOTS.map((t) => {
                      const taken = bookedSlots.includes(t);
                      return (
                        <button key={t} disabled={taken} onClick={() => setSlot(t)}
                          className={`rounded-xl border p-2 text-sm transition ${
                            taken ? "opacity-30 line-through cursor-not-allowed" :
                            slot === t ? "border-gold bg-secondary text-primary" : "border-border hover:border-gold"
                          }`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>
                ← Retour
              </Button>
              <Button disabled={!date || !slot} onClick={() => setStep(4)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                Continuer
              </Button>
            </div>
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
              <Input id="name" name="name" required maxLength={80} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                required 
                maxLength={10} 
                className="mt-1" 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Keep only digits
                  if (val.length <= 10) {
                    e.target.value = val;
                  } else {
                    e.target.value = val.slice(0, 10);
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required maxLength={120} className="mt-1" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Confirmer</>}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(3)} disabled={submitting}>
              ← Retour
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

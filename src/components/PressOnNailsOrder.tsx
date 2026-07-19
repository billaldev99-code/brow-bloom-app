import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Sparkles, 
  Check, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  MapPin, 
  Package,
  Plus,
  Minus,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createOrder } from "@/integrations/api";
import nailsImg from "@/assets/nails.jpg";
import { useEffect } from "react";

interface ItemPON {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
}

interface Props {
  trigger: React.ReactNode;
}

const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira", 
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", 
  "Skikda", "Sidi Bel Abbès", "Anaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", 
  "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf", "Tindouf", 
  "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", 
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", 
  "In Guezzam", "Touggourt", "Djanet", "M'Ghair", "El Meniaa"
];

const PON_MODELS: ItemPON[] = [
  { id: 1, name: "Classique", price: 1500, description: "", image_url: "" },
  { id: 2, name: "French", price: 1800, description: "", image_url: "" },
  { id: 3, name: "Baby Boomer", price: 1800, description: "", image_url: "" },
  { id: 4, name: "Effet Chrome", price: 1800, description: "", image_url: "" },
  { id: 5, name: "Nail Art", price: 2000, description: "à partir de", image_url: "" },
];

const formatPrice = (n: number) => `${n.toLocaleString("fr-FR")} DA`;

export const PressOnNailsOrder = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"hands" | "feet" | null>(null);
  const [forme, setForme] = useState<string | null>(null);
  const [taille, setTaille] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{id: number, qty: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [prestations, setPrestations] = useState<ItemPON[]>(PON_MODELS);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    wilaya: "",
    commune: "",
    notes: ""
  });

  const reset = () => {
    setStep(1);
    setType(null);
    setForme(null);
    setTaille(null);
    setSelectedItems([]);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      wilaya: "",
      commune: "",
      notes: ""
    });
  };

  const handlePrestationToggle = (id: number) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        return [...prev, { id, qty: 1 }];
      }
    });
  };

  const updateItemQty = (id: number, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const totalPrice = selectedItems.reduce((acc, item) => {
    const p = prestations.find(p => p.id === item.id);
    return acc + ((p?.price || 0) * item.qty);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const orderData = {
        type,
        forme,
        taille,
        selected_prestations: selectedItems.map(item => {
          const p = prestations.find(p => p.id === item.id);
          return `${p?.name || 'Inconnu'} (x${item.qty})`;
        }),
        quantity: selectedItems.reduce((acc, item) => acc + item.qty, 0),
        total_price: totalPrice,
        client_name: formData.name,
        client_phone: formData.phone,
        client_email: formData.email,
        address: formData.address,
        wilaya: formData.wilaya,
        commune: formData.commune,
        notes: formData.notes
      };
      
      await createOrder(orderData);
      toast.success("Commande envoyée avec succès ! ✨");
      setStep(8); // Success step
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Une erreur est survenue lors de l'envoi de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const isFeet = type === "feet";
  const totalSteps = isFeet ? 5 : 7;
  const displayStep = isFeet
    ? (step === 1 ? 1 : step === 2 ? 2 : step === 5 ? 3 : step === 6 ? 4 : step === 7 ? 5 : step)
    : step;
  const progress = (displayStep / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(reset, 400); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-card p-0 overflow-hidden sm:rounded-3xl border-none shadow-elegant">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <DialogTitle className="font-display text-3xl">Commander vos Press On Nails</DialogTitle>
                {displayStep <= totalSteps && <p className="text-muted-foreground mt-1">Étape {displayStep} sur {totalSteps}</p>}
              </div>
              <ShoppingBag className="text-gold h-8 w-8" />
            </div>
            {displayStep <= totalSteps && <Progress value={progress} className="h-1.5 bg-secondary" />}
          </DialogHeader>

          <div className="min-h-[400px]">
            {/* STEP 1: CHOICE OF TYPE */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium">Pour quelle zone ?</h3>
                  <p className="text-sm text-muted-foreground">Sélectionnez le type de Press On Nails que vous souhaitez.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setType("hands"); nextStep(); }}
                    className={cn(
                      "group relative p-8 rounded-3xl border-2 transition-all duration-300 text-center space-y-4",
                      type === "hands" ? "border-gold bg-secondary/50" : "border-border hover:border-gold/50 hover:bg-secondary/20"
                    )}
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="text-gold h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="font-display text-2xl">Mains</h4>
                      <p className="text-sm text-muted-foreground mt-1">Capsules sur mesure pour sublimer vos mains.</p>
                    </div>
                    {type === "hands" && <CheckCircle2 className="absolute top-4 right-4 text-gold h-6 w-6" />}
                  </button>

                  <button
                    onClick={() => { setType("feet"); setStep(2); }}
                    className={cn(
                      "group relative p-8 rounded-3xl border-2 transition-all duration-300 text-center space-y-4",
                      type === "feet" ? "border-gold bg-secondary/50" : "border-border hover:border-gold/50 hover:bg-secondary/20"
                    )}
                  >
                    <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="text-gold h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="font-display text-2xl">Pieds</h4>
                      <p className="text-sm text-muted-foreground mt-1">L'élégance jusqu'au bout des orteils.</p>
                    </div>
                    {type === "feet" && <CheckCircle2 className="absolute top-4 right-4 text-gold h-6 w-6" />}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOICE OF FORME (mains only) */}
            {step === 2 && !isFeet && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium">Quelle forme souhaitez-vous ?</h3>
                  <p className="text-sm text-muted-foreground">Sélectionnez la forme de vos Press On Nails.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Amande", "Carrée", "Carrée arrondie", "Coffin (Ballerine)", "Stiletto", "Ovale"].map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => { setForme(f); setStep(3); }}
                      className={cn(
                        "p-5 rounded-2xl border-2 transition-all duration-300 text-center",
                        forme === f ? "border-gold bg-secondary/50" : "border-border hover:border-gold/50 hover:bg-secondary/20"
                      )}
                    >
                      <span className="font-display text-lg">{f}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: CHOICE OF TAILLE (mains only) */}
            {step === 3 && !isFeet && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium">Quelle taille ?</h3>
                  <p className="text-sm text-muted-foreground">Sélectionnez votre taille.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["S", "M", "L", "XL"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => { setTaille(t); setStep(4); }}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all duration-300 text-center",
                        taille === t ? "border-gold bg-secondary/50" : "border-border hover:border-gold/50 hover:bg-secondary/20"
                      )}
                    >
                      <span className="font-display text-2xl">{t}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 (mains) / STEP 2 (pieds): CHOICE OF SERVICE */}
            {(step === 4 || (step === 2 && isFeet)) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium">Choisissez vos modèles</h3>
                  <span className="text-sm bg-secondary px-3 py-1 rounded-full text-gold font-medium">
                    {selectedItems.length} sélectionné(s)
                  </span>
                </div>

                {prestations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed rounded-3xl">
                    <Package className="h-10 w-10 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground text-center px-6">
                      Aucun modèle n'est disponible pour le moment.<br/>Revenez plus tard ou contactez-nous.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {prestations.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePrestationToggle(p.id)}
                        className={cn(
                          "group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 text-left",
                          selectedItems.some(item => item.id === p.id) ? "border-gold" : "border-border hover:border-gold/30"
                        )}
                      >
                        <div className="aspect-square relative overflow-hidden bg-secondary">
                          {p?.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                          )}
                          {selectedItems.some(item => item.id === p.id) && (
                            <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                              <div className="bg-gold text-white rounded-full p-2">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="font-medium text-sm truncate">{p.name}</div>
                          <div className="text-gold font-bold text-xs">{p.description ? p.description + " " : ""}{formatPrice(p.price)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => isFeet ? setStep(1) : setStep(3)} className="flex-1 rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button 
                    disabled={selectedItems.length === 0} 
                    onClick={() => setStep(5)} 
                    className="flex-[2] bg-primary rounded-full"
                  >
                    Continuer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: QUANTITY */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-medium">Quantités par modèle</h3>
                  <p className="text-sm text-muted-foreground">Précisez le nombre de sets pour chaque modèle choisi.</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedItems.map((item) => {
                    const p = prestations.find(p => p.id === Number(item.id));
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-3">
                          {p?.image_url && <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                          <div>
                            <div className="font-medium text-sm">{p?.name || 'Inconnu'}</div>
                            <div className="text-gold text-xs font-bold">{formatPrice(p?.price || 0)} / unité</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => updateItemQty(item.id, -1)}
                            className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-xl font-display min-w-[20px] text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateItemQty(item.id, 1)}
                            className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-secondary/40 rounded-3xl p-6 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-gold" /> Récapitulatif
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zone :</span>
                      <span className="font-medium">{type === "hands" ? "Mains" : "Pieds"}</span>
                    </div>
                    {type === "hands" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Forme :</span>
                          <span className="font-medium">{forme}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taille :</span>
                          <span className="font-medium">{taille}</span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-border/50 pt-2 flex justify-between text-lg font-display">
                      <span>Total :</span>
                      <span className="text-gold">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 text-xs text-center border border-gold/10">
                    ⏱️ Temps estimé de préparation : <span className="font-bold">3-5 jours ouvrés</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => isFeet ? setStep(2) : setStep(4)} className="flex-1 rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button onClick={nextStep} className="flex-[2] bg-primary rounded-full">
                    Informations de livraison <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: CLIENT INFO */}
            {step === 6 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gold" /> Nom complet
                    </Label>
                    <Input 
                      id="name" 
                      required 
                      placeholder="Jane Doe" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="rounded-xl border-border/50 focus:border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-gold" /> Téléphone
                    </Label>
                    <Input 
                      id="phone" 
                      required 
                      type="tel" 
                      placeholder="05 XX XX XX XX" 
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, ""); // Keep only digits
                        if (val.length <= 10) {
                          setFormData({...formData, phone: val});
                        }
                      }}
                      maxLength={10}
                      className="rounded-xl border-border/50 focus:border-gold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold" /> Email
                    </Label>
                    <Input 
                      id="email" 
                      required 
                      type="email" 
                      placeholder="jane@example.com" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="rounded-xl border-border/50 focus:border-gold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Adresse complète de livraison</Label>
                    <Input 
                      id="address" 
                      required 
                      placeholder="Rue, quartier, n° de porte..." 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="rounded-xl border-border/50 focus:border-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wilaya">Wilaya</Label>
                    <select 
                      id="wilaya" 
                      required
                      value={formData.wilaya}
                      onChange={e => setFormData({...formData, wilaya: e.target.value})}
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="">Sélectionnez</option>
                      {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune</Label>
                    <Input 
                      id="commune" 
                      required 
                      placeholder="Ex: Akbou" 
                      value={formData.commune}
                      onChange={e => setFormData({...formData, commune: e.target.value})}
                      className="rounded-xl border-border/50 focus:border-gold"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={prevStep} className="flex-1 rounded-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </Button>
                  <Button type="submit" className="flex-[2] bg-primary rounded-full">
                    Récapitulatif final <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 7: CONFIRMATION SUMMARY */}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-secondary/30 rounded-3xl p-6 space-y-4 border border-gold/10">
                  <h3 className="text-xl font-display border-b border-border pb-2">Résumé de la commande</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-bold uppercase text-[10px] tracking-widest text-gold">Produits</h4>
                      <div className="space-y-2">
                        <p><span className="text-muted-foreground">Type :</span> {type === "hands" ? "Mains" : "Pieds"}</p>
                        {type === "hands" && (
                          <>
                            <p><span className="text-muted-foreground">Forme :</span> {forme}</p>
                            <p><span className="text-muted-foreground">Taille :</span> {taille}</p>
                          </>
                        )}
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Modèles :</span>
                          <ul className="pl-2 space-y-1">
                            {selectedItems.map(item => {
                              const p = prestations.find(p => p.id === item.id);
                              return (
                                <li key={item.id} className="flex justify-between items-center bg-white/40 px-2 py-1 rounded-md text-xs">
                                  <span>{p?.name}</span>
                                  <span className="font-bold text-gold">x{item.qty}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <p className="text-lg font-display text-gold pt-2 border-t border-gold/10">Total : {formatPrice(totalPrice)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold uppercase text-[10px] tracking-widest text-gold">Livraison</h4>
                      <div className="space-y-1">
                        <p className="font-medium">{formData.name}</p>
                        <p>{formData.phone}</p>
                        <p className="text-xs text-muted-foreground">{formData.address}</p>
                        <p className="text-xs text-muted-foreground">{formData.commune}, {formData.wilaya}</p>
                        <p className="text-xs text-gold font-medium pt-1">🚚 Livraison gratuite à Akbou</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full bg-gold hover:bg-gold/90 text-gold-foreground rounded-full h-12 text-lg shadow-gold"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                    Confirmer la commande
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(6)} className="text-muted-foreground">
                    Modifier mes informations
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 8: SUCCESS */}
            {step === 8 && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gold/30" />
                  <Check className="text-gold h-12 w-12 animate-in zoom-in duration-500 delay-200" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-4xl">Félicitations !</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Votre commande a été envoyée avec succès. Nous vous contacterons très prochainement pour confirmer les détails.
                  </p>
                </div>
                <Button 
                  onClick={() => { setOpen(false); setTimeout(reset, 400); }} 
                  className="bg-primary rounded-full px-12"
                >
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

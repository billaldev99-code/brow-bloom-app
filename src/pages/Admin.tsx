import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Loader2, Calendar, Users, Euro, LogOut, Trash2, Check, X, Star, 
  ShoppingBag, Package, Plus, Edit2, Image as ImageIcon, LayoutGrid, List, AlertCircle, UploadCloud
} from "lucide-react";
import { 
  getAppointments, 
  updateAppointmentStatus, 
  deleteAppointment, 
  getReviewsAll, 
  updateReviewStatus, 
  deleteReview,
  getOrders,
  updateOrderStatus,
  getPrestations,
  createPrestation,
  updatePrestation,
  deletePrestation,
  getItemsPON,
  createItemPON,
  updateItemPON,
  deleteItemPON,
  getGalleryItems,
  createGalleryItem,
  deleteGalleryItem
} from "@/integrations/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

interface Appointment {
  id: number;
  category: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  status: string;
  created_at: string;
}

interface Order {
  id: number;
  type: string;
  selected_prestations: string[];
  quantity: number;
  total_price: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  address: string;
  wilaya: string;
  commune: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  client_name: string;
  client_email: string | null;
  rating: number;
  review_text: string;
  approved: boolean;
  created_at: string;
}

interface Prestation {
  id: number;
  category: string;
  name: string;
  duration: string;
  price: string;
}

interface ItemPON {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface GalleryItem {
  id: number;
  image_url: string;
  title: string;
  description: string;
  media_type: 'image' | 'video';
}

// Helper for image compression
const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  if (base64Str.startsWith('data:video')) return Promise.resolve(base64Str); // Don't compress video strings here
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 70% quality
    };
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [itemsPON, setItemsPON] = useState<ItemPON[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/auth");
      return;
    }

    if (role !== "admin") {
      toast.error("Accès refusé : vous n'êtes pas administrateur.");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      navigate("/auth");
      return;
    }

    loadAll(token);
  }, []);

  const loadAll = async (token: string) => {
    setLoading(true);
    setErrors({});
    
    const tasks = [
      { name: 'appointments', fn: () => getAppointments(token), setter: setAppointments },
      { name: 'reviews', fn: () => getReviewsAll(token), setter: setReviews },
      { name: 'orders', fn: () => getOrders(token), setter: setOrders },
      { name: 'prestations', fn: () => getPrestations(), setter: setPrestations },
      { name: 'gallery', fn: () => getGalleryItems(), setter: setGallery },
      { name: 'pon', fn: () => getItemsPON(), setter: setItemsPON },
    ];

    await Promise.all(tasks.map(async (task) => {
      try {
        const data = await task.fn();
        task.setter(data);
      } catch (err) {
        console.error(`Failed to load ${task.name}:`, err);
        setErrors(prev => ({ ...prev, [task.name]: true }));
        if (['appointments', 'orders'].includes(task.name)) {
          toast.error(`Erreur de chargement des ${task.name}`);
        }
      }
    }));

    setLoading(false);
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateAppointmentStatus(id, status, token);
      toast.success("Mis à jour");
      const data = await getAppointments(token);
      setAppointments(data);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const updateStatusOrder = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateOrderStatus(id, status, token);
      toast.success("Commande mise à jour");
      const data = await getOrders(token);
      setOrders(data);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour de la commande");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteAppointment(id, token);
      toast.success("Supprimé");
      const data = await getAppointments(token);
      setAppointments(data);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const approveReview = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateReviewStatus(id, true, token);
      toast.success("Avis approuvé");
      const data = await getReviewsAll(token);
      setReviews(data);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const rejectReview = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateReviewStatus(id, false, token);
      toast.success("Avis rejeté");
      const data = await getReviewsAll(token);
      setReviews(data);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteReview(id, token);
      toast.success("Avis supprimé");
      const data = await getReviewsAll(token);
      setReviews(data);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-gold h-12 w-12" />
        <p className="text-muted-foreground font-display animate-pulse">Chargement de votre espace Maison Belle...</p>
      </div>
    );
  }

  const confirmed = appointments.filter(a => a.status === "confirmed");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  
  const revenueAppointments = confirmed.reduce((s, a) => {
    const p = prestations.find(p => p.name === a.service);
    const priceStr = p?.price || "0";
    const price = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
    return s + price;
  }, 0);
  
  const revenueOrders = confirmedOrders.reduce((s, o) => s + Number(o.total_price), 0);
  const totalRevenue = revenueAppointments + revenueOrders;

  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= new Date(new Date().toDateString()) && a.status !== "cancelled");
  const services = appointments.reduce((acc, a) => { acc[a.service] = (acc[a.service] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topService = Object.entries(services).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container flex justify-between items-center h-16">
          <h1 className="font-display text-xl">Maison <span className="text-gold">Belle</span> — Admin</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/")}>Voir le site</Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Déconnexion</Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Stat icon={Calendar} label="RDV à venir" value={upcoming.length} />
          <Stat icon={ShoppingBag} label="Commandes en attente" value={orders.filter(o => o.status === "pending").length} />
          <Stat icon={Euro} label="CA total confirmé" value={`${totalRevenue}€`} />
          <Stat icon={Check} label="Top prestation" value={topService?.[0] || "—"} small />
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-destructive text-sm">
            <AlertCircle className="h-5 w-5" />
            <p>Certaines sections n'ont pas pu être chargées (peut-être des images trop lourdes). Le reste fonctionne normalement.</p>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-xl h-auto flex flex-wrap justify-start gap-1">
            <TabsTrigger value="overview" className="rounded-lg py-2">Tableau de bord</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg py-2">Statistiques</TabsTrigger>
            <TabsTrigger value="prestations" className="rounded-lg py-2">Salon</TabsTrigger>
            <TabsTrigger value="pon" className="rounded-lg py-2">Press On Nails</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg py-2">Galerie</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg py-2">Avis Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* APPOINTMENTS */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h2 className="font-display text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gold" /> Rendez-vous ({appointments.length})
                  </h2>
                </div>
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {appointments.length === 0 && !errors.appointments && (
                    <div className="p-8 text-center text-muted-foreground text-sm">Aucun rendez-vous pour l'instant.</div>
                  )}
                  {errors.appointments && <div className="p-8 text-center text-destructive text-sm">Erreur lors du chargement des rendez-vous.</div>}
                  {appointments.map(a => (
                    <div key={a.id} className="p-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-secondary/50 rounded-lg p-2 min-w-[60px]">
                            <div className="text-xs font-bold uppercase">{new Date(a.appointment_date).toLocaleDateString("fr-FR", { month: "short" })}</div>
                            <div className="text-xl font-display leading-tight">{new Date(a.appointment_date).getDate()}</div>
                          </div>
                          <div>
                            <div className="font-medium">{a.client_name}</div>
                            <div className="text-xs text-muted-foreground">{a.appointment_time} · {a.client_phone}</div>
                          </div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider mb-1">{a.category}</Badge>
                          <div className="text-sm">{a.service}</div>
                        </div>
                        <div className="flex gap-1">
                          {a.status !== "confirmed" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(a.id, "confirmed")}><Check className="h-4 w-4 text-green-600" /></Button>
                          )}
                          {a.status !== "cancelled" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(a.id, "cancelled")}><X className="h-4 w-4 text-muted-foreground" /></Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* ORDERS */}
              <Card className="overflow-hidden border-gold/20">
                <div className="p-4 border-b border-border bg-gold/5 flex justify-between items-center">
                  <h2 className="font-display text-xl flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-gold" /> Commandes PON ({orders.length})
                  </h2>
                </div>
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {orders.length === 0 && !errors.orders && (
                    <div className="p-8 text-center text-muted-foreground text-sm">Aucune commande pour l'instant.</div>
                  )}
                  {errors.orders && <div className="p-8 text-center text-destructive text-sm">Erreur lors du chargement des commandes.</div>}
                  {orders.map(o => (
                    <div key={o.id} className="p-4 hover:bg-gold/5 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{o.client_name} <span className="text-[10px] text-muted-foreground">#PON-{o.id}</span></div>
                            <div className="text-xs text-muted-foreground">{o.client_phone} · {o.wilaya}</div>
                          </div>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 my-2 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type :</span>
                          <span className="capitalize">{o.type === 'hands' ? 'Mains' : 'Pieds'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modèles :</span>
                          <span className="text-xs text-right truncate max-w-[200px]">{o.selected_prestations.join(', ')}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-border mt-1 pt-1">
                          <span>Total :</span>
                          <span className="text-gold">{o.total_price}€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                          {o.address}, {o.commune}
                        </div>
                        <div className="flex gap-1">
                          {o.status !== "confirmed" && (
                            <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50" onClick={() => updateStatusOrder(o.id, "confirmed")}>
                              Confirmer
                            </Button>
                          )}
                          {o.status !== "shipped" && o.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => updateStatusOrder(o.id, "shipped")}>
                              Expédier
                            </Button>
                          )}
                          {o.status !== "cancelled" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatusOrder(o.id, "cancelled")}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="m-0">
            <StatsDashboard appointments={appointments} orders={orders} prestations={prestations} />
          </TabsContent>

          <TabsContent value="prestations" className="m-0">
            <PrestationManager data={prestations} onRefresh={() => loadAll(localStorage.getItem("token")!)} />
          </TabsContent>

          <TabsContent value="pon" className="m-0">
            <PONManager data={itemsPON} onRefresh={() => loadAll(localStorage.getItem("token")!)} />
          </TabsContent>

          <TabsContent value="gallery" className="m-0">
            <GalleryManager data={gallery} onRefresh={() => loadAll(localStorage.getItem("token")!)} />
          </TabsContent>

          <TabsContent value="reviews" className="m-0">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-display text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-gold" /> Avis clients ({reviews.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {reviews.length === 0 && !errors.reviews && (
                  <div className="p-8 text-center text-muted-foreground text-sm">Aucun avis pour l'instant.</div>
                )}
                {errors.reviews && <div className="p-8 text-center text-destructive text-sm">Erreur lors du chargement des avis.</div>}
                {reviews.map(r => (
                  <div key={r.id} className="p-4 flex flex-wrap items-center gap-4 hover:bg-secondary/30">
                    <div className="flex gap-1">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium">{r.client_name}</div>
                      <div className="text-sm text-muted-foreground italic">« {r.review_text} »</div>
                      {r.client_email && <div className="text-xs text-muted-foreground mt-1">{r.client_email}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <ReviewStatusBadge approved={r.approved} />
                    <div className="flex gap-1">
                      {!r.approved && (
                        <Button size="sm" variant="ghost" onClick={() => approveReview(r.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                      )}
                      {r.approved && (
                        <Button size="sm" variant="ghost" onClick={() => rejectReview(r.id)}><X className="h-4 w-4" /></Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeReview(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// PRESTATION MANAGER
const PrestationManager = ({ data, onRefresh }: { data: Prestation[], onRefresh: () => void }) => {
  const [editing, setEditing] = useState<Partial<Prestation> | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editing?.name) return;
    setLoading(true);
    try {
      if (editing.id) {
        await updatePrestation(editing.id, editing, token);
      } else {
        await createPrestation(editing, token);
      }
      toast.success("Enregistré avec succès");
      setEditing(null);
      onRefresh();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer cette prestation ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deletePrestation(id, token);
      toast.success("Supprimé");
      onRefresh();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl text-gold">Gestion des Prestations Salon</h2>
        <Button onClick={() => setEditing({ category: "ongles", name: "", duration: "", price: "" })} className="rounded-full bg-gold hover:bg-gold/90">
          <Plus className="h-4 w-4 mr-2" /> Ajouter une prestation
        </Button>
      </div>

      {editing && (
        <Card className="p-6 border-gold/30 bg-gold/5 animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-display text-lg mb-4">{editing.id ? "Modifier la prestation" : "Nouvelle prestation"}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editing.category}
                onChange={e => setEditing({...editing, category: e.target.value})}
              >
                <option value="ongles">Ongles</option>
                <option value="sourcils">Sourcils</option>
                <option value="cils">Cils</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Ex: Pose gel" />
            </div>
            <div className="space-y-2">
              <Label>Durée</Label>
              <Input value={editing.duration} onChange={e => setEditing({...editing, duration: e.target.value})} placeholder="Ex: 1h45" />
            </div>
            <div className="space-y-2">
              <Label>Prix</Label>
              <Input value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} placeholder="Ex: 60€" />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={save} disabled={loading} className="bg-primary text-white">
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {["ongles", "sourcils", "cils"].map(cat => (
          <Card key={cat} className="overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/50 font-bold uppercase text-xs tracking-widest flex items-center justify-between">
              {cat}
              <List className="h-3 w-3 text-gold" />
            </div>
            <div className="divide-y divide-border">
              {data.filter(p => p.category === cat).map(p => (
                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-secondary/20 group transition-colors">
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.duration} · {p.price}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)}><Edit2 className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// PON MANAGER
const PONManager = ({ data, onRefresh }: { data: ItemPON[], onRefresh: () => void }) => {
  const [editing, setEditing] = useState<Partial<ItemPON> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setEditing(prev => ({ ...prev, image_url: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editing?.name) return;
    setLoading(true);
    try {
      if (editing.id) {
        await updateItemPON(editing.id, editing, token);
      } else {
        await createItemPON(editing, token);
      }
      toast.success("Modèle PON enregistré");
      setEditing(null);
      onRefresh();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteItemPON(id, token);
      toast.success("Modèle supprimé");
      onRefresh();
    } catch (err) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl text-gold">Catalogue Press On Nails</h2>
        <Button onClick={() => setEditing({ name: "", description: "", price: 0, image_url: "" })} className="rounded-full bg-gold hover:bg-gold/90">
          <Plus className="h-4 w-4 mr-2" /> Ajouter un modèle
        </Button>
      </div>

      {editing && (
        <Card className="p-6 border-gold/30 bg-gold/5">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du modèle</Label>
                <Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Ex: French Classique" />
              </div>
              <div className="space-y-2">
                <Label>Prix (€)</Label>
                <Input type="number" value={editing.price} onChange={e => setEditing({...editing, price: Number(e.target.value)})} placeholder="Ex: 35" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} placeholder="Description courte..." />
              </div>
              <div className="space-y-2">
                <Label>Image (Upload)</Label>
                <Input type="file" accept="image/*" onChange={handleFileUpload} className="mb-2" />
                <p className="text-[10px] text-muted-foreground italic">Le site compresse automatiquement vos images pour qu'elles s'affichent partout.</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={save} disabled={loading} className="bg-primary text-white">
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Enregistrer
                </Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <Label>Aperçu carte</Label>
              <div className="mx-auto w-48 aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-soft relative bg-card flex items-center justify-center">
                {editing.image_url ? (
                   <img src={editing.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                )}
                <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 text-white text-[10px]">
                  {editing.name || "Nom du modèle"} - {editing.price || 0}€
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.map(item => (
          <div key={item.id} className="group bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:border-gold/50 transition-all">
            <div className="aspect-square relative overflow-hidden bg-secondary">
              <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm" onClick={() => setEditing(item)}><Edit2 className="h-3 w-3" /></Button>
                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="p-3">
              <div className="font-bold text-sm truncate">{item.name}</div>
              <div className="text-gold text-xs font-bold">{item.price}€</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// GALLERY MANAGER
const GalleryManager = ({ data, onRefresh }: { data: GalleryItem[], onRefresh: () => void }) => {
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingBatch, setUploadingBatch] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    const isVideo = file.type.startsWith('video/') || 
                    fileName.endsWith('.mp4') || 
                    fileName.endsWith('.mov') || 
                    fileName.endsWith('.webm');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      let content = reader.result as string;
      setEditing(prev => ({ 
        ...prev, 
        image_url: content, 
        media_type: isVideo ? 'video' : 'image' 
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    setUploadingBatch(true);
    let successCount = 0;
    
    toast.info(`Préparation de ${files.length} fichier(s)...`);

    for (const file of files) {
      try {
        const fileName = file.name.toLowerCase();
        const isVideo = file.type.startsWith('video/') || 
                        fileName.endsWith('.mp4') || 
                        fileName.endsWith('.mov') || 
                        fileName.endsWith('.webm');
        
        const base64 = await fileToBase64(file);
        await createGalleryItem({ 
          image_url: base64, 
          title: "", 
          description: "", 
          media_type: isVideo ? 'video' : 'image' 
        }, token);
        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} fichier(s) ajouté(s) à la galerie !`);
      onRefresh();
    } else {
      toast.error("Échec de l'envoi des fichiers.");
    }
    
    setUploadingBatch(false);
    e.target.value = ""; 
  };

  const save = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editing?.image_url) return;
    
    // Safety check: 20MB limit for base64 (approx 15MB file)
    if (editing.image_url.length > 20 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max ~15Mo).");
      return;
    }

    setLoading(true);
    try {
      await createGalleryItem(editing, token);
      toast.success("Élément ajouté");
      setEditing(null);
      onRefresh();
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message?.includes("413")) {
        toast.error("Fichier trop lourd pour le serveur.");
      } else if (err.name === "AbortError") {
        toast.error("Le téléchargement a pris trop de temps (timeout).");
      } else {
        toast.error("Erreur lors de l'ajout. Vérifiez la taille du fichier.");
      }
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer cet élément ?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteGalleryItem(id, token);
      toast.success("Élément supprimé");
      onRefresh();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl text-gold">Gestion Galerie</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full border-gold text-gold hover:bg-gold hover:text-white relative overflow-hidden" disabled={uploadingBatch}>
            {uploadingBatch ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
            {uploadingBatch ? "Envoi..." : "Ajout multiple"}
            <input type="file" multiple accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBatchUpload} disabled={uploadingBatch} />
          </Button>
          <Button onClick={() => setEditing({ image_url: "", title: "", description: "", media_type: 'image' })} className="rounded-full bg-gold hover:bg-gold/90">
            <Plus className="h-4 w-4 mr-2" /> Un élément
          </Button>
        </div>
      </div>

      {editing && (
        <Card className="p-6 border-gold/30 bg-gold/5">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fichier (Photo ou Vidéo)</Label>
                <Input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="mb-2" />
                <p className="text-[10px] text-muted-foreground italic">Le site compresse les images, les vidéos sont gardées telles quelles.</p>
              </div>
              <div className="space-y-2">
                <Label>Titre (Optionnel)</Label>
                <Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} placeholder="Ex: Pose Gel French" />
              </div>
              <div className="space-y-2">
                <Label>Description (Optionnelle)</Label>
                <Input value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} placeholder="Ex: Avec décoration strass" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={save} disabled={loading || !editing.image_url} className="bg-primary text-white">
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Ajouter à la galerie
                </Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <Label>Aperçu</Label>
              <div className="aspect-square rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-card">
                {editing.image_url ? (
                  editing.media_type === 'video' ? (
                    <video src={editing.image_url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={editing.image_url} className="w-full h-full object-cover" alt="Preview" />
                  )
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
            La galerie est vide. Ajoutez vos premières réalisations !
          </div>
        )}
        {data.map(item => (
          <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft">
            {item.media_type === 'video' ? (
              <video src={item.image_url} className="w-full h-full object-cover" muted loop onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
            ) : (
              <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.title || ""} />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              {item.title && <div className="text-white text-xs font-bold mb-1">{item.title}</div>}
              {item.media_type === 'video' && <div className="text-gold text-[10px] mb-2">Vidéo</div>}
              <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => remove(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, small }: any) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
        <Icon className="h-4 w-4 text-gold-foreground" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`font-display ${small ? "text-base" : "text-2xl"}`}>{value}</div>
      </div>
    </div>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = { 
    pending: "En attente", 
    confirmed: "Confirmé", 
    shipped: "Expédié",
    cancelled: "Annulé" 
  };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status] || ""}`}>{label[status] || status}</span>;
};

// STATISTICS DASHBOARD COMPONENT
const StatsDashboard = ({ appointments, orders, prestations }: { appointments: any[], orders: any[], prestations: any[] }) => {
  // 1. Revenue trend (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayAppointments = appointments.filter(a => a.appointment_date === date && a.status === 'confirmed');
    const dayOrders = orders.filter(o => o.created_at.startsWith(date) && o.status === 'confirmed');
    
    const appRevenue = dayAppointments.reduce((sum, a) => {
      const p = prestations.find(p => p.name === a.service);
      const priceStr = p?.price || "0";
      return sum + (parseInt(priceStr.replace(/[^0-9]/g, "")) || 0);
    }, 0);
    
    const orderRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    
    return {
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      revenue: appRevenue + orderRevenue,
      appointments: dayAppointments.length,
      orders: dayOrders.length
    };
  });

  // 2. Service Distribution
  const serviceStats = appointments.reduce((acc, a) => {
    acc[a.service] = (acc[a.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(serviceStats).map(([name, value]) => ({ name, value })).slice(0, 5);
  const COLORS = ['#d4af37', '#25252e', '#9b87f5', '#7E69AB', '#FDE1D3'];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* REVENUE CHART */}
        <Card className="p-6">
          <h3 className="font-display text-lg mb-6">Évolution du CA (7 derniers jours)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} unit="€" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* VOLUME CHART */}
        <Card className="p-6">
          <h3 className="font-display text-lg mb-6">Volume d'activité</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="appointments" name="Rendez-vous" fill="#25252e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="Commandes PON" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DISTRIBUTION CHART */}
        <Card className="p-6">
          <h3 className="font-display text-lg mb-6">Top Prestations (Salon)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SUMMARY CARD */}
        <Card className="p-8 bg-primary text-primary-foreground flex flex-col justify-center items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Star className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-display text-2xl">Résumé Mensuel</h3>
          <div className="grid grid-cols-2 gap-8 w-full max-w-xs mt-4">
            <div>
              <div className="text-3xl font-bold">{appointments.length}</div>
              <div className="text-xs opacity-70 uppercase tracking-widest">Réservations</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{orders.length}</div>
              <div className="text-xs opacity-70 uppercase tracking-widest">Ventes PON</div>
            </div>
          </div>
          <p className="text-sm opacity-60 italic mt-4">
            "Le succès est la somme de petits efforts répétés jour après jour."
          </p>
        </Card>
      </div>
    </div>
  );
};

const ReviewStatusBadge = ({ approved }: { approved: boolean }) => {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
      {approved ? "Approuvé" : "En attente"}
    </span>
  );
};

export default Admin;

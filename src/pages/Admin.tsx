import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Calendar, Users, Euro, LogOut, Trash2, Check, X, Star, ShoppingBag, Package } from "lucide-react";
import { 
  getAppointments, 
  updateAppointmentStatus, 
  deleteAppointment, 
  getReviewsAll, 
  updateReviewStatus, 
  deleteReview,
  getOrders,
  updateOrderStatus
} from "@/integrations/api";

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

const PRICES: Record<string, number> = {
  "Pose gel": 60, "Remplissage": 45, "Vernis semi-permanent": 35, "Nail art (par ongle)": 5, "Dépose": 15,
  "Épilation sourcils": 15, "Restructuration": 25, "Brow lift (rehaussement)": 45, "Teinture sourcils": 20, "Microblading": 350,
  "Rehaussement de cils": 35, "Teinture cils": 20, "Extensions cil à cil": 55, "Volume russe": 75,
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    await load(token);
  };

  const load = async (token: string) => {
    setLoading(true);
    try {
      const [appointmentsData, reviewsData, ordersData] = await Promise.all([
        getAppointments(token),
        getReviewsAll(token),
        getOrders(token),
      ]);
      setAppointments(appointmentsData);
      setReviews(reviewsData);
      setOrders(ordersData);
    } catch (err) {
      toast.error("Erreur de chargement");
      localStorage.removeItem("token");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateAppointmentStatus(id, status, token);
      toast.success("Mis à jour");
      await load(token);
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
      await load(token);
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
      await load(token);
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
      await load(token);
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
      await load(token);
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
      await load(token);
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gold h-8 w-8" /></div>;
  }

  const confirmed = appointments.filter(a => a.status === "confirmed");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const revenueAppointments = confirmed.reduce((s, a) => s + (PRICES[a.service] || 0), 0);
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* APPOINTMENTS */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="font-display text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> Rendez-vous ({appointments.length})
              </h2>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {appointments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">Aucun rendez-vous pour l'instant.</div>
              )}
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
              {orders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">Aucune commande pour l'instant.</div>
              )}
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

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" /> Avis clients ({reviews.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {reviews.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Aucun avis pour l'instant.</div>
            )}
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
      </main>
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

const ReviewStatusBadge = ({ approved }: { approved: boolean }) => {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
      {approved ? "Approuvé" : "En attente"}
    </span>
  );
};

export default Admin;

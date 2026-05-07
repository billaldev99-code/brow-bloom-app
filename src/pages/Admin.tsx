import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Calendar, Users, Euro, LogOut, Trash2, Check, X } from "lucide-react";
import { getAppointments, updateAppointmentStatus, deleteAppointment } from "@/integrations/api";

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

const PRICES: Record<string, number> = {
  "Pose gel": 55, "Remplissage": 45, "Vernis semi-permanent": 35, "Nail art (par ongle)": 5, "Dépose": 15,
  "Épilation sourcils": 15, "Restructuration": 25, "Brow lift (rehaussement)": 45, "Teinture sourcils": 20, "Microblading": 350,
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
      const data = await getAppointments(token);
      setAppointments(data);
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

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gold h-8 w-8" /></div>;
  }

  const confirmed = appointments.filter(a => a.status === "confirmed");
  const revenue = confirmed.reduce((s, a) => s + (PRICES[a.service] || 0), 0);
  const upcoming = appointments.filter(a => new Date(a.appointment_date) >= new Date(new Date().toDateString()) && a.status !== "cancelled");
  const services = appointments.reduce((acc, a) => { acc[a.service] = (acc[a.service] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topService = Object.entries(services).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-background">
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
          <Stat icon={Users} label="Total clientes" value={new Set(appointments.map(a => a.client_email)).size} />
          <Stat icon={Euro} label="CA confirmé" value={`${revenue}€`} />
          <Stat icon={Check} label="Top prestation" value={topService?.[0] || "—"} small />
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display text-xl">Rendez-vous ({appointments.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {appointments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Aucun rendez-vous pour l'instant.</div>
            )}
            {appointments.map(a => (
              <div key={a.id} className="p-4 flex flex-wrap items-center gap-4 hover:bg-secondary/30">
                <div className="text-center min-w-[80px]">
                  <div className="font-display text-lg">{new Date(a.appointment_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>
                  <div className="text-sm text-gold">{a.appointment_time}</div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium">{a.client_name}</div>
                  <div className="text-xs text-muted-foreground">{a.client_email} · {a.client_phone}</div>
                </div>
                <div className="min-w-[180px]">
                  <Badge variant="secondary" className="mb-1">{a.category}</Badge>
                  <div className="text-sm">{a.service}</div>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex gap-1">
                  {a.status !== "confirmed" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "confirmed")}><Check className="h-4 w-4 text-green-600" /></Button>
                  )}
                  {a.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "cancelled")}><X className="h-4 w-4" /></Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
    cancelled: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", cancelled: "Annulé" };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status] || ""}`}>{label[status] || status}</span>;
};

export default Admin;

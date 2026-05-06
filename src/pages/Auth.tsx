import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(120),
  password: z.string().min(6, "6 caractères minimum").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/admin");
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/admin"); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { email, password } = parsed.data;
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "signup") toast.success("Compte créé ! Vérifiez vos emails ou connectez-vous.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-soft p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="text-center mb-6">
          <Sparkles className="h-8 w-8 text-gold mx-auto mb-2" />
          <h1 className="font-display text-3xl">Espace Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Maison Belle</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required maxLength={120} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required maxLength={72} className="mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : mode === "login" ? "Se connecter" : "Créer un compte"}
          </Button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-gold transition">
          {mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Le 1er compte créé doit être promu admin manuellement dans la base.
        </p>
      </Card>
    </div>
  );
};

export default Auth;

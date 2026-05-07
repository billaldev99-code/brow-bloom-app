import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { login, signup } from "@/integrations/api";

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(120),
  password: z.string().min(6, "6 caractères minimum").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/admin");
  }, [navigate]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    try {
      const { email, password } = parsed.data;
      const { token, userId } = mode === "login"
        ? await login(email, password)
        : await signup(email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      toast.success(mode === "signup" ? "Compte créé !" : "Connecté !");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
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
      </Card>
    </div>
  );
};

export default Auth;

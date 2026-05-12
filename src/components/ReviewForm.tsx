import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  onSubmit?: (data: ReviewFormData) => Promise<void>;
}

export interface ReviewFormData {
  client_name: string;
  client_email?: string;
  rating: number;
  review_text: string;
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: ReviewFormData = {
      client_name: formData.get("name") as string,
      client_email: formData.get("email") as string | undefined,
      rating,
      review_text: formData.get("review") as string,
    };

    if (!data.client_name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    if (!data.review_text.trim()) {
      toast.error("L'avis est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      toast.success("Votre avis a été soumis et sera visible après modération");
      form.reset();
      setRating(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Review submission error:', errorMessage);
      toast.error(`Erreur lors de la soumission de l'avis: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 shadow-soft">
      <h3 className="font-display text-2xl mb-6">Laissez votre avis</h3>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            className="mt-1"
            placeholder="Votre nom"
          />
        </div>

        <div>
          <Label htmlFor="email">Email (optionnel)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={120}
            className="mt-1"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <Label>Note *</Label>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-gold text-gold"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="review">Votre avis *</Label>
          <Textarea
            id="review"
            name="review"
            required
            maxLength={500}
            rows={4}
            className="mt-1 resize-none"
            placeholder="Partagez votre expérience..."
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer mon avis"}
        </Button>
      </form>
    </Card>
  );
}

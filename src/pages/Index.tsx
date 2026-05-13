import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/BookingDialog";
import { ReviewDialog } from "@/components/ReviewDialog";
import { PressOnNailsOrder } from "@/components/PressOnNailsOrder";
import {
  Sparkles, Eye, Star, Instagram, Phone, MapPin, Clock,
  MessageCircle, Award, Heart, ShieldCheck, ArrowRight, Mail, EyeOff, ShoppingBag,
} from "lucide-react";
import { EyeClosed } from 'lucide-react';
import { useEffect, useState } from "react";
import { getReviews } from "@/integrations/api";

import heroImg from "@/assets/hero.jpg";
import nailsImg from "@/assets/nails.jpg";
import browsImg from "@/assets/brows.jpg";
import cilsImg from "@/assets/cils.jpg";
import ponImg from "@/assets/pon.jpg";
import artistImg from "@/assets/artist.jpg";

const Index = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    getReviews().then(setReviews).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <nav className="container flex items-center justify-between h-16">
          <a href="#" className="font-display text-xl tracking-wide">
            Maison <span className="text-gold">Belle</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#services" className="hover:text-gold transition">Prestations</a>
            <a href="#about" className="hover:text-gold transition">À propos</a>
            <a href="#gallery" className="hover:text-gold transition">Galerie</a>
            <a href="#contact" className="hover:text-gold transition">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <PressOnNailsOrder
              trigger={<Button size="sm" variant="outline" className="hidden sm:flex border-gold text-gold hover:bg-gold hover:text-white rounded-full px-5">Commander</Button>}
            />
            <BookingDialog
              trigger={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5">Réserver</Button>}
            />
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-soft -z-10" />
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold mb-6">
              <Sparkles className="h-3 w-3" /> Institut de beauté premium
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6">
              Sublimez vos <em className="text-gold not-italic">ongles</em>
              <br />et votre <em className="text-gold not-italic">regard</em>.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Prothésie ongulaire, brow & lash artist. Une expérience douce, élégante et sur mesure.
            </p>
            <div className="flex flex-wrap gap-3">
              <BookingDialog
                trigger={
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-elegant">
                    Prendre rendez-vous <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
              <PressOnNailsOrder
                trigger={
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-gold text-gold hover:bg-gold hover:text-white shadow-soft transition-all duration-300">
                    Faire une commande <ShoppingBag className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
                <span className="ml-2 font-medium">4.9/5</span>
              </div>
              <span className="text-muted-foreground">+ de 800 clientes satisfaites</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 gradient-luxe rounded-[3rem] blur-2xl opacity-60 -z-10" />
            <img
              src={heroImg}
              alt="Vernis nude et roses, ambiance luxueuse"
              width={1536} height={1024}
              className="rounded-[2rem] shadow-elegant w-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 container">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { img: nailsImg, icon: Sparkles, title: "Ongles", desc: "Pose gel, semi-permanent, nail art — pour des mains toujours impeccables." },
            { img: browsImg, icon: Eye, title: "Sourcils", desc: "Restructuration, brow lift, teinture — un regard sublimé sur mesure." },
            { img: cilsImg, icon: EyeClosed, title: "Cils", desc: "Rehaussement de cils, extensions, teinture — pour un regard élégant et lumineux." },
            { img: ponImg, icon: Sparkles, title: "Press on nails", desc: "Capsules sur mesure, réutilisables et prêtes à porter — la beauté des ongles en toute simplicité.", isPON: true },
          ].map((c) => (
            <div key={c.title} className="group relative overflow-hidden rounded-3xl shadow-soft">
              <img src={c.img} alt={c.title} loading="lazy" width={1024} height={1024}
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-8 text-primary-foreground flex justify-between items-end">
                <div>
                  <c.icon className="h-6 w-6 text-gold mb-2" />
                  <h3 className="font-display text-3xl mb-2">{c.title}</h3>
                  <p className="text-sm opacity-90 max-w-sm">{c.desc}</p>
                </div>
                {c.isPON && (
                  <PressOnNailsOrder
                    trigger={
                      <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-full px-6 shadow-gold transition-transform hover:scale-105">
                        Commander
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* SERVICES */}
      <section id="services" className="py-20 bg-secondary/40">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Nos prestations</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3">Une carte sur mesure</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={Sparkles}
              title="Ongles"
              items={[
                ["Pose gel", "1h45", "60€"],
                ["Remplissage", "1h30", "45€"],
                ["Vernis semi-permanent", "1h", "35€"],
                ["Nail art (par ongle)", "+15min", "+5€"],
                ["Dépose", "30min", "15€"],
              ]}
            />
            <ServiceCard
              icon={Eye}
              title="Sourcils"
              items={[
                ["Épilation sourcils", "20min", "15€"],
                ["Restructuration", "30min", "25€"],
                ["Brow lift (rehaussement)", "45min", "45€"],
                ["Teinture sourcils", "20min", "20€"],
                ["Microblading", "2h", "350€"],
              ]}
            />
            <ServiceCard
              icon={EyeClosed}
              title="Cils"
              items={[
                ["Rehaussement de cils", "45min", "35€"],
                ["Teinture cils", "20min", "20€"],
                ["Extensions cil à cil", "1h30", "55€"],
                ["Volume russe", "2h", "75€"],
                ["Dépose", "30min", "15€"],
              ]}
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 gradient-luxe rounded-[2.5rem] blur-2xl opacity-40 -z-10" />
            <img src={artistImg} alt="La technicienne de Maison Belle" loading="lazy"
              width={1024} height={1280}
              className="rounded-[2rem] shadow-elegant w-full object-cover aspect-[4/5]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold">À propos</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 mb-6">Une passion, deux expertises.</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Diplômée et certifiée, je vous accueille dans un espace intimiste pensé pour votre bien-être.
              Chaque prestation est personnalisée pour révéler votre beauté naturelle.
            </p>
            <div className="space-y-4">
              {[
                [Award, "Certifiée prothésiste ongulaire & brow artist"],
                [ShieldCheck, "Hygiène irréprochable, matériel stérilisé"],
                [Heart, "Produits haut de gamme, sans compromis"],
              ].map(([Icon, txt]: any) => (
                <div key={txt} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-gold flex items-center justify-center shadow-gold shrink-0">
                    <Icon className="h-4 w-4 text-gold-foreground" />
                  </div>
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-secondary/40">
        <div className="container">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Avis clientes</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3">Elles en parlent mieux que nous</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: "Camille B.", t: "Un travail d'orfèvre. Mes ongles n'ont jamais été aussi beaux et mes sourcils enfin parfaits !" },
              { n: "Sarah B.", t: "Accueil au top, ambiance cocooning. Je ne vais plus nulle part ailleurs." },
              { n: "Kenza M.", t: "Le brow lift a transformé mon regard. Résultat naturel et bluffant mashallah." },
            ].map((r) => (
              <div key={r.n} className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">« {r.t} »</p>
                <div className="font-medium">{r.n}</div>
              </div>
            ))}
          </div>

          {reviews.length > 0 && (
            <div className="mb-12">
              <h3 className="font-display text-2xl mb-6 text-center">Avis récents</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-2xl p-6 shadow-soft">
                    <div className="flex gap-1 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">« {review.review_text} »</p>
                    <div className="font-medium">{review.client_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-md mx-auto text-center">
            <ReviewDialog
              trigger={
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                  Laissez votre avis
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20 container">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Galerie</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Inspirations & réalisations</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[nailsImg, browsImg, heroImg, artistImg, browsImg, nailsImg, artistImg, heroImg].map((img, i) => (
            <div key={i} className="overflow-hidden rounded-2xl group">
              <img src={img} alt={`Réalisation ${i+1}`} loading="lazy"
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-[2.5rem] gradient-luxe p-12 md:p-20 text-center shadow-elegant">
            <h2 className="font-display text-4xl md:text-5xl mb-4">Prête à vous offrir ce moment ?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Réservez votre séance ou commandez vos Press On Nails sur mesure en quelques clics.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <BookingDialog
                trigger={
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 shadow-elegant">
                    Réserver mon rendez-vous <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
              <PressOnNailsOrder
                trigger={
                  <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-white rounded-full px-10 shadow-soft transition-all duration-300">
                    Faire une commande <ShoppingBag className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-secondary/40">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Contact</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 mb-8">Venez nous rendre visite</h2>
            <div className="space-y-4">
              <Info icon={MapPin} label="Ighrem, Akbou, Bejaia" />
              <Info icon={Phone} label="+213 791 59 28" />
              <Info icon={MessageCircle} label="+213 791 59 28 80 (WhatsApp)" />
              <a href="https://www.instagram.com/maisonbelle" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors block">
                <Info icon={Instagram} label="@maisonbelle" />
              </a>
              <a href="https://www.tiktok.com/@maisonbelle" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-card shadow-soft flex items-center justify-center">
                    <svg className="h-4 w-4 text-gold fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <span>@maisonbelle</span>
                </div>
              </a>
              <Info icon={Clock} label="Ouvert du samedi au jeudi" />
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-soft min-h-[300px] bg-muted">
            <iframe
              title="Carte"
              src="https://www.google.com/maps?q=36.462339,4.5040525&output=embed"
              className="w-full h-full min-h-[300px] border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="font-display text-lg text-foreground">Maison <span className="text-gold">Belle</span></div>
          <div>© {new Date().getFullYear()} — Tous droits réservés.</div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40">
        <BookingDialog
          trigger={
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 shadow-elegant">
              <Sparkles className="mr-2 h-4 w-4" /> Réserver maintenant
            </Button>
          }
        />
      </div>
    </div>
  );
};

const ServiceCard = ({ icon: Icon, title, items }: { icon: any; title: string; items: string[][] }) => (
  <div className="bg-card rounded-3xl p-8 shadow-soft">
    <div className="flex items-center gap-3 mb-6">
      <div className="h-12 w-12 rounded-2xl gradient-gold flex items-center justify-center shadow-gold">
        <Icon className="h-5 w-5 text-gold-foreground" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
    </div>
    <ul className="divide-y divide-border">
      {items.map(([n, d, p]) => (
        <li key={n} className="py-3 flex justify-between items-center">
          <div>
            <div className="font-medium">{n}</div>
            <div className="text-xs text-muted-foreground">{d}</div>
          </div>
          <div className="text-gold font-medium">{p}</div>
        </li>
      ))}
    </ul>
  </div>
);

const Info = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-full bg-card shadow-soft flex items-center justify-center">
      <Icon className="h-4 w-4 text-gold" />
    </div>
    <span>{label}</span>
  </div>
);

export default Index;

import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/BookingDialog";
import { ReviewDialog } from "@/components/ReviewDialog";
import { PressOnNailsOrder } from "@/components/PressOnNailsOrder";
import { FormationDialog } from "@/components/FormationDialog";
import {
  Sparkles, Eye, Star, Instagram, Phone, MapPin, Clock,
  MessageCircle, Award, Heart, ShieldCheck, ArrowRight, Mail, EyeOff, ShoppingBag, LogOut, LayoutDashboard, GraduationCap, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { EyeClosed } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviews, getPrestations, getGalleryItems } from "@/integrations/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

import heroImg from "@/assets/hero.jpg";
import nailsImg from "@/assets/nails.jpg";
import browsImg from "@/assets/brows.jpg";
import cilsImg from "@/assets/cils.jpg";
import ponImg from "@/assets/pon.jpg";
import artistImg from "@/assets/artist.jpg";

interface Prestation {
  id: number;
  category: string;
  name: string;
  duration: string;
  price: string;
}

interface GalleryItem {
  id: number;
  image_url: string;
  title: string;
  description: string;
  media_type: 'image' | 'video';
}

const FALLBACK_PRESTATIONS: Prestation[] = [
  { id: 1, category: "ongles", name: "Gel sur ongles naturels", duration: "45 min", price: "35€" },
  { id: 2, category: "ongles", name: "Capsules gel", duration: "1h", price: "45€" },
  { id: 3, category: "ongles", name: "Vernis semi-permanent", duration: "30 min", price: "25€" },
  { id: 4, category: "ongles", name: "Nail art", duration: "+15 min", price: "+5€" },
  { id: 5, category: "sourcils", name: "Restructuration", duration: "30 min", price: "25€" },
  { id: 6, category: "sourcils", name: "Brow lift", duration: "45 min", price: "40€" },
  { id: 7, category: "sourcils", name: "Teinture sourcils", duration: "15 min", price: "15€" },
  { id: 8, category: "cils", name: "Rehaussement de cils", duration: "45 min", price: "40€" },
  { id: 9, category: "cils", name: "Extensions de cils", duration: "1h30", price: "55€" },
  { id: 10, category: "cils", name: "Teinture cils", duration: "15 min", price: "12€" },
  { id: 11, category: "press on nails", name: "Set press on nails", duration: "sur mesure", price: "35€" },
  { id: 12, category: "press on nails", name: "Réutilisation set", duration: "livraison", price: "15€" },
];

const Index = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>(FALLBACK_PRESTATIONS);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const cached = localStorage.getItem("galleryCache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(() => {
    try {
      return !localStorage.getItem("galleryCache");
    } catch {
      return true;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxItem(null); return; }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const idx = gallery.findIndex(item => item.id === lightboxItem.id);
      if (idx === -1 || gallery.length <= 1) return;
      if (e.key === "ArrowLeft") {
        const prev = idx > 0 ? gallery[idx - 1] : gallery[gallery.length - 1];
        setLightboxItem(prev);
      } else {
        const next = idx < gallery.length - 1 ? gallery[idx + 1] : gallery[0];
        setLightboxItem(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxItem, gallery]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      setIsLoggedIn(!!token);
      setIsAdmin(role === "admin");

      try {
        const [reviewsData, prestationsData] = await Promise.all([
          getReviews().catch(() => []),
          getPrestations().catch(() => []),
        ]);
        setReviews(reviewsData);
        if (prestationsData.length > 0) setPrestations(prestationsData);
      } catch (error) {
        console.error("Data fetching error:", error);
      } finally {
        setLoading(false);
      }

      getGalleryItems()
        .then((data) => {
          setGallery(data);
          try {
            localStorage.setItem("galleryCache", JSON.stringify(data));
          } catch (e) {
            console.warn("Impossible de mettre la galerie en cache", e);
          }
        })
        .catch((error) => console.error("Gallery fetching error:", error))
        .finally(() => setGalleryLoading(false));
    };
    fetchData();
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
            <a href="#formation" className="hover:text-gold transition">Formations</a>
            <a href="#gallery" className="hover:text-gold transition">Galerie</a>
            <a href="#contact" className="hover:text-gold transition">Contact</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn && (
              <>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => navigate("/admin")} className="text-gold hover:text-gold hover:bg-gold/10 px-2 sm:px-4">
                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={logout} className="text-muted-foreground px-2 sm:px-4">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </>
            )}
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
            <div className="flex flex-wrap justify-start gap-3">
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
              <div className="w-full flex justify-start mt-1">
                <FormationDialog
                  trigger={
                    <Button size="lg" variant="outline" className="rounded-full px-8 border-gold/60 text-gold hover:bg-gold hover:text-white shadow-soft transition-all duration-300">
                      Demander une formation <GraduationCap className="ml-2 h-4 w-4" />
                    </Button>
                  }
                />
              </div>
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
            { img: nailsImg, icon: Sparkles, title: "Ongles", desc: "Pose de capsules, gel sur ongles naturels, vernis semi-permanent, nail art\u00A0—\u00A0pour des mains toujours\u00A0impeccables." },
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
          <div className="grid md:grid-cols-2 gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <Card key={i} className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              ["ongles", "sourcils", "cils", "press on nails"].map(cat => {
                const items = prestations
                  .filter(p => p.category === cat)
                  .map(p => [p.name, p.duration, p.price] as string[]);

                if (cat === "sourcils") {
                  const idx = items.findIndex(([n]) => n === "Rehaussement de cils");
                  if (idx > 0) items.splice(idx, 0, ["__HEADER__", "Rehaussement de cils", ""]);
                }

                return (
                  <ServiceCard
                    key={cat}
                    icon={cat === "ongles" || cat === "press on nails" ? Sparkles : cat === "sourcils" ? Eye : EyeClosed}
                    title={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    items={items}
                  />
                );
              })
            )}
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

      {/* FORMATION */}
      <section id="formation" className="py-20 bg-secondary/40">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Formations</span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 mb-6">Transmettez votre passion.</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Vous rêvez de vous lancer dans la beauté des mains et du regard ? Je vous propose des
              formations sur mesure en <span className="text-foreground font-medium">ongles</span> et
              {" "}<span className="text-foreground font-medium">cils / sourcils</span>.
              Apprenez les techniques professionnelles et repartez avec les clés de la réussite.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                [GraduationCap, "Formations individuelles ou en petit groupe"],
                [Sparkles, "Pratique encadrée et support de cours offert"],
                [Heart, "Accompagnement et conseils pour bien démarrer"],
              ].map(([Icon, txt]: any) => (
                <li key={txt} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-gold flex items-center justify-center shadow-gold shrink-0">
                    <Icon className="h-4 w-4 text-gold-foreground" />
                  </div>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
            <FormationDialog
              trigger={
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-full px-8 shadow-gold">
                  <GraduationCap className="mr-2 h-4 w-4" /> Demander une formation
                </Button>
              }
            />
          </div>
          <div className="relative">
            <div className="absolute -inset-4 gradient-luxe rounded-[2.5rem] blur-2xl opacity-40 -z-10" />
            <img src={browsImg} alt="Formation en beauté des mains et du regard" loading="lazy"
              width={1024} height={1280}
              className="rounded-[2rem] shadow-elegant w-full object-cover aspect-[4/5]" />
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
              { n: "Kenza M.", t: "Le brow lift a transformé mon regard. Résultat naturel et bluffant." },
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

          {(loading || reviews.length > 0) && (
            <div className="mb-12">
              <h3 className="font-display text-2xl mb-6 text-center">Avis récents</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {loading ? (
                   [1, 2, 3].map(i => (
                    <Card key={i} className="p-6 space-y-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} className="h-4 w-4 rounded-full" />)}
                      </div>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </Card>
                   ))
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-2xl p-6 shadow-soft">
                      <div className="flex gap-1 mb-3">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 italic">« {review.review_text} »</p>
                      <div className="font-medium">{review.client_name}</div>
                    </div>
                  ))
                )}
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
          {galleryLoading ? (
             [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
               <Skeleton key={i} className="w-full aspect-square rounded-2xl" />
             ))
          ) : gallery.length === 0 ? (
             [nailsImg, browsImg, heroImg, artistImg, browsImg, nailsImg, artistImg, heroImg].map((img, i) => (
              <div key={i} className="overflow-hidden rounded-2xl group">
                <img src={img} alt={`Réalisation ${i+1}`} loading="lazy"
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
            ))
          ) : (
            gallery.map((item) => {
              const isVideo = item.media_type === 'video' || 
                              item.image_url.startsWith('data:video') || 
                              item.image_url.endsWith('.mp4') || 
                              item.image_url.endsWith('.mov');
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => setLightboxItem(item)}
                  className="overflow-hidden rounded-2xl group relative shadow-soft aspect-square bg-muted cursor-pointer"
                >
                  {isVideo ? (
                     <div className="w-full h-full relative">
                       <video 
                         src={item.image_url} 
                         className="w-full h-full object-cover" 
                         muted 
                         loop 
                         playsInline
                         autoPlay
                         onMouseOver={e => (e.target as HTMLVideoElement).play()}
                       />
                       <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full p-1.5 text-white">
                         <Sparkles className="h-3 w-3" />
                       </div>
                     </div>
                  ) : (
                    <img src={item.image_url} alt={item.title || "Réalisation"} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  {item.title && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center pointer-events-none">
                      <div className="text-white">
                        <div className="font-display text-lg">{item.title}</div>
                        {item.description && <div className="text-xs opacity-80">{item.description}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxItem && (() => {
        const idx = gallery.findIndex(item => item.id === lightboxItem.id);
        const hasNav = gallery.length > 1 && idx !== -1;
        const prev = hasNav ? (idx > 0 ? gallery[idx - 1] : gallery[gallery.length - 1]) : null;
        const next = hasNav ? (idx < gallery.length - 1 ? gallery[idx + 1] : gallery[0]) : null;
        const isVideo = lightboxItem.media_type === 'video' ||
          lightboxItem.image_url.startsWith('data:video') ||
          lightboxItem.image_url.endsWith('.mp4') ||
          lightboxItem.image_url.endsWith('.mov');

        return (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxItem(null)}
          >
            <button
              onClick={() => setLightboxItem(null)}
              aria-label="Fermer"
              className="absolute top-5 right-5 text-white/80 hover:text-white transition z-10"
            >
              <X className="h-8 w-8" />
            </button>

            {hasNav && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxItem(prev); }}
                aria-label="Précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-2 z-10"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
            )}

            {hasNav && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxItem(next); }}
                aria-label="Suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-2 z-10"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            )}

            <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              {hasNav && (
                <div className="text-white/60 text-sm mb-3">
                  {idx + 1} / {gallery.length}
                </div>
              )}
              {isVideo ? (
                <video
                  src={lightboxItem.image_url}
                  className="max-w-full max-h-[85vh] rounded-2xl"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={lightboxItem.image_url}
                  alt={lightboxItem.title || "Réalisation"}
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                />
              )}
              {lightboxItem.title && (
                <div className="text-center text-white mt-4">
                  <div className="font-display text-xl">{lightboxItem.title}</div>
                  {lightboxItem.description && (
                    <div className="text-sm opacity-80">{lightboxItem.description}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-[2.5rem] gradient-luxe p-12 md:p-20 text-center shadow-elegant">
            <h2 className="font-display text-4xl md:text-5xl mb-4">Prête à vous offrir ce moment ?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Réservez votre séance, commandez vos Press On Nails sur mesure ou demandez une formation en quelques clics.
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
            <div className="flex justify-center mt-4">
              <FormationDialog
                trigger={
                  <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-white rounded-full px-10 shadow-soft transition-all duration-300">
                    Demander une formation <GraduationCap className="ml-2 h-4 w-4" />
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
              <a href="tel:+213791592880" className="hover:text-gold transition-colors block">
                <Info icon={Phone} label="+213 791 59 28 80" />
              </a>
              <a href="https://wa.me/213791592880" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors block">
                <Info icon={MessageCircle} label="+213 791 59 28 80" />
              </a>
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
              <Info icon={Clock} label="Ouvert tous les jours" />
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
          <div>© {new Date().getFullYear()} — Tous droits réservés. <span className="ml-1 opacity-70">Designed & developed by Billal</span></div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40 flex gap-2">
        <BookingDialog
          trigger={
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 shadow-elegant">
              <Sparkles className="mr-2 h-4 w-4" /> Réserver
            </Button>
          }
        />
        <PressOnNailsOrder
          trigger={
            <Button className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90 rounded-full h-12 shadow-gold">
              <ShoppingBag className="mr-2 h-4 w-4" /> Commander
            </Button>
          }
        />
      </div>
    </div>
  );
};

const ServiceCard = ({ icon: Icon, title, items }: { icon: any; title: string; items: string[][] }) => {
  const headerIdx = items.findIndex(([n]) => n === "__HEADER__");

  const renderRows = (rows: string[][]) => (
    <ul className="divide-y divide-border">
      {rows.map(([n, d, p]) => (
        <li key={n} className="py-3 flex justify-between items-center">
          <div>
            <div className="font-medium">{n}</div>
            <div className="text-xs text-muted-foreground">{d}</div>
          </div>
          <div className="text-gold font-medium">{p}</div>
        </li>
      ))}
    </ul>
  );

  const before = headerIdx > -1 ? items.slice(0, headerIdx) : items;
  const after = headerIdx > -1 ? items.slice(headerIdx + 1) : [];

  return (
    <div className="bg-card rounded-3xl p-8 shadow-soft">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl gradient-gold flex items-center justify-center shadow-gold">
          <Icon className="h-5 w-5 text-gold-foreground" />
        </div>
        <h3 className="font-display text-2xl">{title}</h3>
      </div>

      {before.length > 0 && renderRows(before)}

      {headerIdx > -1 && (
        <div className="flex items-center gap-3 pt-6 pb-2">
          <div className="h-12 w-12 rounded-2xl gradient-gold flex items-center justify-center shadow-gold">
            <EyeClosed className="h-5 w-5 text-gold-foreground" />
          </div>
          <h4 className="font-display text-2xl">{items[headerIdx][1]}</h4>
        </div>
      )}

      {after.length > 0 && renderRows(after)}
    </div>
  );
};

const Info = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-full bg-card shadow-soft flex items-center justify-center">
      <Icon className="h-4 w-4 text-gold" />
    </div>
    <span>{label}</span>
  </div>
);

export default Index;

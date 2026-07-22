import { useEffect, useState, useRef, useCallback } from "react";
import { getApprovedClientPhotos, ClientPhoto } from "@/integrations/api";
import { ChevronLeft, ChevronRight, Camera, Loader2, Quote, X } from "lucide-react";
import { ClientPhotoForm } from "./ClientPhotoForm";

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(first: string, last: string) {
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

function PhotoCard({ item, onPhotoClick }: { item: ClientPhoto; onPhotoClick?: (urls: string[], idx: number) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const urls = item.photos as unknown as string[];
  const total = urls.length;

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border/50 group">
      <div className="relative aspect-[4/3] bg-secondary/30">
        {urls.length > 0 && (
          <button onClick={() => onPhotoClick?.(urls, imgIdx)} className="w-full h-full block">
            <img
              src={urls[imgIdx]}
              alt=""
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          </button>
        )}
        {total > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(p => p > 0 ? p - 1 : total - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setImgIdx(p => p < total - 1 ? p + 1 : 0); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{getInitials(item.first_name, item.last_name)}</span>
          <span className="text-[10px] uppercase tracking-wider text-gold font-medium">{item.prestation_type}</span>
        </div>
        {item.message && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            <Quote className="h-3 w-3 inline mr-1 opacity-50" />
            {item.message}
          </p>
        )}
        <div className="text-[10px] text-muted-foreground/60">{formatDate(item.created_at)}</div>
      </div>
    </div>
  );
}

export const ClientPhotosSection = () => {
  const [items, setItems] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);
  const touchStartX = useRef(0);

  const navigateLightbox = useCallback((dir: 'prev' | 'next') => {
    setLightbox(l => {
      if (!l) return null;
      const total = l.urls.length;
      if (total <= 1) return l;
      const idx = dir === 'prev'
        ? (l.idx > 0 ? l.idx - 1 : total - 1)
        : (l.idx < total - 1 ? l.idx + 1 : 0);
      return { ...l, idx };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightbox(null); return; }
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
      if (e.key === 'ArrowRight') navigateLightbox('next');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, navigateLightbox]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getApprovedClientPhotos();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section id="retours" className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Témoignages</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3">Vos retours en images</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed max-w-lg mx-auto">
            Découvrez les résultats authentiques de nos clientes. Chaque photo est un vrai retour après une prestation chez Maison Belle.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Aucun retour pour le moment.<br />Soyez la première à partager votre expérience !</p>
            <ClientPhotoForm trigger={<button className="text-gold underline text-sm">Partager mon résultat</button>} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <PhotoCard key={item.id} item={item} onPhotoClick={(urls, idx) => setLightbox({ urls, idx })} />
              ))}
            </div>
            <div className="text-center mt-10">
              <ClientPhotoForm trigger={
                <button className="inline-flex items-center gap-2 bg-gold text-gold-foreground px-6 py-3 rounded-full font-medium hover:bg-gold/90 transition-colors shadow-md">
                  <Camera className="h-4 w-4" />
                  Partager mon résultat
                </button>
              } />
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            aria-label="Fermer"
            className="absolute top-5 right-5 text-white/80 hover:text-white transition z-10">
            <X className="h-8 w-8" />
          </button>
          {lightbox.urls.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                aria-label="Précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-2 z-10">
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                aria-label="Suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition p-2 z-10">
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (lightbox.urls.length <= 1) return;
              const deltaX = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) navigateLightbox('prev');
                else navigateLightbox('next');
              }
            }}
          >
            {lightbox.urls.length > 1 && (
              <div className="text-white/60 text-sm mb-3">{lightbox.idx + 1} / {lightbox.urls.length}</div>
            )}
            <img src={lightbox.urls[lightbox.idx]} alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </section>
  );
};

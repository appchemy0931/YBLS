import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Scissors, ShoppingBag, Gift, Users, ArrowRight, Star, Heart, Award, Tag, X, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { serviceAPI, productAPI, promotionAPI, testimonialAPI } from '../api';
import { ServiceCard, ProductCard, Spinner, PromotionIndicator } from '../components/ui';
import EyeCare from '../assets/EyeCare.jpg';
import jinLuo from '../assets/jinluo.jpg';
import shiOng from '../assets/shiong.jpg';
import shenLiao from '../assets/ShenLiao.jpg';
import { imageUrl } from '../utils/image';
import zhiGong from '../assets/zhigong.jpg';

const heroSlides = [
  { image: zhiGong },
  { image: EyeCare },
  { image: jinLuo },
  { image: shiOng },
  { image: shenLiao },
];

export default function Home() {
  const { t } = useTranslation();
  const { data: serviceData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-home'],
    queryFn: () => serviceAPI.getAll().then((r) => r.data),
  });
  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => productAPI.getAll().then((r) => r.data),
  });
  const { data: promoData, isLoading: promosLoading } = useQuery({
    queryKey: ['promotions-home'],
    queryFn: () => promotionAPI.getAll().then((r) => r.data),
  });
  const { data: testimonialData } = useQuery({
    queryKey: ['testimonials-home'],
    queryFn: () => testimonialAPI.getAll().then((r) => r.data),
  });

  const navigate = useNavigate();
  const handleClaimPromo = (promoId: string) => navigate(`/promotions/${promoId}`);

  const promotions = (promoData?.promotions || [])
    .filter((p) => p.status === 'active' && new Date(p.endDate) >= new Date())
    .slice(0, 3);

  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [testimonialImage, setTestimonialImage] = useState<string | null>(null);

  useEffect(() => {
    if (!testimonialImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTestimonialImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [testimonialImage]);
  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % heroSlides.length), 3500);
    return () => clearTimeout(t);
  }, [slide]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setSlide((s) => (s + 1) % heroSlides.length);
      if (e.key === 'ArrowLeft') setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const features = [
    { icon: Scissors, title: t('home.features.expert.title'), desc: t('home.features.expert.desc') },
    { icon: Award, title: t('home.features.premium.title'), desc: t('home.features.premium.desc') },
    { icon: Heart, title: t('home.features.personal.title'), desc: t('home.features.personal.desc') },
    { icon: Gift, title: t('home.features.reward.title'), desc: t('home.features.reward.desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-blush-50 via-cream to-rose-soft">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-rose-deep blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-gold-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-[slide-up_0.6s_ease-out]">
              <span className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-rose-deep font-medium mb-6">
                <Sparkles size={16} /> {t('home.heroBadge')}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('home.heroTitle1')} <span className="text-gradient-gold">{t('home.heroTitleHighlight')}</span> {t('home.heroTitle2')}
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                {t('home.heroDesc')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/services" className="bg-linear-to-r from-rose-deep to-rose-medium text-white px-8 py-3.5 rounded-full font-medium hover:shadow-xl transition-all flex items-center gap-2">
                  {t('home.bookAppointment')} <ArrowRight size={18} />
                </Link>
                <Link to="/products" className="border-2 border-rose-deep text-rose-deep px-8 py-3.5 rounded-full font-medium hover:bg-rose-soft transition-all">
                  {t('home.shopProducts')}
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div>
                  <p className="text-3xl font-bold text-rose-deep">12+</p>
                  <p className="text-sm text-gray-500">{t('home.statServices')}</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-rose-deep">1000+</p>
                  <p className="text-sm text-gray-500">{t('home.statClients')}</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-rose-deep">4.9</p>
                  <p className="text-sm text-gray-500">{t('home.statRating')}</p>
                </div>
              </div>
            </div>
            <div className="relative animate-[fade-in_0.8s_ease-out]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[520px] bg-white">
                {heroSlides.map((s, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === slide ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <img
                      src={imageUrl(s.image)}
                      alt={t('home.slides.' + i + '.title')}
                      onClick={() => { setSlide(i); setLightbox(true); }}
                      className={`w-full h-full object-cover cursor-zoom-in ${i === slide ? 'animate-ken-burns' : 'scale-105'}`}
                    />
                  </div>
                ))}

                <div className="absolute inset-0 bg-transparent pointer-events-none" />

                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                  <div key={slide} className="h-full bg-gold-400 animate-progress" />
                </div>

                {/* <div className="absolute top-5 left-5">
                  <span key={`promo-${slide}`} className="inline-flex items-center gap-2 bg-rose-deep/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fade-in">
                    <Sparkles size={14} /> {t('home.slides.' + slide + '.promo')}
                  </span>
                </div> */}

                {/* <div className="absolute bottom-0 left-0 right-0 p-6 text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  <div key={`cap-${slide}`} className="animate-slide-up">
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{t('home.slides.' + slide + '.title')}</h3>
                    <p className="text-sm text-gray-200 mt-1">{t('home.slides.' + slide + '.desc')}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    {heroSlides.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSlide(i)}
                        aria-label={t('home.slides.' + i + '.title')}
                        className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>
                </div> */}
              </div>

              <div className="absolute -bottom-15 -right-6 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-float">
                <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center">
                  <Star className="text-gold-500 fill-gold-500" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('home.premiumQuality')}</p>
                  <p className="text-xs text-gray-400">{t('home.certifiedExperts')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="text-center p-6 rounded-2xl hover:bg-blush-50 transition-colors animate-[slide-up_0.4s_ease-out]" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-rose-soft to-gold-100 flex items-center justify-center mb-4">
                  <f.icon size={28} className="text-rose-deep" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-blush-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-gold-500 text-sm font-medium tracking-wider uppercase">{t('home.services.eyebrow')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('home.services.title')}
            </h2>
          </div>
          {servicesLoading ? (
            <Spinner className="py-20" />
          ) : (
            <div className="grid lg:grid-cols-2 lg:grid-cols-4 gap-6">
              {(serviceData?.services || []).slice(0, 6).map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/services" className="inline-flex items-center gap-2 text-rose-deep font-medium hover:text-gold-500 transition-colors">
              {t('home.services.viewAll')} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-gold-500 text-sm font-medium tracking-wider uppercase">
              <Tag size={16} /> {t('home.promotions.eyebrow')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('home.promotions.title')}
            </h2>
          </div>
          {promosLoading ? (
            <Spinner className="py-20" />
          ) : promotions.length === 0 ? (
            <p className="text-center text-gray-500">{t('home.promotions.empty')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((p) => {
                const discounted = p.originalPrice * (1 - p.discount / 100);
                return (
                  <div key={p._id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover animate-scale-in">
                    <div className="relative">
                      <img src={imageUrl(p.image)} alt={p.title} className="w-full h-44 object-cover" />
                      {p.discount > 0 && (
                        <span className="absolute top-3 right-3 bg-rose-deep text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                          {p.discount}% {t('home.promotions.off')}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2"><PromotionIndicator /></div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{p.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-rose-deep">RM{discounted.toFixed(2)}</span>
                        {p.discount > 0 && <span className="text-sm text-gray-400 line-through">RM{p.originalPrice}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-4">{t('home.promotions.validUntil')} {new Date(p.endDate).toLocaleDateString()}</p>
                      <button onClick={() => handleClaimPromo(p._id)} className="w-full bg-linear-to-r from-rose-deep to-rose-medium text-white px-6 py-2.5 rounded-full font-medium hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        {t('home.promotions.claim')} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Referral CTA */}
      <section className="py-16 bg-linear-to-r from-[#3a2a2a] to-[#2a1f1f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold-400/20 flex items-center justify-center mb-4">
            <Users size={32} className="text-gold-400" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('home.referral.title1')} <span className="text-gradient-gold">{t('home.referral.titleHighlight')}</span>
          </h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-8">
            {t('home.referral.desc')}
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-linear-to-r from-gold-500 to-gold-400 text-white px-8 py-3.5 rounded-full font-medium hover:shadow-xl transition-all">
            {t('home.referral.cta')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-gold-500 text-sm font-medium tracking-wider uppercase">{t('home.products.eyebrow')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('home.products.title')}
            </h2>
          </div>
          {productsLoading ? (
            <Spinner className="py-20" />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {(productData?.products || []).slice(0, 8).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/products" className="inline-flex items-center gap-2 text-rose-deep font-medium hover:text-gold-500 transition-colors">
              <ShoppingBag size={18} /> {t('home.products.shopAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {(testimonialData?.testimonials || []).length > 0 && (
        <section className="py-16 bg-blush-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 text-gold-500 text-sm font-medium tracking-wider uppercase">
                <Quote size={16} /> {t('home.testimonials.eyebrow')}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('home.testimonials.title')}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(testimonialData?.testimonials || []).slice(0, 6).map((t) => (
                <div key={t._id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                  <img
                    src={imageUrl(t.image)}
                    alt="Testimonial"
                    onClick={() => setTestimonialImage(imageUrl(t.image))}
                    className="w-full h-90 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center animate-[fade-in_0.2s_ease-out]"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
          >
            <X size={26} />
          </button>
          <button
            type="button"
            aria-label="Previous"
            className="absolute left-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length); }}
          >
            <ChevronLeft size={28} />
          </button>
          <img
            src={imageUrl(heroSlides[slide].image)}
            alt={t('home.slides.' + slide + '.title')}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Next"
            className="absolute right-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setSlide((s) => (s + 1) % heroSlides.length); }}
          >
            <ChevronRight size={28} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {heroSlides.map((s, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                onClick={(e) => { e.stopPropagation(); setSlide(i); }}
              />
            ))}
          </div>
        </div>
      )}
      {testimonialImage && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center animate-[fade-in_0.2s_ease-out]"
          onClick={() => setTestimonialImage(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); setTestimonialImage(null); }}
          >
            <X size={26} />
          </button>
          <img
            src={testimonialImage}
            alt="Testimonial"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

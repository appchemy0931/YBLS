import { Sparkles, Heart, Award, Users, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import salonImg from '../assets/Dubai.jpg';

export default function About() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="bg-linear-to-br from-blush-50 to-rose-soft py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full text-sm text-rose-deep font-medium mb-4">
            <Sparkles size={16} /> {t('about.aboutUs')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('about.title1')} <span className="text-gradient-gold">{t('about.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('about.intro')}
          </p>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img
                src={salonImg}
                alt={t('contact.salonLocation')}
                className="w-full h-96 object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('about.ourStory')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('about.storyP1')}
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('about.storyP2')}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-blush-50">
                  <p className="text-3xl font-bold text-rose-deep">15+</p>
                  <p className="text-xs text-gray-500">{t('about.yearsExperience')}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blush-50">
                  <p className="text-3xl font-bold text-rose-deep">50+</p>
                  <p className="text-xs text-gray-500">{t('about.expertStaff')}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blush-50">
                  <p className="text-3xl font-bold text-rose-deep">10K+</p>
                  <p className="text-xs text-gray-500">{t('about.happyClients')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blush-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('about.ourValues')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: t('about.passion'), desc: t('about.passionDesc') },
              { icon: Award, title: t('about.excellence'), desc: t('about.excellenceDesc') },
              { icon: Leaf, title: t('about.natural'), desc: t('about.naturalDesc') },
              { icon: Users, title: t('about.community'), desc: t('about.communityDesc') },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center card-shadow card-shadow-hover">
                <div className="w-14 h-14 mx-auto rounded-full bg-linear-to-br from-rose-soft to-gold-100 flex items-center justify-center mb-4">
                  <v.icon size={26} className="text-rose-deep" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

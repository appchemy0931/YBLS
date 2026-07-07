import { Link } from 'react-router-dom';
import { Share2, MessageCircle, Send, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import YBLSLogo from '../assets/YBLS-Logo.png';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-linear-to-br from-[#3a2a2a] to-[#2a1f1f] text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={YBLSLogo} alt="YBLS" className="w-20 h-20 rounded-full object-cover" />
              <span className="text-2xl font-bold text-gradient-gold" style={{ fontFamily: 'Playfair Display, serif' }}>
                YBLS
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose-deep transition-colors">
                <Share2 size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose-deep transition-colors">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose-deep transition-colors">
                <Send size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-gold-400 transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/services" className="hover:text-gold-400 transition-colors">{t('nav.services')}</Link></li>
              <li><Link to="/products" className="hover:text-gold-400 transition-colors">{t('nav.products')}</Link></li>
              <li><Link to="/about" className="hover:text-gold-400 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-gold-400 transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm">
              <li>{t('footer.service1')}</li>
              <li>{t('footer.service2')}</li>
              <li>{t('footer.service3')}</li>
              <li>{t('footer.service4')}</li>
              <li>{t('footer.service5')}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-gold-400" /> {t('footer.address')}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gold-400" /> +60 11 2088 1183
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gold-400" /> Evonnechong0224@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-400">
          {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}

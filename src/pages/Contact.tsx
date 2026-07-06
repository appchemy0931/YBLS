import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import salonImg from '../assets/Dubai.jpg';

const WHATSAPP_NUMBER = '601120881183';
const WHATSAPP_DISPLAY = '+60 112088 1183';

const buildWhatsAppLink = (message?: string) => {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

const WhatsAppIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const { t } = useTranslation();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success(t('contact.messageSent'));
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo: { icon: typeof MapPin; title: string; detail: string; link?: string }[] = [
    { icon: MapPin, title: t('contact.visitUs'), detail: 'No 37, Ground Floor, Jalan Medan Midah, Taman Midah, 56000 Cheras, Kuala Lumpur, Malaysia' },
    { icon: Phone, title: t('contact.callUs'), detail: '+60 11 2088 1183' },
    { icon: MessageCircle, title: t('contact.whatsapp'), detail: WHATSAPP_DISPLAY, link: buildWhatsAppLink(t('contact.whatsappPrefill')) },
    { icon: Mail, title: t('contact.emailUs'), detail: 'Evonnechong0224@gmail.com' },
    { icon: Clock, title: t('contact.openHours'), detail: t('contact.openHoursDetail') },
  ];

  return (
    <div>
      <div className="bg-linear-to-br from-blush-50 to-rose-soft py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('contact.getInTouch')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('contact.intro')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('contact.contactInformation')}
            </h2>
            <div className="space-y-4">
              {contactInfo.map((info, i) => {
                const content = (
                  <>
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-rose-soft to-gold-100 flex items-center justify-center shrink-0">
                      <info.icon size={22} className="text-rose-deep" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{info.title}</h3>
                      <p className="text-sm text-gray-500">{info.detail}</p>
                    </div>
                  </>
                );
                return info.link ? (
                  <a key={i} href={info.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-4 rounded-2xl bg-white card-shadow hover:shadow-lg transition-all">
                    {content}
                  </a>
                ) : (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white card-shadow">
                    {content}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl overflow-hidden card-shadow">
              <img
                src={salonImg}
                alt={t('contact.salonLocation')}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 card-shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('contact.sendAMessage')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.subject')}</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.message')}</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-deep focus:ring-1 focus:ring-rose-deep resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-linear-to-r from-rose-deep to-rose-medium text-white py-3.5 rounded-full font-medium hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> {t('contact.sendMessage')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400 mb-3">{t('contact.preferToChat')}</p>
              <a
                href={buildWhatsAppLink(
                  form.message || form.subject
                    ? `Hi YBLS!\n\nName: ${form.name || '-'}\nSubject: ${form.subject || '-'}\n\n${form.message || ''}`
                    : t('contact.whatsappPrefill')
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-3.5 rounded-full font-medium hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <WhatsAppIcon size={18} /> {t('contact.chatOnWhatsApp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

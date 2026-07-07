import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Switch language"
        className="flex items-center gap-1 px-2 py-1 rounded-full text-white hover:bg-green-600 transition-colors text-sm"
      >
        <Globe size={18} />
        <span className="hidden sm:inline">{current.short}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-rose-soft py-1 z-50 animate-[scale-in_0.2s_ease-out]">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  i18n.changeLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-rose-50 transition-colors ${l.code === i18n.language ? 'text-rose-deep font-medium' : 'text-gray-600'}`}
              >
                {l.label}
                {l.code === i18n.language && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

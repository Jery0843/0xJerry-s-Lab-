'use client';

import { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaSpinner } from 'react-icons/fa';

interface LanguageSelectorProps {
  content: string;
  onTranslate: (translatedContent: string, language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
];

export default function LanguageSelector({ content, onTranslate }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTranslate = async (langCode: string) => {
    if (langCode === 'en' || langCode === currentLang) {
      setIsOpen(false);
      return;
    }

    setTranslating(true);
    setIsOpen(false);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          targetLang: langCode,
          contentType: 'writeup'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onTranslate(data.translatedContent, langCode);
        setCurrentLang(langCode);
      } else {
        alert('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={translating}
        className="flex items-center space-x-2 px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg hover:bg-cyber-blue/30 transition-colors disabled:opacity-50"
      >
        {translating ? (
          <>
            <FaSpinner className="animate-spin" />
            <span className="text-sm">Translating...</span>
          </>
        ) : (
          <>
            <FaGlobe />
            <span className="text-sm">{currentLanguage.flag} {currentLanguage.name}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-cyber-blue/50 rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleTranslate(lang.code)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-blue/20 transition-colors flex items-center space-x-2 ${
                  currentLang === lang.code ? 'bg-cyber-blue/30' : ''
                }`}
              >
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

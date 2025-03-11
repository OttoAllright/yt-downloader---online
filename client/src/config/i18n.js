// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "title": "YouTube Music Downloader",
          "description": "Convert and download your favorite YouTube videos:",
          "downloadAudio": "Download MP3",
          "downloadingAudio": "Converting to MP3...",
          "downloadVideo": "Download Video",
          "downloadingVideo": "Converting Video...",
          "error": "Please enter a valid YouTube URL",
          "footer": " 2025 YouTube Downloader. All rights reserved.",
          "footerDescription": "Fast and easy YouTube converter. Our service is completely free.",
          "terms": "Terms of Service",
          "privacy": "Privacy Policy",
          "followUs": "Follow us:",
          "placeholder": "Paste YouTube URL here...",
          "instagram": "Instagram"
        }
      },
      es: {
        translation: {
          "title": "Descargar Música de YouTube",
          "description": "Convierte y descarga tus videos favoritos de YouTube:",
          "downloadAudio": "Descargar MP3",
          "downloadingAudio": "Convirtiendo a MP3...",
          "downloadVideo": "Descargar Video",
          "downloadingVideo": "Convirtiendo Video...",
          "error": "Por favor, ingresa una URL válida de YouTube",
          "footer": " 2025 Descargador de YouTube. Todos los derechos reservados.",
          "footerDescription": "Convertidor de YouTube rápido y fácil. Nuestro servicio es completamente gratuito.",
          "terms": "Términos de Servicio",
          "privacy": "Política de Privacidad",
          "followUs": "Síguenos:",
          "placeholder": "Pega aquí la URL de YouTube...",
          "instagram": "Instagram"
        }
      }
    },
    fallbackLng: {
      'es-*': ['es'],
      'en-*': ['en'],
      default: ['en']
    },
    detection: {
      order: ['querystring', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 10080 // 7 días
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

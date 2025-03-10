// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "title": "YouTube Downloader",
          "description": "Enter the URL of the YouTube video you want to download:",
          "downloadAudio": "Download Audio",
          "downloadingAudio": "Downloading Audio...",
          "downloadVideo": "Download Video",
          "downloadingVideo": "Downloading Video...",
          "error": "Please enter a valid YouTube URL.",
          "footer": "© 2025 YouTube Downloader. All rights reserved.",
          "footerDescription": "Download YouTube videos and audios quickly and easily. Our service is free and easy to use.",
          "terms": "Terms of Service",
          "privacy": "Privacy Policy",
          "followUs": "Follow us on social media:"
        }
      },
      es: {
        translation: {
          "title": "Descargador de YouTube",
          "description": "Ingresa la URL del video de YouTube que deseas descargar:",
          "downloadAudio": "Descargar Audio",
          "downloadingAudio": "Descargando Audio...",
          "downloadVideo": "Descargar Video",
          "downloadingVideo": "Descargando Video...",
          "error": "Por favor, ingresa una URL válida de YouTube.",
          "footer": "© 2025 Descargador de YouTube. Todos los derechos reservados.",
          "footerDescription": "Descarga videos y audios de YouTube de manera rápida y sencilla. Nuestro servicio es gratuito y fácil de usar.",
          "terms": "Términos de Servicio",
          "privacy": "Política de Privacidad",
          "followUs": "Síguenos en nuestras redes sociales:"
        }
      }
    },
    lng: "es", // idioma por defecto
    fallbackLng: "en", // idioma de respaldo
    interpolation: {
      escapeValue: false // React ya escapa valores
    }
  });

export default i18n;

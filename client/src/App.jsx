import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import "./App.css"; 
import './config/i18n.js'; 

const URL = 'http://localhost:3000';

const App = () => {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async (type) => {
    if (!url) {
      setError(t("error"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const endpoint = type === "audio" ? "audio" : "video";
      console.log(`Iniciando descarga de ${endpoint}...`);

      const response = await fetch(`${URL}/download/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error en la descarga');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = type === "audio" ? "audio.mp3" : "video.mp4";
      
      if (url) {
        try {
          const videoId = url.split('v=')[1].split('&')[0];
          const response = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
          const data = await response.json();
          fileName = `${data.title}.${type === "audio" ? "mp3" : "mp4"}`.replace(/[^\w\s]/gi, '');
        } catch (err) {
          console.log('Error getting video title, using default name');
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error en la descarga:', err);
      setError(err.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="input"
      />
      {error && <p className="error">{error}</p>}
      <div className="button-container">
        <button
          onClick={() => handleDownload("audio")}
          disabled={loading}
          className="button audio-button"
        >
          {loading ? t("downloadingAudio") : t("downloadAudio")}
        </button>
        <button
          onClick={() => handleDownload("video")}
          disabled={loading}
          className="button video-button"
        >
          {loading ? t("downloadingVideo") : t("downloadVideo")}
        </button>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>{t("footer")}</p>
          <p>{t("footerDescription")}</p>
          <p>
            <a href="/terms" className="footer-link">{t("terms")}</a> | 
            <a href="/privacy" className="footer-link">{t("privacy")}</a>
          </p>
          <p>
            {t("followUs")} 
            <a href="https://instagram.com" className="footer-link">Instagram</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
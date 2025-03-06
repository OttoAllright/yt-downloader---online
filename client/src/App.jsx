import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import "./App.css"; // Importamos el archivo CSS
import './config.js/i18n.js'; // Importa la configuración de i18next

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

    setLoading(true);
    setError("");

    const endpoint = type === "audio" ? "audio" : "video";

    const response = await fetch(`http://localhost:3000/download/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    const fileName = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : type === "audio"
      ? "audio.mp3"
      : "video.mp4";

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setLoading(false);
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

      {/* Footer agregado para mejorar SEO */}
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
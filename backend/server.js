import express from 'express';
import cors from 'cors';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { FRONTEND_URL } from './logic/const.js';
import { youtubeCookies } from './config/youtube-cookies.js';

const PORT = process.env.PORT || 3000;
const app = express();

// Configurar ffmpeg con el binario estático
ffmpeg.setFfmpegPath(ffmpegStatic);

// Lista de proxies HTTPS verificados
const proxyList = [
  { uri: 'http://158.69.53.132:9300' },
  { uri: 'http://51.159.115.233:3128' },
  { uri: 'http://167.71.5.83:3128' },
  { uri: 'http://178.62.92.133:8080' },
  { uri: 'http://159.65.77.168:8585' }
];

// Lista de User Agents realistas
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Edge/122.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
];

// Función para obtener un proxy aleatorio
const getRandomProxy = () => {
  return proxyList[Math.floor(Math.random() * proxyList.length)];
};

// Función para obtener un agente con proxy y headers personalizados
const getCustomAgent = () => {
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Obtener un proxy aleatorio
  const proxy = getRandomProxy();
  console.log('Usando proxy:', proxy.uri);

  // Actualizar las cookies con el timestamp actual
  const updatedCookies = youtubeCookies.map(cookie => ({
    ...cookie,
    expirationDate: Date.now() + 86400000 // 24 horas
  }));

  // Crear agente con proxy y cookies
  return ytdl.createProxyAgent(proxy, updatedCookies);
};

// Función para agregar un retraso aleatorio
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Configurar CORS
app.use(cors({
  origin: FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => res.send('Servidor de descarga de YouTube funcionando'));

app.post('/download/audio', async (req, res) => {
  const { url } = req.body;
  let outputFileName;

  try {
    if (!url) {
      throw new Error('URL no proporcionada');
    }

    // Agregar un pequeño retraso aleatorio
    await delay(Math.random() * 2000 + 1000);

    // Crear un nuevo agente para esta solicitud
    const agent = getCustomAgent();

    console.log('Obteniendo información del video...');
    const info = await ytdl.getInfo(url, {
      agent,
      playerClients: ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"]
    });
    
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const tempFileName = `temp_${Date.now()}.mp3`;
    outputFileName = tempFileName;
    console.log('Nombre del archivo:', outputFileName);

    // Agregar otro pequeño retraso aleatorio
    await delay(Math.random() * 1000 + 500);

    // Crear un nuevo agente para la descarga
    const downloadAgent = getCustomAgent();

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly',
      agent: downloadAgent,
      playerClients: ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"]
    });

    console.log('Iniciando conversión de audio...');
    ffmpeg(audioStream)
      .toFormat('mp3')
      .audioBitrate('192k')
      .on('error', (err) => {
        console.error('Error en la conversión:', err);
        cleanup(outputFileName);
        if (!res.headersSent) {
          res.status(500).send('Error al procesar el archivo de audio.');
        }
      })
      .on('progress', (progress) => {
        console.log('Progreso de conversión:', progress.percent, '%');
      })
      .on('end', () => {
        console.log('Conversión completada, enviando archivo...');
        if (fs.existsSync(outputFileName)) {
          res.download(outputFileName, `${title}.mp3`, (err) => {
            cleanup(outputFileName);
            if (err) {
              console.error('Error al enviar el archivo:', err);
            }
          });
        } else {
          if (!res.headersSent) {
            res.status(500).send('Archivo no encontrado después de la conversión.');
          }
        }
      })
      .save(outputFileName);
  } catch (error) {
    console.error('Error:', error);
    cleanup(outputFileName);
    if (!res.headersSent) {
      res.status(500).send(error.message || 'Error al procesar la solicitud.');
    }
  }
});

app.post('/download/video', async (req, res) => {
  const { url } = req.body;
  let videoPath, audioPath, outputFileName;

  try {
    if (!url) {
      throw new Error('URL no proporcionada');
    }

    // Agregar un pequeño retraso aleatorio
    await delay(Math.random() * 2000 + 1000);

    // Crear un nuevo agente para esta solicitud
    const agent = getCustomAgent();

    console.log('Obteniendo información del video...');
    const info = await ytdl.getInfo(url, {
      agent,
      playerClients: ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"]
    });
    
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const timestamp = Date.now();
    outputFileName = `temp_${timestamp}.mp4`;
    videoPath = `temp_${timestamp}_video.mp4`;
    audioPath = `temp_${timestamp}_audio.mp3`;
    console.log('Nombre del archivo final:', outputFileName);

    // Agregar otro pequeño retraso aleatorio
    await delay(Math.random() * 1000 + 500);

    // Crear nuevos agentes para las descargas
    const videoAgent = getCustomAgent();
    const audioAgent = getCustomAgent();

    const videoStream = ytdl(url, { 
      quality: 'highestvideo',
      filter: 'videoonly',
      agent: videoAgent,
      playerClients: ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"]
    });

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly',
      agent: audioAgent,
      playerClients: ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"]
    });

    // Función de limpieza mejorada
    const cleanup = (error) => {
      console.log('Limpiando archivos temporales...');
      [videoPath, audioPath, outputFileName].forEach(file => {
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (err) {
            console.error(`Error al eliminar ${file}:`, err);
          }
        }
      });
      if (error && !res.headersSent) {
        res.status(500).send('Error al procesar los archivos.');
      }
    };

    // Manejo de errores mejorado
    const handleError = (stream, error) => {
      console.error('Error en stream:', error);
      cleanup(error);
    };

    videoStream.on('error', handleError);
    audioStream.on('error', handleError);

    console.log('Guardando streams de video y audio...');
    const videoWriteStream = fs.createWriteStream(videoPath);
    const audioWriteStream = fs.createWriteStream(audioPath);

    videoStream.pipe(videoWriteStream);
    audioStream.pipe(audioWriteStream);

    let videoFinished = false;
    let audioFinished = false;

    videoWriteStream.on('error', handleError);
    audioWriteStream.on('error', handleError);

    videoWriteStream.on('close', () => {
      console.log('Video descargado');
      videoFinished = true;
      if (audioFinished) combineStreams();
    });

    audioWriteStream.on('close', () => {
      console.log('Audio descargado');
      audioFinished = true;
      if (videoFinished) combineStreams();
    });

    function combineStreams() {
      console.log('Combinando streams de video y audio...');
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions('-preset ultrafast')
        .on('progress', (progress) => {
          console.log('Progreso de combinación:', progress.percent, '%');
        })
        .on('error', (err) => {
          console.error('Error en la combinación:', err);
          cleanup(err);
        })
        .on('end', () => {
          console.log('Combinación completada, enviando archivo...');
          if (fs.existsSync(outputFileName)) {
            res.download(outputFileName, `${title}.mp4`, (err) => {
              cleanup(err);
            });
          } else {
            cleanup(new Error('Archivo no encontrado después de la conversión.'));
          }
        })
        .save(outputFileName);
    }
  } catch (error) {
    console.error('Error:', error);
    cleanup(error);
  }
});

// Función de limpieza global
function cleanup(file) {
  if (file && fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.error(`Error al eliminar ${file}:`, err);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

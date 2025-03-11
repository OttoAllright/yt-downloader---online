import express from 'express';
import cors from 'cors';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { FRONTEND_URL } from './logic/const.js';
import play from 'play-dl';

const PORT = process.env.PORT || 3000;
const app = express();

// Configurar ffmpeg con el binario estático
ffmpeg.setFfmpegPath(ffmpegStatic);

// Lista de User Agents realistas
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Edge/122.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
];

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

    console.log('Obteniendo información del video...');
    const videoInfo = await play.video_info(url);
    if (!videoInfo) {
      throw new Error('No se pudo obtener la información del video');
    }

    const title = videoInfo.video_details.title.replace(/[^\w\s]/gi, '');
    const tempFileName = `temp_${Date.now()}.mp3`;
    outputFileName = tempFileName;
    console.log('Nombre del archivo:', outputFileName);

    // Obtener el stream de audio
    const stream = await play.stream(url, {
      quality: 2, // 0 = lowest, 2 = highest
      discordPlayerCompatibility: false
    });

    console.log('Iniciando conversión de audio...');
    ffmpeg(stream.stream)
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
  let outputFileName;

  try {
    if (!url) {
      throw new Error('URL no proporcionada');
    }

    // Agregar un pequeño retraso aleatorio
    await delay(Math.random() * 2000 + 1000);

    console.log('Obteniendo información del video...');
    const videoInfo = await play.video_info(url);
    if (!videoInfo) {
      throw new Error('No se pudo obtener la información del video');
    }

    const title = videoInfo.video_details.title.replace(/[^\w\s]/gi, '');
    outputFileName = `temp_${Date.now()}.mp4`;
    console.log('Nombre del archivo:', outputFileName);

    // Obtener el stream de video con la mejor calidad
    const stream = await play.stream(url, {
      quality: 2, // 0 = lowest, 2 = highest
      discordPlayerCompatibility: false
    });

    // Crear el stream de escritura
    const writeStream = fs.createWriteStream(outputFileName);

    // Pipe el stream de video al archivo
    stream.stream.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log('Descarga completada, enviando archivo...');
      res.download(outputFileName, `${title}.mp4`, (err) => {
        cleanup(outputFileName);
        if (err) {
          console.error('Error al enviar el archivo:', err);
        }
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error al escribir el archivo:', err);
      cleanup(outputFileName);
      if (!res.headersSent) {
        res.status(500).send('Error al procesar el archivo de video.');
      }
    });

  } catch (error) {
    console.error('Error:', error);
    cleanup(outputFileName);
    if (!res.headersSent) {
      res.status(500).send(error.message || 'Error al procesar la solicitud.');
    }
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

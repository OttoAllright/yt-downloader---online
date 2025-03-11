import express from 'express';
import cors from 'cors';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { FRONTEND_URL } from './logic/const.js';

const PORT = process.env.PORT || 3000;
const app = express();

// Configurar ffmpeg con el binario estático
ffmpeg.setFfmpegPath(ffmpegStatic);

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

    console.log('Obteniendo información del video...');
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const tempFileName = `temp_${Date.now()}.mp3`;
    outputFileName = tempFileName;
    console.log('Nombre del archivo:', outputFileName);

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly'
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

    console.log('Obteniendo información del video...');
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const timestamp = Date.now();
    outputFileName = `temp_${timestamp}.mp4`;
    videoPath = `temp_${timestamp}_video.mp4`;
    audioPath = `temp_${timestamp}_audio.mp3`;
    console.log('Nombre del archivo final:', outputFileName);

    const videoStream = ytdl(url, { 
      quality: 'highestvideo',
      filter: 'videoonly'
    });

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly'
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

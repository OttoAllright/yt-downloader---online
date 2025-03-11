import express from 'express';
import cors from 'cors';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { FRONTEND_URL,PORT } from './logic/const.js';

const app = express();

app.use(cors({
 
}));
app.use(express.json());

app.get('/', (req, res) => res.send('Servidor de descarga de YouTube funcionando'));

app.post('/download/audio', async (req, res) => {
  const { url } = req.body;
  let outputFileName;

  try {
    console.log('Obteniendo información del video...');
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const tempFileName = `${title}_${Date.now()}.mp3`;
    outputFileName = tempFileName;
    console.log('Nombre del archivo:', outputFileName);

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      }
    });

    console.log('Iniciando conversión de audio...');
    ffmpeg(audioStream)
      .audioBitrate(256)
      .audioCodec('libmp3lame')
      .audioChannels(2)
      .audioFrequency(44100)
      .format('mp3')
      .on('error', (err) => {
        console.error('Error en la conversión:', err);
        if (outputFileName && fs.existsSync(outputFileName)) {
          fs.unlinkSync(outputFileName);
        }
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
            if (fs.existsSync(outputFileName)) {
              fs.unlinkSync(outputFileName);
            }
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
    if (outputFileName && fs.existsSync(outputFileName)) {
      fs.unlinkSync(outputFileName);
    }
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
    outputFileName = `${title}_${Date.now()}.mp4`;
    videoPath = `${title}_${Date.now()}_video.mp4`;
    audioPath = `${title}_${Date.now()}_audio.mp3`;
    console.log('Nombre del archivo final:', outputFileName);

    const videoStream = ytdl(url, { 
      quality: 'highestvideo',
      filter: 'videoonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      }
    });

    const audioStream = ytdl(url, { 
      quality: 'highestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      }
    });

    videoStream.on('error', cleanup);
    audioStream.on('error', cleanup);

    console.log('Guardando streams de video y audio...');
    const videoWriteStream = fs.createWriteStream(videoPath);
    const audioWriteStream = fs.createWriteStream(audioPath);

    videoStream.pipe(videoWriteStream);
    audioStream.pipe(audioWriteStream);

    let videoFinished = false;
    let audioFinished = false;

    videoWriteStream.on('error', cleanup);
    audioWriteStream.on('error', cleanup);

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

    function cleanup(error) {
      console.log('Limpiando archivos temporales...');
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (outputFileName && fs.existsSync(outputFileName)) fs.unlinkSync(outputFileName);
      if (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
          res.status(500).send('Error al procesar los archivos.');
        }
      }
    }

    function combineStreams() {
      console.log('Combinando streams de video y audio...');
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate(256)
        .audioChannels(2)
        .audioFrequency(44100)
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
    cleanup(error);
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

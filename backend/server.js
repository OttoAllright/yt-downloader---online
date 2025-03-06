import express from 'express';
import cors from 'cors';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Servidor de descarga de YouTube funcionando'));

app.post('/download/audio', async (req, res) => {
  const { url } = req.body;
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
  const outputFileName = `${title}_${Date.now()}.mp3`;

  const audioStream = ytdl(url, { 
    quality: 'highestaudio',
    filter: 'audioonly',
  });

  ffmpeg(audioStream)
    .audioBitrate(256)
    .audioCodec('libmp3lame')
    .audioChannels(2)
    .audioFrequency(44100)
    .format('mp3')
    .on('error', (err) => console.error('Error:', err))
    .on('end', () => {
      res.download(outputFileName, () => {
        fs.unlinkSync(outputFileName);
      });
    })
    .save(outputFileName);
});

app.post('/download/video', async (req, res) => {
  const { url } = req.body;
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
  const outputFileName = `${title}_${Date.now()}.mp4`;

  const videoStream = ytdl(url, { 
    quality: 'highestvideo',
    filter: 'videoonly',
  });

  const audioStream = ytdl(url, { 
    quality: 'highestaudio',
    filter: 'audioonly',
  });

  const videoPath = `${title}_${Date.now()}_video.mp4`;
  const audioPath = `${title}_${Date.now()}_audio.mp3`;

  // Guardar flujos de video y audio por separado
  const videoWriteStream = fs.createWriteStream(videoPath);
  const audioWriteStream = fs.createWriteStream(audioPath);

  videoStream.pipe(videoWriteStream);
  audioStream.pipe(audioWriteStream);

  let videoFinished = false;
  let audioFinished = false;

  videoWriteStream.on('close', () => {
    videoFinished = true;
    if (audioFinished) combineStreams();
  });

  audioWriteStream.on('close', () => {
    audioFinished = true;
    if (videoFinished) combineStreams();
  });

  function combineStreams() {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(256)
      .audioChannels(2)
      .audioFrequency(44100)
      .outputOptions('-preset ultrafast')
      .on('error', (err) => {
        console.error('Error:', err);
        res.status(500).send('Error al procesar el archivo de video.');
      })
      .on('end', () => {
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
        res.download(outputFileName, () => {
          fs.unlinkSync(outputFileName);
        });
      })
      .save(outputFileName);
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// import express from 'express';
// import cors from 'cors'; // Importar el paquete cors
// import fs from 'fs';
// import ytdl from '@distube/ytdl-core';

// const app = express();
// const PORT = 3000;

// // Habilitar CORS libre
// app.use(cors());

// // Middleware para parsear JSON
// app.use(express.json());

// // Ruta principal
// app.get('/', (req, res) => {
//   res.send('Servidor de descarga de YouTube funcionando');
// });

// const url = "https://www.youtube.com/watch?v=bW4nKN0QL5A"
// let info = await ytdl.getInfo(url)
// const title = info.videoDetails.title.replace(/[^\w\s]/gi, '')

// ytdl(url, { filter:'audioonly', quality: 'highestaudio' }).pipe(
//   fs.createWriteStream(`${title} ${Date.now()}.mp3`))

// // Iniciar el servidor
// app.listen(PORT);

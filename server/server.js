const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
// SERVER_PORT e non PORT: Angular usa già PORT per il suo server di sviluppo.
// Se la cambi, aggiorna anche client/proxy.conf.json.
const PORT = process.env.SERVER_PORT || 3000;
const MAX_FILE_SIZE_MB = 100;

// Cartella dove vengono salvati i file caricati
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Abilita CORS (utile se il client gira su un'altra porta senza proxy)
app.use(cors());

// Rende accessibili i file caricati, es. http://localhost:3000/uploads/123.png
app.use('/uploads', express.static(uploadsDir));

// Tipo di media in base all'estensione
const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'];
const VIDEO_EXT = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];

function mediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return null;
}

// Informazioni su un file salvato
function fileInfo(filename) {
  const stats = fs.statSync(path.join(uploadsDir, filename));
  return {
    name: filename,
    url: `/uploads/${encodeURIComponent(filename)}`,
    type: mediaType(filename),
    size: stats.size,
    uploadedAt: stats.mtime.toISOString(),
  };
}

class UploadError extends Error {}

// Configurazione multer: nome univoco e solo immagini o video
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = Math.round(Math.random() * 1e6);
    cb(null, `${Date.now()}-${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isMedia = /^(image|video)\//.test(file.mimetype) && mediaType(file.originalname);
    if (isMedia) return cb(null, true);
    cb(new UploadError('Puoi caricare solo immagini o video.'));
  },
});

// POST /upload: riceve un file nel campo "file"
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato.' });
  console.log('File caricato:', req.file.filename);
  res.status(201).json(fileInfo(req.file.filename));
});

// GET /files: elenco dei file caricati, dal più recente
app.get('/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Errore nella lettura dei file.' });
    const list = files
      .filter((name) => mediaType(name))
      .map(fileInfo)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    res.json(list);
  });
});

// DELETE /files/:name: elimina un file
app.delete('/files/:name', (req, res) => {
  // basename evita percorsi tipo "../server.js"
  const name = path.basename(req.params.name);
  const filePath = path.join(uploadsDir, name);
  if (!mediaType(name) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File non trovato.' });
  }
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Impossibile eliminare il file.' });
    console.log('File eliminato:', name);
    res.status(204).end();
  });
});

// Gestione degli errori di caricamento (file troppo grande, tipo sbagliato...)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `Il file supera i ${MAX_FILE_SIZE_MB} MB.` });
  }
  if (err instanceof multer.MulterError || err instanceof UploadError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server.' });
});

app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));

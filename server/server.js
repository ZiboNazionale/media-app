const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Abilita CORS
app.use(cors());

// Imposta cartella uploads statica
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Configurazione multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Endpoint POST /upload per ricevere i file dal client
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Nessun file caricato.');
  console.log('File caricato:', req.file.filename);
  res.send(req.file.filename);
});

// Endpoint GET /files per restituire la lista dei file caricati
app.get('/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).send('Errore lettura uploads');
    res.json(files); // invia la lista dei file come array
  });
});
app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));
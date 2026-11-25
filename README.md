# Media App

Una piccola web app per **caricare immagini e video** e guardarli in una **galleria**.
È composta da due parti:

- **client/**: l'interfaccia, fatta con **Angular**;
- **server/**: le API, fatte con **Node.js**, **Express** e **Multer**. I file vengono salvati nella cartella `server/uploads/`.

## Funzionalità

- Caricamento di più file insieme, trascinandoli nel riquadro o scegliendoli dal computer.
- Anteprima e barra di avanzamento per ogni file.
- Controlli sia nel browser sia sul server: si accettano solo immagini e video, al massimo 100 MB per file.
- Galleria ordinata dal file più recente, con filtro *Tutti / Immagini / Video*.
- Visualizzatore a schermo intero: frecce (anche da tastiera) per passare al file dopo, pulsanti per scaricare ed eliminare.
- Messaggi di errore chiari, per esempio quando il server è spento.
- Tema chiaro o scuro in automatico e layout adatto al telefono.

## Requisiti

- [Node.js](https://nodejs.org/) 22.22.3 o più recente, oppure 24.15 o più recente (lo richiede Angular 22)
- npm (arriva insieme a Node.js)

## Installazione

Dalla cartella principale del progetto:

```bash
npm run install:all
```

Il comando installa le dipendenze di tutte e tre le parti: cartella principale, `server/` e `client/`.

## Avvio

```bash
npm start
```

Il comando avvia insieme:

- il **server** su <http://localhost:3000>;
- il **client** su <http://localhost:4200>: apri questo indirizzo nel browser.

Il client manda le richieste per `/upload`, `/files` e `/uploads` al server attraverso un proxy (`client/proxy.conf.json`), quindi non serve configurare altro.

Puoi anche avviare le due parti separatamente, in due terminali:

```bash
npm run server   # solo il server
npm run client   # solo il client
```

## API del server

| Metodo   | Percorso            | Cosa fa                                                       |
| -------- | ------------------- | ------------------------------------------------------------- |
| `POST`   | `/upload`           | Carica un file, inviato come `multipart/form-data` nel campo `file` |
| `GET`    | `/files`            | Restituisce l'elenco dei file (nome, url, tipo, dimensione, data) |
| `DELETE` | `/files/:nome`      | Elimina un file                                               |
| `GET`    | `/uploads/:nome`    | Restituisce il file vero e proprio                            |

Gli errori arrivano in formato JSON, per esempio `{ "error": "Puoi caricare solo immagini o video." }`.

La porta del server si può cambiare con la variabile `SERVER_PORT`. In quel caso va aggiornata anche `client/proxy.conf.json`.

## Test

```bash
cd client
npm test
```

## Struttura

```
media-app/
├── package.json          # script per avviare tutto insieme
├── server/
│   ├── server.js         # API Express
│   └── uploads/          # file caricati (esclusi da git)
└── client/
    ├── proxy.conf.json   # inoltra le chiamate API al server
    └── src/app/
        ├── media.service.ts      # chiamate HTTP e stato condiviso
        ├── upload-panel/         # riquadro di caricamento
        └── media-gallery/        # galleria e visualizzatore
```

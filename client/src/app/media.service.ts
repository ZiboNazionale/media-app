import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

/** Un file salvato sul server, come lo restituisce GET /files. */
export interface MediaFile {
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  uploadedAt: string;
}

/** Stato di un caricamento in corso: percentuale oppure file finito. */
export type UploadEvent = { progress: number } | { done: MediaFile };

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  /** Elenco dei file, condiviso tra i componenti. */
  readonly files = signal<MediaFile[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadFiles(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<MediaFile[]>('/files').subscribe({
      next: (files) => {
        this.files.set(files);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err, 'Impossibile caricare la galleria. Il server è acceso?'));
        this.loading.set(false);
      },
    });
  }

  upload(file: File): Observable<UploadEvent> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<MediaFile>('/upload', body, { reportProgress: true, observe: 'events' })
      .pipe(
        filter((e) => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
        map((e): UploadEvent => {
          if (e.type === HttpEventType.UploadProgress) {
            return { progress: e.total ? Math.round((e.loaded / e.total) * 100) : 0 };
          }
          const saved = e.body!;
          this.files.update((list) => [saved, ...list]);
          return { done: saved };
        }),
      );
  }

  delete(file: MediaFile): Observable<void> {
    return this.http
      .delete<void>(`/files/${encodeURIComponent(file.name)}`)
      .pipe(map(() => this.files.update((list) => list.filter((f) => f.name !== file.name))));
  }
}

/** Estrae il messaggio di errore mandato dal server, se c'è. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Il server non risponde. Controlla che sia avviato.';
    if (typeof err.error?.error === 'string') return err.error.error;
  }
  return fallback;
}

/** Dimensione leggibile, es. 1.5 MB. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

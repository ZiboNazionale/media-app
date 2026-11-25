import { Component, inject, signal } from '@angular/core';
import { MediaService, errorMessage, formatSize } from '../media.service';

/** Un file in coda di caricamento. */
interface QueueItem {
  id: number;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  message?: string;
}

const MAX_SIZE_MB = 100;
let nextId = 0;

@Component({
  selector: 'app-upload-panel',
  templateUrl: './upload-panel.html',
  styleUrl: './upload-panel.css',
})
export class UploadPanel {
  private readonly media = inject(MediaService);

  protected readonly queue = signal<QueueItem[]>([]);
  protected readonly dragging = signal(false);
  protected readonly formatSize = formatSize;
  protected readonly maxSizeMb = MAX_SIZE_MB;

  onFilesSelected(input: HTMLInputElement): void {
    this.addFiles(input.files);
    input.value = ''; // permette di riselezionare lo stesso file
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  clearFinished(): void {
    for (const item of this.queue()) {
      if (item.status !== 'uploading') URL.revokeObjectURL(item.preview);
    }
    this.queue.update((q) => q.filter((i) => i.status === 'uploading'));
  }

  protected hasFinished(): boolean {
    return this.queue().some((i) => i.status !== 'uploading');
  }

  private addFiles(files: FileList | null): void {
    for (const file of Array.from(files ?? [])) {
      const item: QueueItem = {
        id: nextId++,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'uploading',
      };
      this.queue.update((q) => [item, ...q]);

      // Controlli fatti subito nel browser, prima di inviare
      if (!/^(image|video)\//.test(file.type)) {
        this.patch(item.id, { status: 'error', message: 'Non è un\'immagine o un video.' });
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        this.patch(item.id, { status: 'error', message: `Supera i ${MAX_SIZE_MB} MB.` });
        continue;
      }

      this.media.upload(file).subscribe({
        next: (e) => {
          if ('progress' in e) this.patch(item.id, { progress: e.progress });
          else this.patch(item.id, { progress: 100, status: 'done' });
        },
        error: (err) =>
          this.patch(item.id, { status: 'error', message: errorMessage(err, 'Caricamento non riuscito.') }),
      });
    }
  }

  private patch(id: number, changes: Partial<QueueItem>): void {
    this.queue.update((q) => q.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }
}

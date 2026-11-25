import { DatePipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { MediaFile, MediaService, errorMessage, formatSize } from '../media.service';

type Filter = 'all' | 'image' | 'video';

@Component({
  selector: 'app-media-gallery',
  imports: [DatePipe],
  templateUrl: './media-gallery.html',
  styleUrl: './media-gallery.css',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class MediaGallery {
  protected readonly media = inject(MediaService);
  protected readonly formatSize = formatSize;

  protected readonly filter = signal<Filter>('all');
  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'image', label: 'Immagini' },
    { value: 'video', label: 'Video' },
  ];

  protected readonly visible = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.media.files() : this.media.files().filter((m) => m.type === f);
  });

  protected count(f: Filter): number {
    return f === 'all' ? this.media.files().length : this.media.files().filter((m) => m.type === f).length;
  }

  // Visualizzatore a schermo intero
  private readonly viewer = viewChild.required<ElementRef<HTMLDialogElement>>('viewer');
  protected readonly selected = signal<MediaFile | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  open(file: MediaFile): void {
    this.selected.set(file);
    this.deleteError.set(null);
    if (!this.viewer().nativeElement.open) this.viewer().nativeElement.showModal();
  }

  close(): void {
    this.viewer().nativeElement.close();
  }

  /** Va al file precedente (-1) o successivo (+1) nella lista visibile. */
  step(delta: number): void {
    const list = this.visible();
    const current = this.selected();
    if (!current || !list.length) return;
    const index = list.findIndex((f) => f.name === current.name);
    this.open(list[(index + delta + list.length) % list.length]);
  }

  onKey(event: KeyboardEvent): void {
    if (!this.selected() || !this.viewer().nativeElement.open) return;
    if (event.key === 'ArrowRight') this.step(1);
    if (event.key === 'ArrowLeft') this.step(-1);
  }

  remove(file: MediaFile): void {
    if (!confirm('Vuoi eliminare questo file? Non si può annullare.')) return;
    this.media.delete(file).subscribe({
      next: () => this.close(),
      error: (err) => this.deleteError.set(errorMessage(err, 'Eliminazione non riuscita.')),
    });
  }
}

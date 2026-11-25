import { Component, OnInit, inject } from '@angular/core';
import { MediaGallery } from './media-gallery/media-gallery';
import { MediaService } from './media.service';
import { UploadPanel } from './upload-panel/upload-panel';

@Component({
  selector: 'app-root',
  imports: [UploadPanel, MediaGallery],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly media = inject(MediaService);

  ngOnInit(): void {
    this.media.loadFiles();
  }
}

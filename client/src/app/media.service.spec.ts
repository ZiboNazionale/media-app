import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MediaFile, MediaService, formatSize } from './media.service';

const sample: MediaFile = {
  name: '1.png',
  url: '/uploads/1.png',
  type: 'image',
  size: 2048,
  uploadedAt: '2026-01-01T10:00:00.000Z',
};

describe('MediaService', () => {
  let service: MediaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaService);
    http = TestBed.inject(HttpTestingController);
  });

  it('carica la lista dei file', () => {
    service.loadFiles();
    http.expectOne('/files').flush([sample]);
    expect(service.files()).toEqual([sample]);
    expect(service.loading()).toBe(false);
  });

  it('mostra un errore se il server non risponde', () => {
    service.loadFiles();
    http.expectOne('/files').error(new ProgressEvent('error'), { status: 0 });
    expect(service.error()).toContain('server');
  });

  it('toglie il file dalla lista dopo averlo eliminato', () => {
    service.files.set([sample]);
    service.delete(sample).subscribe();
    const req = http.expectOne('/files/1.png');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.files()).toEqual([]);
  });

  it('formatta le dimensioni', () => {
    expect(formatSize(500)).toBe('500 B');
    expect(formatSize(2048)).toBe('2.0 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

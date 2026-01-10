import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServerConfigService {
  serverUrl = signal('http://localhost:7860');
  uiMode = signal(true); // true = UI mode (with A2UI), false = text mode (no A2UI)
}

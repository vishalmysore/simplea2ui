import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServerConfigService {
  serverUrl = signal(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:7860'
    : 'https://vishalmysore-a2ui.hf.space');
  uiMode = signal(true); // true = UI mode (with A2UI), false = text mode (no A2UI)
  username = signal('');
  password = signal('');
  // When true, the client will send Authorization header with username/password
  sendCredentials = signal(false);
  lastHeaders = signal<Record<string, string>>({});
  availableServers = signal<string[]>([
    'http://localhost:7860',
    'https://vishalmysore-fraudagent.hf.space',
    'https://vishalmysore-a2ui.hf.space',
    'https://vishalmysore-a2amcpdatabase.hf.space/',
    'https://vishalmysore-a2amcpdatabase.hf.space/'
  ]);
}

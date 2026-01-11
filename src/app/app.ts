import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';  
import { MessageProcessor, Surface } from '@a2ui/angular';  
import { A2aService } from './a2a.service';  
import type { Part } from '@a2a-js/sdk';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ServerConfigService } from './server-config.service';
  
@Component({  
  selector: 'app-root',  
  standalone: true,  
  imports: [Surface, CommonModule],  
  template: `  
    <div class="container">
      <div class="left-panel">
        <h1>SimpleA2UI : A2UI Client</h1>
        
        <form (submit)="handleSubmit($event)" class="message-form">  
          <input type="text" name="body" placeholder="Enter message" />  
          <button type="submit">Send</button>
          <button type="button" class="clear-btn" (click)="clearChat()">Clear Chat</button>  
        </form>  
          
        @if (loading()) {  
          <div class="loading">Loading...</div>  
        }  
          
        @if (error()) {  
          <div class="error">Error: {{ error() }}</div>  
        }  
          
        @if (showSurfaces()) {
          <div class="surfaces">
            @for (surface of processor.getSurfaces(); track surface[0]) {
              @if (activeSurfaceIds().has(surface[0])) {
                <a2ui-surface 
                  [surfaceId]="surface[0]" 
                  [surface]="surface[1]" />  
              }
            }
          </div>
        }
        
        @if (!serverConfig.uiMode() && textResponse()) {
          <div class="text-response">
            <h3>Response:</h3>
            <pre>{{ textResponse() }}</pre>
          </div>
        }
        
        <div class="debug-panel">
          <button class="debug-toggle" (click)="toggleDebug()">
            {{ showDebug() ? '▼' : '▶' }} Debug: Raw Request/Response
          </button>
          
          @if (showDebug()) {
            <div class="debug-content">
              @if (lastRequest()) {
                <div class="debug-section">
                  <div class="debug-header">
                    <h4>Last Request</h4>
                    <button class="copy-btn" (click)="copyToClipboard(formatJson(lastRequest()))">Copy</button>
                  </div>
                  <pre>{{ formatJson(lastRequest()) }}</pre>
                </div>
              }
              
              @if (lastResponse()) {
                <div class="debug-section">
                  <div class="debug-header">
                    <h4>Last Response</h4>
                    <button class="copy-btn" (click)="copyToClipboard(formatJson(lastResponse()))">Copy</button>
                  </div>
                  <pre>{{ formatJson(lastResponse()) }}</pre>
                </div>
              }
              
              @if (!lastRequest() && !lastResponse()) {
                <p class="debug-empty">No request/response data yet. Send a message to see debug info.</p>
              }
            </div>
          }
        </div>
      </div>
      
      <div class="right-panel">
        <div class="mode-toggle">
          <div class="mode-label">Response Mode:</div>
          <div class="toggle-buttons">
            <button 
              class="mode-btn" 
              [class.active]="serverConfig.uiMode()"
              (click)="setMode(true)">
              UI
            </button>
            <button 
              class="mode-btn" 
              [class.active]="!serverConfig.uiMode()"
              (click)="setMode(false)">
              Text
            </button>
          </div>
        </div>
        
        <div class="server-status">
          <div class="status-info">
            <strong>Server:</strong> {{ serverUrl() }}
          </div>
          <button class="connect-btn" (click)="toggleConnectForm()">
            {{ showConnectForm() ? 'Cancel' : 'Change Server' }}
          </button>
        </div>
        
        @if (showConnectForm()) {
          <div class="connect-form">
            <input 
              type="text" 
              [value]="tempUrl()" 
              (input)="tempUrl.set($any($event.target).value)" 
              placeholder="http://localhost:7860" />
            <button (click)="connectToServer()">Connect</button>
          </div>
        }
        
        <button class="toggle-btn" (click)="toggleAgentCard()">
          {{ showAgentCard() ? 'Hide' : 'Show' }} Agent Card
        </button>
        
        <button class="test-btn" (click)="toggleTestPanel()">
          {{ showTestPanel() ? 'Hide' : 'Test A2UI Renderer' }}
        </button>
        
        @if (showTestPanel()) {
          <div class="test-panel">
            <h3>Test A2UI JSON</h3>
            <p class="test-description">Paste your A2UI JSON below to see how it renders. Supports both direct A2UI JSON and full JSON-RPC responses.</p>
            <textarea 
              class="test-textarea"
              [value]="testJson()"
              (input)="testJson.set($any($event.target).value)"
              placeholder='Paste A2UI JSON or full response here, e.g.:
{
  "surfaceUpdate": {
    "surfaceId": "test",
    "components": [...]
  }
}

OR full response:
{
  "result": {
    "status": {
      "message": {
        "parts": [...]
      }
    }
  }
}'></textarea>
            <div class="test-actions">
              <button class="render-btn" (click)="renderTestJson()">Render Test</button>
              <button class="clear-test-btn" (click)="clearTest()">Clear Test</button>
            </div>
            @if (testError()) {
              <div class="test-error">{{ testError() }}</div>
            }
          </div>
        }
        
        <button class="about-btn" (click)="toggleAbout()">
          {{ showAbout() ? 'Hide' : 'About' }}
        </button>
        
        @if (showAbout()) {
          <div class="about-section">
            <h3>About SimpleA2UI</h3>
            <p>SimpleA2UI is a simple a2ui client which works with a2a and a2ui protocol, developed by Vishal Mysore</p>
          </div>
        }
        
        @if (showAgentCard() && agentCard()) {
          <div class="agent-card">
            <div class="agent-header">
              <h2>{{ agentCard().name }}</h2>
              <span class="version">v{{ agentCard().version }}</span>
            </div>
            
            <p class="description">{{ agentCard().description }}</p>
            
            <div class="info-section">
              <div class="info-item">
                <strong>Provider:</strong> {{ agentCard().provider?.organization }}
              </div>
              <div class="info-item">
                <strong>Protocol:</strong> {{ agentCard().protocolVersion }}
              </div>
              <div class="info-item">
                <strong>Streaming:</strong> {{ agentCard().capabilities?.streaming ? 'Yes' : 'No' }}
              </div>
              <div class="info-item">
                <strong>Push Notifications:</strong> {{ agentCard().capabilities?.pushNotifications ? 'Yes' : 'No' }}
              </div>
            </div>
            
            <div class="skills-section">
              <h3>Available Skills</h3>
              <div class="skills-grid">
                @for (skill of agentCard().skills; track skill.id) {
                  <div class="skill-card">
                    <h4>{{ skill.name }}</h4>
                    <p class="skill-description">{{ skill.description }}</p>
                    
                    <div class="skill-tags">
                      @for (tag of skill.tags; track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                    </div>
                    
                    @if (skill.examples && skill.examples.length > 0) {
                      <div class="skill-examples">
                        <strong>Examples:</strong>
                        <ul>
                          @for (example of skill.examples; track example) {
                            <li>{{ example }}</li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
    
    <div class="footer">
      <p>SimpleA2UI is an open source client implementation of the A2UI protocol developed by Vishal Mysore</p>
    </div>
  `,
  styles: `
    .container {
      display: flex;
      height: calc(100vh - 60px);
      background: #f5f7fa;
    }
    
    .left-panel {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
    
    .right-panel {
      width: 450px;
      background: white;
      border-left: 1px solid #e1e8ed;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .mode-toggle {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid #e1e8ed;
    }
    
    .mode-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }
    
    .toggle-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .mode-btn {
      flex: 1;
      padding: 0.5rem;
      background: white;
      color: #64748b;
      border: 2px solid #e1e8ed;
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    .mode-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .mode-btn.active {
      background: #1da1f2;
      color: white;
      border-color: #1da1f2;
    }
    
    .mode-btn.active:hover {
      background: #1a91da;
      border-color: #1a91da;
    }
    
    h1 {
      color: #1a1a1a;
      margin: 0 0 1.5rem 0;
      font-size: 2rem;
    }
    
    .message-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .clear-btn {
      background: #ef4444;
      color: white;
      padding: 0.75rem 1rem;
    }
    
    .clear-btn:hover {
      background: #dc2626;
    }
    
    input[type="text"] {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 1rem;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      background: #1da1f2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    
    button:hover {
      background: #1a91da;
    }
    
    .loading {
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
    }
    
    .error {
      padding: 1rem;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;
      margin-bottom: 1rem;
    }
    
    .surfaces {
      margin-top: 1.5rem;
    }
    
    .text-response {
      margin-top: 1.5rem;
      background: #f7fafc;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .text-response h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      color: #1a1a1a;
    }
    
    .text-response pre {
      margin: 0;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e1e8ed;
      border-radius: 4px;
      font-size: 0.9rem;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #1a1a1a;
    }
    
    .debug-panel {
      margin-top: 2rem;
      border-top: 1px solid #e1e8ed;
      padding-top: 1rem;
    }
    
    .debug-toggle {
      width: 100%;
      text-align: left;
      background: #f7fafc;
      color: #1a1a1a;
      border: 1px solid #e1e8ed;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    .debug-toggle:hover {
      background: #e2e8f0;
    }
    
    .debug-content {
      margin-top: 1rem;
      background: #1e293b;
      border-radius: 8px;
      padding: 1rem;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .debug-section {
      margin-bottom: 1.5rem;
    }
    
    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .copy-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .copy-btn:hover {
      background: #2563eb;
    }
    
    .debug-section:last-child {
      margin-bottom: 0;
    }
    
    .debug-section h4 {
      color: #60a5fa;
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    .debug-section pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
      line-height: 1.5;
      overflow-x: auto;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .debug-empty {
      color: #94a3b8;
      font-style: italic;
      margin: 0;
      padding: 1rem;
      text-align: center;
    }
    
    .server-status {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .status-info {
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
      color: #444;
      word-break: break-all;
    }
    
    .status-info strong {
      color: #1a1a1a;
    }
    
    .connect-btn {
      width: 100%;
      padding: 0.75rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .connect-btn:hover {
      background: #059669;
    }
    
    .connect-form {
      background: white;
      padding: 1rem;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .connect-form input {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    
    .connect-form button {
      width: 100%;
      background: #10b981;
    }
    
    .connect-form button:hover {
      background: #059669;
    }
    
    .toggle-btn {
      width: 100%;
      padding: 0.75rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.75rem;
    }
    
    .toggle-btn:hover {
      background: #5568d3;
    }
    
    .about-btn {
      width: 100%;
      padding: 0.75rem;
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .about-btn:hover {
      background: #d97706;
    }
    
    .test-btn {
      width: 100%;
      padding: 0.75rem;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.75rem;
    }
    
    .test-btn:hover {
      background: #7c3aed;
    }
    
    .test-panel {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .test-panel h3 {
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
      font-size: 1.125rem;
    }
    
    .test-description {
      margin: 0 0 1rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .test-textarea {
      width: 100%;
      min-height: 200px;
      padding: 0.75rem;
      border: 1px solid #e1e8ed;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      resize: vertical;
      margin-bottom: 1rem;
    }
    
    .test-textarea:focus {
      outline: none;
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }
    
    .test-actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .render-btn {
      flex: 1;
      padding: 0.75rem;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .render-btn:hover {
      background: #7c3aed;
    }
    
    .clear-test-btn {
      padding: 0.75rem 1.5rem;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .clear-test-btn:hover {
      background: #4b5563;
    }
    
    .test-error {
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      font-size: 0.875rem;
    }
        .about-section {
      background: #fffbeb;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #fcd34d;
      margin-bottom: 1rem;
      animation: slideIn 0.3s ease-out;
    }
    
    .about-section h3 {
      margin: 0 0 1rem 0;
      color: #92400e;
      font-size: 1.1rem;
    }
    
    .about-section p {
      margin: 0;
      color: #78350f;
      line-height: 1.6;
    }
    
    .agent-card {
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e1e8ed;
    }
    
    .agent-header h2 {
      margin: 0;
      color: #1a1a1a;
      font-size: 1.5rem;
    }
    
    .version {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .description {
      color: #657786;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    
    .info-section {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    
    .info-item {
      padding: 0.5rem 0;
      color: #444;
      font-size: 0.9rem;
    }
    
    .info-item strong {
      color: #1a1a1a;
      margin-right: 0.5rem;
    }
    
    .skills-section h3 {
      color: #1a1a1a;
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
    }
    
    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .skill-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.25rem;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .skill-card h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }
    
    .skill-description {
      opacity: 0.95;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }
    
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    
    .tag {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .skill-examples {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .skill-examples strong {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    
    .skill-examples ul {
      margin: 0;
      padding-left: 1.5rem;
    }
    
    .skill-examples li {
      font-size: 0.85rem;
      margin: 0.25rem 0;
      opacity: 0.9;
    }
    
    .footer {
      height: 60px;
      background: #1a1a1a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-top: 2px solid #667eea;
    }
    
    .footer p {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
    }
  `
})  
export class App implements OnInit, OnDestroy {  
  private a2aService = inject(A2aService);  
  protected processor = inject(MessageProcessor);  
  protected serverConfig = inject(ServerConfigService);
    
  protected loading = signal(false);  
  protected error = signal<string | null>(null);
  protected showAgentCard = signal(false);
  protected agentCard = signal<any>(null);
  protected showAbout = signal(false);
  protected serverUrl = this.serverConfig.serverUrl;
  protected showConnectForm = signal(false);
  protected tempUrl = signal('http://localhost:7860');
  protected showDebug = signal(false);
  protected lastRequest = signal<any>(null);
  protected lastResponse = signal<any>(null);
  protected textResponse = signal<string | null>(null);
  protected showTestPanel = signal(false);
  protected testJson = signal('');
  protected testError = signal<string | null>(null);
  protected showSurfaces = signal(true);
  protected activeSurfaceIds = signal<Set<string>>(new Set());
  
  private eventSubscription?: Subscription;
  
  async ngOnInit() {
    // Fetch agent card on initialization
    try {
      const card = await this.a2aService.getAgentCard();
      this.agentCard.set(card);
      console.log('Agent Card loaded:', card);
    } catch (err) {
      console.warn('Failed to load agent card:', err);
    }
    
    // Subscribe to A2UI events (button clicks, form submissions, etc.)
    this.eventSubscription = this.processor.events.subscribe(async (event) => {
      console.log('A2UI Event:', event);
      console.log('Event message:', JSON.stringify(event.message, null, 2));
      
      try {
        this.loading.set(true);
        
        // Send the client event message to the server
        const parts: Part[] = [
          {
            kind: 'data',
            metadata: {
              mimeType: 'application/json+a2ui'
            },
            data: event.message
          } as any
        ];
        
        // Capture request for debug
        this.lastRequest.set({
          timestamp: new Date().toISOString(),
          parts: parts
        });
        
        console.log('Sending action to server:', JSON.stringify(parts, null, 2));
        
        const response: any = await this.a2aService.sendMessage(parts);
        
        // Capture response for debug
        this.lastResponse.set({
          timestamp: new Date().toISOString(),
          data: response
        });
        
        console.log('Action response:', response);
        
        // Process the response and get server messages
        const serverMessages = this.processResponse(response);
        
        // Complete the event with server messages
        event.completion.next(serverMessages);
        event.completion.complete();
      } catch (err: any) {
        console.error('Error handling A2UI event:', err);
        this.error.set(err.message);
        event.completion.error(err);
      } finally {
        this.loading.set(false);
      }
    });
  }
  
  ngOnDestroy() {
    this.eventSubscription?.unsubscribe();
  }
  
  toggleAgentCard() {
    this.showAgentCard.set(!this.showAgentCard());
  }
  
  toggleAbout() {
    this.showAbout.set(!this.showAbout());
  }
  
  toggleTestPanel() {
    this.showTestPanel.set(!this.showTestPanel());
    if (!this.showTestPanel()) {
      this.testError.set(null);
    }
  }
  
  renderTestJson() {
    this.testError.set(null);
    const jsonStr = this.testJson().trim();
    
    if (!jsonStr) {
      this.testError.set('Please enter A2UI JSON to test');
      return;
    }
    
    // Clear any existing test surfaces before rendering new content
    const surfaceIds = Array.from(this.activeSurfaceIds());
    for (const surfaceId of surfaceIds) {
      try {
        this.processor.processMessages([{
          deleteSurface: {
            surfaceId: surfaceId
          }
        }]);
      } catch (deleteErr) {
        console.warn('Failed to delete surface:', surfaceId, deleteErr);
      }
    }
    this.activeSurfaceIds.set(new Set());
    
    try {
      const parsed = JSON.parse(jsonStr);
      let a2uiMessages: any[] = [];
      
      // Check if it's an array of A2UI messages (JSONL-style array)
      if (Array.isArray(parsed)) {
        // Array of A2UI messages
        for (const msg of parsed) {
          if (msg.surfaceUpdate || msg.dataModelUpdate || msg.beginRendering) {
            a2uiMessages.push(msg);
          }
        }
      } else if (parsed.surfaceUpdate || parsed.dataModelUpdate || parsed.beginRendering) {
        // Direct A2UI JSON
        a2uiMessages = [parsed];
      } else if (parsed.result?.status?.message?.parts) {
        // JSON-RPC response format - extract A2UI data from parts
        const parts = parsed.result.status.message.parts;
        for (const part of parts) {
          if (part.data && (part.data.surfaceUpdate || part.data.dataModelUpdate || part.data.beginRendering)) {
            a2uiMessages.push(part.data);
          }
        }
      } else if (parsed.data?.result?.status?.message?.parts) {
        // Wrapped response format - extract from data.result
        const parts = parsed.data.result.status.message.parts;
        for (const part of parts) {
          if (part.data && (part.data.surfaceUpdate || part.data.dataModelUpdate || part.data.beginRendering)) {
            a2uiMessages.push(part.data);
          }
        }
      }
      
      if (a2uiMessages.length === 0) {
        this.testError.set('No A2UI data found. Expected surfaceUpdate, dataModelUpdate, or beginRendering in JSON');
        return;
      }
      
      // Validate and clean up A2UI messages before rendering
      for (const msg of a2uiMessages) {
        // Validate surfaceUpdate components
        if (msg.surfaceUpdate?.components) {
          const originalCount = msg.surfaceUpdate.components.length;
          console.log(`Validating ${originalCount} components...`);
          
          // Filter out null/undefined components and validate structure
          msg.surfaceUpdate.components = msg.surfaceUpdate.components.filter((c: any, idx: number) => {
            try {
              if (!c) {
                console.warn(`[Index ${idx}] Null or undefined component`);
                return false;
              }
              
              if (!c.id) {
                console.warn(`[Index ${idx}] Missing id:`, JSON.stringify(c).substring(0, 200));
                return false;
              }
              
              if (!c.component) {
                console.warn(`[Index ${idx}] Component "${c.id}" missing component property`);
                return false;
              }
              
              // Check if component object has at least one component type
              const componentKeys = Object.keys(c.component);
              if (componentKeys.length === 0) {
                console.warn(`[Index ${idx}] Component "${c.id}" has empty component object`);
                return false;
              }
              
              // Validate the component type object is not null
              const componentTypeName = componentKeys[0];
              const componentType = c.component[componentTypeName];
              if (componentType === null || componentType === undefined) {
                console.warn(`[Index ${idx}] Component "${c.id}" has null ${componentTypeName} type`);
                return false;
              }
              
              return true;
            } catch (validateErr: any) {
              console.error(`[Index ${idx}] Validation error:`, validateErr);
              return false;
            }
          });
          
          const removedCount = originalCount - msg.surfaceUpdate.components.length;
          if (removedCount > 0) {
            console.warn(`⚠️ Removed ${removedCount} invalid component(s)`);
          }
          
          if (msg.surfaceUpdate.components.length === 0) {
            this.testError.set('All components were invalid. Check console for validation warnings.');
            return;
          }
          
          console.log(`✓ ${msg.surfaceUpdate.components.length} valid components ready to render`);
        }
        
        try {
          console.log('Rendering A2UI message...');
          this.processor.processMessages([msg]);
          console.log('✓ Render successful');
          
          // Track active surface IDs from test renders
          if (msg.surfaceUpdate?.surfaceId) {
            const currentIds = new Set(this.activeSurfaceIds());
            currentIds.add(msg.surfaceUpdate.surfaceId);
            this.activeSurfaceIds.set(currentIds);
          }
        } catch (renderErr: any) {
          console.error('❌ Rendering failed:', renderErr);
          console.error('Failed message:', JSON.stringify(msg, null, 2).substring(0, 1000));
          this.testError.set(`Rendering Error: ${renderErr.message || 'Failed to render A2UI JSON'}. Check console for full error.`);
          return;
        }
      }
      console.log(`Test A2UI JSON rendered successfully (${a2uiMessages.length} message(s)):`, a2uiMessages);
    } catch (err: any) {
      this.testError.set(`JSON Parse Error: ${err.message}`);
      console.error('Failed to parse test JSON:', err);
    }
  }
  
  clearTest() {
    // Get all active surface IDs
    const surfaceIds = Array.from(this.activeSurfaceIds());
    
    // Delete each surface using the proper A2UI protocol message
    for (const surfaceId of surfaceIds) {
      this.processor.processMessages([{
        deleteSurface: {
          surfaceId: surfaceId
        }
      }]);
    }
    
    // Clear active surface IDs
    this.activeSurfaceIds.set(new Set());
    
    // Clear the textarea and error
    this.testJson.set('');
    this.testError.set(null);
  }
  
  toggleDebug() {
    this.showDebug.set(!this.showDebug());
  }
  
  setMode(isUiMode: boolean) {
    this.serverConfig.uiMode.set(isUiMode);
    this.textResponse.set(null); // Clear text response when switching modes
    console.log(`Mode switched to: ${isUiMode ? 'UI' : 'Text'}`);
  }
  
  clearChat() {
    // Get all active surface IDs
    const surfaceIds = Array.from(this.activeSurfaceIds());
    
    // Delete each surface using the proper A2UI protocol message
    for (const surfaceId of surfaceIds) {
      this.processor.processMessages([{
        deleteSurface: {
          surfaceId: surfaceId
        }
      }]);
    }
    
    // Clear the list of active surface IDs
    this.activeSurfaceIds.set(new Set());
    
    // Clear text response
    this.textResponse.set(null);
    
    // Clear error
    this.error.set(null);
    
    // Clear debug data
    this.lastRequest.set(null);
    this.lastResponse.set(null);
    
    console.log(`Chat cleared - ${surfaceIds.length} surface(s) deleted`);
  }
  
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
  
  formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }
  
  toggleConnectForm() {
    this.showConnectForm.set(!this.showConnectForm());
    if (!this.showConnectForm()) {
      this.tempUrl.set(this.serverUrl());
    }
  }
  
  async connectToServer() {
    const url = this.tempUrl().trim();
    if (!url) return;
    
    this.serverUrl.set(url);
    this.showConnectForm.set(false);
    
    // Clear debug data when switching servers
    this.lastRequest.set(null);
    this.lastResponse.set(null);
    
    // Reload agent card from new server
    try {
      this.agentCard.set(null);
      const card = await this.a2aService.getAgentCard();
      this.agentCard.set(card);
      console.log('Connected to new server, agent card loaded:', card);
    } catch (err) {
      console.warn('Failed to load agent card from new server:', err);
      this.error.set('Failed to connect to server');
    }
  }
  
  private processResponse(response: any): any[] {
    console.log('Processing response:', response);
    
    const serverMessages: any[] = [];
    
    if (response.result?.status?.message?.parts) {  
      const responseParts = response.result.status.message.parts;  
        
      // Check mode to decide how to process response
      if (this.serverConfig.uiMode()) {
        // UI Mode: Process A2UI data parts
        responseParts.forEach((part: any) => {  
          if (part.data && part.metadata?.mimeType === 'application/json+a2ui') {  
            console.log('A2UI Data:', part.data);
            serverMessages.push(part.data);
            this.processor.processMessages([part.data]);
            
            // Track active surface IDs
            if (part.data.surfaceUpdate?.surfaceId) {
              const currentIds = new Set(this.activeSurfaceIds());
              currentIds.add(part.data.surfaceUpdate.surfaceId);
              this.activeSurfaceIds.set(currentIds);
            }
          }  
        });
      } else {
        // Text Mode: Extract and display text parts
        responseParts.forEach((part: any) => {  
          if (part.text) {  
            console.log('Text part:', part.text);
            
            // Try to parse JSON strings - if it's A2UI data, skip it in text mode
            try {
              const parsed = JSON.parse(part.text);
              if (parsed.surfaceUpdate) {
                // Skip A2UI surfaceUpdate data in text mode
                console.log('Skipping A2UI data in text mode');
                return;
              }
              // If it's other JSON, show it formatted
              serverMessages.push(JSON.stringify(parsed, null, 2));
            } catch {
              // Not JSON, just regular text
              serverMessages.push(part.text);
            }
          }  
        });
        
        // Display text parts in a simple format
        if (serverMessages.length > 0) {
          this.textResponse.set(serverMessages.join('\n\n'));
        }
      }
    }
    
    return serverMessages;
  }  
  
  async handleSubmit(event: SubmitEvent) {  
    event.preventDefault();  
      
    if (!(event.target instanceof HTMLFormElement)) return;  
      
    const data = new FormData(event.target);  
    const body = data.get('body') as string;  
      
    if (!body) return;  
      
    this.loading.set(true);  
    this.error.set(null);
    this.textResponse.set(null); // Clear previous text response
      
    try {  
      const parts: Part[] = [{ kind: 'text', text: body }];  
      
      // Capture request for debug
      this.lastRequest.set({
        timestamp: new Date().toISOString(),
        parts: parts
      });
      
      const response: any = await this.a2aService.sendMessage(parts);  
        
      // Capture response for debug
      this.lastResponse.set({
        timestamp: new Date().toISOString(),
        data: response
      });
      
      console.log('Full Response:', response);
      
      // Process JSON-RPC 2.0 response with A2UI data
      this.processResponse(response);
      
      // Clear the form after successful submission
      event.target.reset();
    } catch (err: any) {  
      this.error.set(err.message);  
    } finally {  
      this.loading.set(false);  
    }  
  }  
}

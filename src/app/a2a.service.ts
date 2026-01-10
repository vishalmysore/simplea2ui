import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgentCard, Part, SendMessageSuccessResponse } from '@a2a-js/sdk';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class A2aService {
  private http = inject(HttpClient);

  async sendMessage(parts: Part[]): Promise<any> {
    const body = {
      parts: parts,
      metadata: {
        a2uiClientCapabilities: {
          supportedCatalogIds: [
            "https://github.com/google/A2UI/blob/main/specification/0.8/json/standard_catalog_definition.json"
          ]
        }
      }
    };

    // Use HttpClient so the interceptor can transform the request
    return firstValueFrom(
      this.http.post<any>('/a2a', body)
    );
  }

  async getAgentCard(): Promise<AgentCard> {
    return firstValueFrom(
      this.http.get<AgentCard>('http://localhost:7860/.well-known/agent.json')
    );
  }
}

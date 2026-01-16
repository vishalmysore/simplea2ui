import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ServerConfigService } from './server-config.service';

export const a2aInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests to /a2a endpoint
  if (!req.url.includes('/a2a')) {
    return next(req);
  }

  const serverConfig = inject(ServerConfigService);

  // Generate unique IDs
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get the Angular request body
  const { parts, metadata } = req.body as any;

  // Transform parts to match the format in user's curl example (type instead of kind)
  const transformedParts = parts.map((p: any) => ({
    type: p.kind || p.type || 'text',
    text: p.text,
    metadata: p.metadata || null
  }));

  // Transform to JSON-RPC 2.0 format
  const a2aRequest = {
    jsonrpc: '2.0',
    method: 'tasks/send',
    params: {
      id: messageId, // id inside params (matches CURL)
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: {
        role: 'user',
        parts: transformedParts
      }
    },
    id: requestId // Top-level id (JSON-RPC requirement)
  };

  console.log('A2A Interceptor - Sending to server:', a2aRequest);

  // Clone request with new body, URL, and headers
  const headers: Record<string, string> = {
    'A2A-Version': '1.0'
  };

  // Add Basic Auth header only if sendCredentials flag is enabled and credentials are provided
  if (serverConfig.sendCredentials && serverConfig.sendCredentials() && serverConfig.username() && serverConfig.password()) {
    const credentials = btoa(`${serverConfig.username()}:${serverConfig.password()}`);
    headers['Authorization'] = `Basic ${credentials}`;
    console.log('A2A Interceptor - Adding Basic Auth header for user:', serverConfig.username());
  }

  // Only add A2UI extension header in UI mode
  if (serverConfig.uiMode()) {
    headers['X-A2A-Extensions'] = 'https://a2ui.org/a2a-extension/a2ui/v0.8';
    console.log('A2A Interceptor - UI mode enabled, adding A2UI extension header');
  }

  console.log('A2A Interceptor - Final Headers to be sent:', headers);
  serverConfig.lastHeaders.set(headers);

  const modifiedReq = req.clone({
    url: serverConfig.serverUrl(), // Use dynamic server URL
    body: a2aRequest,
    setHeaders: headers
  });

  return next(modifiedReq);
};

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

  // Transform to JSON-RPC 2.0 format
  const a2aRequest = {
    jsonrpc: '2.0',
    method: 'tasks/send',
    params: {
      id: messageId,
      message: {
        role: 'user',
        parts: parts
      }
    },
    id: requestId
  };

  console.log('A2A Interceptor - Sending to server:', a2aRequest);

  // Clone request with new body, URL, and headers
  const headers: Record<string, string> = {
    'A2A-Version': '1.0'
  };
  
  // Only add A2UI extension header in UI mode
  if (serverConfig.uiMode()) {
    headers['X-A2A-Extensions'] = 'https://a2ui.org/a2a-extension/a2ui/v0.8';
    console.log('A2A Interceptor - UI mode enabled, adding A2UI extension header');
  } else {
    console.log('A2A Interceptor - Text mode enabled, no A2UI extension header');
  }
  
  const modifiedReq = req.clone({
    url: serverConfig.serverUrl(), // Use dynamic server URL
    body: a2aRequest,
    setHeaders: headers
  });

  return next(modifiedReq);
};

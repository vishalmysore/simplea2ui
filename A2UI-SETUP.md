# A2UI Client with JSON-RPC 2.0

This Angular application connects to an A2A server (running on localhost:7860) using JSON-RPC 2.0 protocol and renders responses using A2UI.

## Architecture

```
Angular App (localhost:4200) 
    ↓ HTTP POST to /a2a
Proxy Server (localhost:4201)
    ↓ JSON-RPC 2.0 request
A2A Server (localhost:7860)
    ↓ JSON-RPC 2.0 response with A2UI data
Proxy Server → Angular App
    ↓
A2UI Renderer displays the UI
```

## Setup and Running

### 1. Start the A2A Server
Make sure your A2A server is running on `localhost:7860`

### 2. Start the Proxy Server
In one terminal:
```bash
npm run proxy
```

This starts the proxy server on port 4201 that:
- Receives requests from Angular app
- Translates them to JSON-RPC 2.0 format
- Forwards to the A2A server at localhost:7860
- Returns responses back to Angular

### 3. Start the Angular App
In another terminal:
```bash
npm start
```

This starts the Angular development server on port 4200 with proxy configuration.

### 4. Open the Application
Navigate to `http://localhost:4200/` in your browser.

## How It Works

1. **User Input**: Enter a message in the input field and click Send
2. **Request Processing**: 
   - Angular app sends the message to `/a2a` endpoint
   - Proxy server converts it to JSON-RPC 2.0 format:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tasks/send",
       "params": {
         "id": "msg-xxx",
         "message": {
           "role": "user",
           "parts": [{ "kind": "text", "text": "your message" }]
         }
       },
       "id": "req-xxx"
     }
     ```
   - Forwards to A2A server with proper headers
3. **Response Handling**:
   - Receives JSON-RPC 2.0 response from server
   - Extracts A2UI data from response parts
   - Passes to A2UI MessageProcessor
4. **Rendering**: A2UI Surface components render the UI

## Files

- `proxy-server.js` - Express server that handles JSON-RPC translation
- `proxy.conf.json` - Angular dev server proxy configuration
- `src/app/a2a.service.ts` - Service for sending messages to /a2a endpoint
- `src/app/app.ts` - Main component with form and A2UI rendering
- `src/app/theme.ts` - A2UI theme configuration

## Troubleshooting

- **Connection errors**: Make sure the A2A server is running on localhost:7860
- **Proxy not working**: Ensure both proxy server (port 4201) and Angular dev server are running
- **No UI rendering**: Check browser console for A2UI data and errors

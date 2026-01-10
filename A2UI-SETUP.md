# A2UI Client with JSON-RPC 2.0

This Angular application connects to an A2A server using JSON-RPC 2.0 protocol and renders responses using the official A2UI renderer.

## Architecture

```
Angular App (localhost:4200)
    ↓ User submits message
HTTP Interceptor
    ↓ Transforms to JSON-RPC 2.0
    ↓ Adds A2A headers (UI mode only)
A2A Server (default: localhost:7860)
    ↓ JSON-RPC 2.0 response
HTTP Interceptor
    ↓ Returns response
App Component
    ↓ Processes response
MessageProcessor (official A2UI)
    ↓ Parses A2UI JSON
Surface Component (official A2UI)
    ↓ Renders UI
```

## Setup and Running

### 1. Start the A2A Server
Make sure your A2A server is running on `localhost:7860`

### 2. Start the Angular App
```bash
npm start
```

This starts the Angular development server on port 4200.

### 3. Open the Application
Navigate to `http://localhost:4200/` in your browser.

## How It Works

1. **User Input**: Enter a message in the input field and click Send

2. **Request Processing**: 
   - App component calls A2A service with message parts
   - HTTP interceptor automatically transforms the request to JSON-RPC 2.0:
     ```json
     {
       "jsonrpc": "2.0",
       "method": "tasks/send",
       "params": {
         "message": {
           "parts": [{ "kind": "text", "text": "your message" }]
         }
       },
       "id": "unique-request-id"
     }
     ```
   - Interceptor adds headers:
     - `A2A-Version: 1.0` (always)
     - `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.8` (UI mode only)
     - `X-A2A-MessageId` and `X-A2A-RequestId`
   - Request sent directly to configured A2A server

3. **Response Handling**:
   - Interceptor receives JSON-RPC 2.0 response from server
   - App component extracts A2UI data from response parts (mimeType: `application/json+a2ui`)
   - Calls `MessageProcessor.processMessages()` with A2UI data

4. **Rendering**: 
   - MessageProcessor parses A2UI JSON
   - Surface components render the UI using official A2UI catalog
   - User interactions (button clicks, form submissions) are captured
   - Events sent back to server as A2UI protocol messages

## Key Files

- `src/app/a2a.interceptor.ts` - HTTP interceptor that transforms requests to JSON-RPC 2.0
- `src/app/a2a.service.ts` - Service for sending messages to A2A server
- `src/app/app.ts` - Main component with form, A2UI rendering, and event handling
- `src/app/server-config.service.ts` - Manages server URL and UI mode state
- `src/app/theme.ts` - A2UI theme configuration
- `src/app/app.config.ts` - Configures HTTP interceptor and A2UI providers

## Features

- **UI/Text Mode Toggle**: Switch between A2UI components and plain text responses
- **Dynamic Server Connection**: Change A2A server URL without restarting
- **Debug Panel**: View raw JSON-RPC requests and responses
- **Agent Card**: Display agent capabilities, skills, and examples
- **Official A2UI Renderer**: Uses `@a2ui/angular` library for all rendering

## Troubleshooting

- **Connection errors**: Make sure the A2A server is running on the configured URL (default: localhost:7860)
- **CORS errors**: Ensure your A2A server allows requests from localhost:4200
- **No UI rendering**: Check browser console for A2UI data and errors - verify mimeType is `application/json+a2ui`
- **Text mode shows nothing**: Check debug panel to see if server is returning text parts

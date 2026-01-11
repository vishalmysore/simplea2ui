# SimpleA2UI : A2UI Client

A2UI Client that communicates with A2A (Agent-to-Agent) servers using the A2A protocol with optional A2UI extensions for rich interactive user interfaces.

## Overview

SimpleA2UI is a dual-mode client that can operate in both **UI Mode** (with A2UI extensions for rich interactive components) and **Text Mode** (plain text responses without UI components). It transforms standard Angular HTTP requests into JSON-RPC 2.0 format expected by A2A servers and processes the responses accordingly. 

## Architecture

### Core Components

**App Component** (`src/app/app.ts`)
- Main component with a two-panel layout
- Left panel: Message input form, loading/error states, A2UI surfaces or text responses, debug panel
- Right panel: UI/Text mode toggle, server connection controls, agent card display, about section
- Uses Angular signals for reactive state management (loading, error, textResponse, etc.)
- Subscribes to MessageProcessor events for handling user interactions with A2UI components

**A2A Service** (`src/app/a2a.service.ts`)
- Handles HTTP communication with the A2A server
- Provides `sendMessage()` and `getAgentCard()` methods
- Uses Angular HttpClient which routes through the interceptor pipeline

**A2A Interceptor** (`src/app/a2a.interceptor.ts`)
- HTTP interceptor that transforms requests to JSON-RPC 2.0 format
- Conditionally adds `X-A2A-Extensions` header based on the current mode
- In UI Mode: Includes A2UI extension header for rich UI components
- In Text Mode: Excludes A2UI extension header for plain text responses
- Generates unique `messageId` and `requestId` for each request

**Server Config Service** (`src/app/server-config.service.ts`)
- Shared injectable service managing application-wide state
- Provides `serverUrl` signal for dynamic server endpoint configuration
- Provides `uiMode` signal to control UI vs Text mode (true = UI, false = Text)

### Data Flow

1. **User Input → Request**
   - User enters message in form and submits
   - App creates Part array with text content
   - Service sends to `/a2a` endpoint via HttpClient
   - Interceptor transforms to JSON-RPC 2.0 format with method `tasks/send`
   - Interceptor conditionally adds A2UI extension header based on mode

2. **Response Processing**
   - Server returns JSON-RPC 2.0 response with result containing message parts
   - **UI Mode**: Processes parts with `data` property and `application/json+a2ui` MIME type
     - Extracts A2UI data and calls `MessageProcessor.processMessages()`
     - A2UI components rendered in surfaces
   - **Text Mode**: Processes parts with `text` property
     - Filters out A2UI surfaceUpdate JSON data
     - Displays plain text content in text-response section

3. **Interactive Components (UI Mode only)**
   - MessageProcessor subscribes to user interactions (button clicks, form submissions)
   - Events are captured and sent back to server as A2UI protocol messages
   - Server processes actions and returns updated UI state

### Mode Switching

**UI Mode** (default)
- Adds `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.8` header
- Server responds with A2UI data parts containing component definitions
- Client renders interactive UI components using @a2ui/angular library
- Supports rich components: buttons, text fields, cards, lists, etc.

**Text Mode**
- No A2UI extension header sent
- Server responds with plain text parts
- Client displays text content in a formatted pre element
- Filters out any A2UI metadata from display

### Protocol Details

**JSON-RPC 2.0 Request Format**
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "message": {
      "parts": [
        { "kind": "text", "text": "user message" }
      ]
    }
  },
  "id": "unique-request-id"
}
```

**Headers**
- `A2A-Version: 1.0` (always included)
- `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.8` (UI mode only)
- `X-A2A-MessageId: unique-message-id`
- `X-A2A-RequestId: unique-request-id`

**Response Structure**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": {
      "message": {
        "parts": [
          {
            "data": { /* A2UI component definitions */ },
            "metadata": { "mimeType": "application/json+a2ui" }
          }
        ]
      }
    }
  },
  "id": "request-id"
}
```

### Key Features

**Dynamic Server Configuration**
- Connect to any A2A-compatible server
- Default: `http://localhost:7860`
- Change server URL on-the-fly without restarting

**Agent Card Display**
- Fetches and displays agent metadata on initialization
- Shows agent name, description, capabilities
- Displays skills in animated gradient cards
- Shows example queries and tags

**Debug Panel**
- Expandable view of raw requests and responses
- Shows timestamps for each operation
- Displays full JSON-RPC 2.0 payloads
- Helpful for troubleshooting and understanding protocol flow

**Dual Mode Operation**
- Toggle between UI and Text modes instantly
- UI mode for rich interactive experiences
- Text mode for simple text-based responses
- Mode affects both request headers and response processing

## Getting Started

Start the development server:
```bash
npm start
```

Navigate to `http://localhost:4200` in your browser.

The client will attempt to connect to an A2A server at `http://localhost:7860` by default. Use the "Change Server" button to configure a different endpoint.

** I have copied the responses from my local server in the examples diectory for you to quickly render and see how the a2ui displays , you are free to build your own server as demonstrated here  https://github.com/vishalmysore/springa2ui

# SwissArmyPM Architecture

## 🏗️ High-Level Architecture

Main Process (Electron) 
  ↓ IPC
Renderer Process (React)

## 🔑 Core Components

### Main Process
- **Database**: SQLite for persistent data storage
- **File System**: Workspace and inbox management
- **AI Service**: OpenAI integration for AI features
- **IPC Handlers**: Communication with renderer

### Renderer Process
- **UI Layer**: Figma-generated components (read-only)
- **Features Layer**: Business logic and integration
- **State Management**: Zustand stores for global state

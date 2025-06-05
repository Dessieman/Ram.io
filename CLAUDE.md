# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ram.io is a real-time multiplayer browser game inspired by Agar.io and Slither.io. Players control ram characters in a 10,000x10,000 game world, eating grass to grow and competing with other players.

## Tech Stack

- **Backend**: Node.js + Express.js + Socket.io (v4.8.1)
- **Frontend**: HTML5 Canvas + jQuery + Vanilla JavaScript
- **Database**: PostgreSQL schema exists but not integrated
- **Deployment**: Configured for Heroku

## Common Commands

```bash
# Install dependencies
npm install

# Run the server
node app.js

# Server runs on PORT env variable or 3001 by default
```

## Architecture

### Server (`app.js`)
- Manages global game state (entities, grass positions)
- Handles Socket.io connections and player lifecycle
- Runs game loop at 30 FPS
- Validates player actions (eating grass, movement)
- Broadcasts state updates to all clients

### Client (`public/`)
- `game.js`: Main game loop (45 FPS), canvas rendering
- `player.js`: Player entity class and management
- `clientCSinteractions.js`: Socket.io client-server communication
- `setup.js`: Initial game setup and configuration
- Two canvases: main game view and minimap

### Key Game Mechanics
- 500 grass entities randomly distributed
- Players spawn at random positions with unique colors
- Growth system based on grass consumption
- Real-time position synchronization via WebSockets

## Future Features (from schema.sql)
The database schema suggests planned features for:
- User authentication and accounts
- Game history tracking
- Player statistics persistence
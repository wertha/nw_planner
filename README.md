# New World Planner

A lightweight, portable calendar and task management application specifically designed for New World MMO players to track dailies, weeklies, and scheduled events across multiple characters on multiple servers and time zones.

## Features

- **Character Management**: Manage multiple characters across different servers and factions
- **Task Tracking**: Track daily and weekly tasks with completion status and streaks; per-character assignment; batch-assign is additive (won't remove existing assignees)
- **Event Scheduling**: Schedule and manage wars, invasions, company events and custom items; Past vs Upcoming auto-classification; hardened modal UX
- **Server Time Support**: Timezone-first implementation with robust UTC conversions; per-server and per-character time zone handling
- **Reset Timers**: Visual countdown timers for daily (5 AM) and weekly (Tuesday 5 AM) resets; timers power dashboard and auto-refresh weekly tasks on reset
- **Offline Operation**: Fully offline with local SQLite database storage
- **Portable**: No installation required, runs as a standalone executable

## Technology Stack

- **Frontend**: Svelte with Tailwind CSS
- **Backend**: Electron with Node.js
- **Database**: SQLite for local storage
- **Build System**: Vite for development and building
- **Time Management**: date-fns + Intl for formatting and timezone-safe arithmetic

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

- `npm run dev` - Start Vite development server
- `npm run electron-dev` - Start Electron with development server
- `npm run build` - Build the application for production
- `npm run dist` - Build and package the application

### Project Structure

```
nw_planner/
├── electron/                 # Electron main process
│   ├── main.js              # Main application entry point
│   └── utils.js             # Utility functions
├── src/
│   ├── components/          # Reusable Svelte components
│   │   ├── Header.svelte
│   │   └── Sidebar.svelte
│   ├── views/               # Main application views
│   │   ├── Dashboard.svelte
│   │   ├── Calendar.svelte
│   │   ├── Characters.svelte
│   │   ├── Tasks.svelte
│   │   ├── Events.svelte
│   │   └── Settings.svelte
│   ├── services/            # Backend services
│   │   ├── database.js      # SQLite database service
│   │   ├── timezone.js      # Time zone management
│   │   └── characterService.js # Character CRUD operations
│   ├── stores/              # Svelte stores for state management
│   │   └── ui.js           # UI state management
│   ├── App.svelte          # Main application component
│   ├── main.js             # Frontend entry point
│   └── app.css             # Global styles
├── design_doc.md           # Detailed design documentation
└── package.json           # Project dependencies and scripts
```

## Usage

### Adding Characters

1. Navigate to the Characters section
2. Click "Add New Character"
3. Fill in character details including:
   - Character name
   - Server name
   - Faction (Marauders, Covenant, Syndicate)
   - Company (optional)

### Managing Tasks

The application ships with a sensible starter set (e.g., Faction Bonus Missions, Gypsum from Faction Vendor, Mutated Dungeons, Sandworm, etc.). You can create, edit, and batch-assign tasks to characters. Batch “Assign to Characters” is additive and will not remove characters that are already assigned.

### Event Scheduling

Create events with server-time support and per-character selection. The Events page separates **Upcoming** and **Past**. Past events are dimmed and listed below. The modal has been stabilized so repeated open/close/edit works reliably.

### Server Time & Resets

All time math is timezone-first. Daily and weekly resets are computed in server-local time and converted to UTC instants. The Dashboard shows **Reset Timers** per server and automatically refreshes weekly tasks when the weekly reset occurs.

### Dashboard

- Left column stacks **Upcoming Events** above **Tasks** (with a character selector to view a specific character’s entire task list).
- Right column shows **Reset Timers** for the unique servers of active characters.

## Build & Release

Local run/build:

```bash
npm ci
npm run build
npm run electron
```

Package locally:

```bash
npx electron-builder --win
```

### CI Releases (GitHub Actions)
- Tag a commit with `vX.Y.Z` to trigger the Release workflow.
- The workflow builds Windows portable `.exe`, plus macOS/Linux artifacts, and attaches them to the GitHub Release.

### App Icon
Place logo files at:
- `assets/icon.png`
- `assets/icon.ico`
- `assets/icon.icns`

## Future Enhancements

- Calendar filtering at scale (search + chip UI implemented)
- Additional bulk ops for tasks/events
- Export/import functionality
- Enhanced notification system
- Company management features

## Contributing

This is a personal project designed for individual use. If you'd like to contribute or suggest improvements, please feel free to open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details. 
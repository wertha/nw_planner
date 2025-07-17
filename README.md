# New World Planner

A lightweight, portable calendar and task management application specifically designed for New World MMO players to track dailies, weeklies, and scheduled events across multiple characters on multiple servers and time zones.

## Features

- **Character Management**: Manage multiple characters across different servers and factions
- **Task Tracking**: Track daily and weekly tasks with completion status and streaks
- **Event Scheduling**: Schedule and manage guild events, wars, and other activities
- **Server Time Support**: Automatic time zone conversion for different New World servers
- **Reset Timers**: Visual countdown timers for daily (5 AM) and weekly (Tuesday 5 AM) resets
- **Offline Operation**: Fully offline with local SQLite database storage
- **Portable**: No installation required, runs as a standalone executable

## Technology Stack

- **Frontend**: Svelte with Tailwind CSS
- **Backend**: Electron with Node.js
- **Database**: SQLite for local storage
- **Build System**: Vite for development and building
- **Time Management**: date-fns for date manipulation

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

The application comes with predefined daily and weekly tasks common to New World:

**Daily Tasks:**
- Daily Faction Missions
- Territory Standing
- Gypsum Orb Crafting
- Daily Gathering
- Expedition Run
- OPR/Arena
- Elite Chest Run

**Weekly Tasks:**
- Weekly Faction Missions
- Weekly Expedition
- Territory War
- Company Activities
- Weekly Gathering Goals
- Weekly Crafting

### Event Scheduling

Schedule events with server time support:
- Territory Wars
- Company meetings
- Guild activities
- Custom events

### Server Time Zones

The application supports multiple New World servers with automatic time zone conversion:
- Camelot (US West)
- Valhalla (US East)
- Hellheim (EU Central)
- And more...

## Building for Production

To create a portable executable:

```bash
npm run dist
```

This will create a portable executable in the `dist` folder that can be run without installation.

## Future Enhancements

- Full calendar integration with FullCalendar
- Advanced task assignment and tracking
- Export/import functionality
- Enhanced notification system
- Dark mode support
- Company management features

## Contributing

This is a personal project designed for individual use. If you'd like to contribute or suggest improvements, please feel free to open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details. 
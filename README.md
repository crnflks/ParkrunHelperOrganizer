# Parkrun Helper Organizer - Separated Database Files

## Overview

This project has been restructured to separate the data storage from the main HTML file. This ensures that your volunteer data and helper database won't be lost when updating the HTML interface. The system now includes automated backup capabilities.

## File Structure

```
parkrun-organizer/
├── index.html           # Main application interface (updated)
├── parkrun-data.js      # Data storage and management module
├── parkrun-config.js    # Configuration, roles, and translations
├── backup-utility.html  # Manual backup and restore tool
├── backup-manager.js    # Browser-based backup manager (NEW)
├── auto-backup.js       # Node.js automated backup script (NEW)
├── setup-backup.sh      # Automated backup setup script (NEW)
└── README.md           # This file
```

## Files Description

### Core Files

1. **`index.html`** - The main application interface that now references external JavaScript files
2. **`parkrun-data.js`** - Handles all data storage and retrieval operations
3. **`parkrun-config.js`** - Contains volunteer roles and translations
4. **`backup-utility.html`** - Standalone tool for manual backups

### Automated Backup Files (NEW)

5. **`backup-manager.js`** - Browser-based backup reminder system
   - Tracks backup history
   - Shows reminders when backups are needed
   - Displays backup status badge
   - Enables quick backups from within the app

6. **`auto-backup.js`** - Node.js script for scheduled backups
   - Runs automatically at specified times
   - Saves backups to a designated folder
   - Automatically deletes backups older than 7 days
   - Can be scheduled with cron or Task Scheduler

7. **`setup-backup.sh`** - Setup script for Linux/Mac users
   - Configures the automated backup system
   - Sets up cron jobs for daily backups
   - Tests the backup system

## Automated Backup System

### Browser-Based Backup Manager

The browser-based backup manager provides:
- **Automatic reminders** when 24 hours have passed since last backup
- **Backup status badge** showing when the last backup was made
- **Quick backup** functionality directly from the main app

To enable it, add this line to your `index.html` before the closing `</body>` tag:
```html
<script src="backup-manager.js"></script>
```

### Automated Daily Backups (Node.js)

For fully automated backups that run even when your browser is closed:

#### Prerequisites
1. Install [Node.js](https://nodejs.org/)
2. Install Puppeteer: `npm install puppeteer`

#### Linux/Mac Setup
1. Run the setup script:
   ```bash
   chmod +x setup-backup.sh
   ./setup-backup.sh
   ```
2. Follow the prompts to configure backup location and schedule

#### Windows Setup
1. Update the backup folder path in `auto-backup.js`
2. Install dependencies: `npm install puppeteer`
3. Test the script: `node auto-backup.js`
4. Schedule with Task Scheduler:
   - Open Task Scheduler
   - Create Basic Task
   - Set trigger: Daily at 5:00 AM
   - Set action: Start a program
   - Program: `node.exe`
   - Arguments: `C:\path\to\auto-backup.js`

#### Manual Backup
Run the backup script manually anytime:
```bash
node auto-backup.js
```

### Backup Features

- **Rolling backups**: Keeps last 7 days of backups
- **Automatic cleanup**: Deletes old backups automatically
- **Timestamped files**: Each backup includes date and time
- **Backup history**: Track when backups were made
- **Multiple backup methods**: Browser-based or automated

## Setup Instructions

1. **Save all files in the same directory**
2. **Add backup manager to index.html** (optional but recommended):
   ```html
   <script src="backup-manager.js"></script>
   ```
3. **Set up automated backups** (optional):
   - Linux/Mac: Run `./setup-backup.sh`
   - Windows: Follow Windows setup instructions above

## Backup File Location

- **Browser downloads**: Default downloads folder
- **Automated backups**: Configured during setup (default: `~/parkrun-backups`)
- **File format**: `parkrun-backup-YYYY-MM-DD_HH-MM-SS.json`

## Troubleshooting

### Automated Backup Issues

**Script not running?**
- Check Node.js is installed: `node --version`
- Verify cron job: `crontab -l`
- Check backup logs: `cat ~/parkrun-backups/backup.log`

**Puppeteer errors?**
- Reinstall: `npm install puppeteer`
- Check system requirements for headless Chrome

**Permission denied?**
- Make script executable: `chmod +x auto-backup.js`
- Check folder permissions
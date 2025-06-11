#!/usr/bin/env node

/**
 * Parkrun Data Automated Backup Script
 * 
 * This Node.js script automatically backs up Parkrun data from browser localStorage
 * Run this as a scheduled task (cron on Linux/Mac, Task Scheduler on Windows)
 * 
 * Setup:
 * 1. Install Node.js
 * 2. Install required packages: npm install puppeteer
 * 3. Update the BACKUP_FOLDER path below
 * 4. Schedule this script to run daily at 5am
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const BACKUP_FOLDER = '/path/to/your/backup/folder'; // Update this path!
const HTML_FILE_PATH = 'file://' + path.resolve(__dirname, 'index.html'); // Path to your index.html
const RETENTION_DAYS = 7; // Keep backups for 7 days

// Ensure backup folder exists
function ensureBackupFolder() {
    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
        console.log(`Created backup folder: ${BACKUP_FOLDER}`);
    }
}

// Get backup filename with current date
function getBackupFilename() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    return `parkrun-backup-${dateStr}_${timeStr}.json`;
}

// Delete old backups
function deleteOldBackups() {
    const files = fs.readdirSync(BACKUP_FOLDER);
    const now = new Date();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    files.forEach(file => {
        if (file.startsWith('parkrun-backup-') && file.endsWith('.json')) {
            const filePath = path.join(BACKUP_FOLDER, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtime;
            
            if (age > retentionMs) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
                deletedCount++;
            }
        }
    });
    
    if (deletedCount > 0) {
        console.log(`Deleted ${deletedCount} old backup(s)`);
    }
}

// Extract data from localStorage using Puppeteer
async function extractDataFromBrowser() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to your HTML file
        await page.goto(HTML_FILE_PATH, { waitUntil: 'networkidle0' });
        
        // Wait a bit for JavaScript to initialize
        await page.waitForTimeout(2000);
        
        // Extract data from localStorage
        const data = await page.evaluate(() => {
            const parkrunData = localStorage.getItem('parkrunHelperData');
            const helpersData = localStorage.getItem('parkrunHelpers');
            const language = localStorage.getItem('parkrunLanguage');
            
            return {
                parkrunData: parkrunData ? JSON.parse(parkrunData) : {},
                helpersDatabase: helpersData ? JSON.parse(helpersData) : {},
                language: language || 'en',
                exportDate: new Date().toISOString()
            };
        });
        
        await browser.close();
        return data;
        
    } catch (error) {
        await browser.close();
        throw error;
    }
}

// Save backup to file
function saveBackup(data) {
    const filename = getBackupFilename();
    const filepath = path.join(BACKUP_FOLDER, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Backup saved: ${filename}`);
    
    // Return file stats
    const stats = fs.statSync(filepath);
    return {
        filename,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        path: filepath
    };
}

// Main backup function
async function performBackup() {
    console.log('=== Parkrun Data Automated Backup ===');
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log(`Backup folder: ${BACKUP_FOLDER}`);
    
    try {
        // Ensure backup folder exists
        ensureBackupFolder();
        
        // Delete old backups
        deleteOldBackups();
        
        // Extract data from browser
        console.log('Extracting data from browser...');
        const data = await extractDataFromBrowser();
        
        // Count items
        const helperCount = Object.keys(data.helpersDatabase).length;
        const weekCount = Object.keys(data.parkrunData).length;
        console.log(`Found ${helperCount} helpers and ${weekCount} weeks of data`);
        
        // Save backup
        const backupInfo = saveBackup(data);
        console.log(`Backup complete: ${backupInfo.size}`);
        
        // List current backups
        const files = fs.readdirSync(BACKUP_FOLDER)
            .filter(f => f.startsWith('parkrun-backup-') && f.endsWith('.json'));
        console.log(`\nCurrent backups (${files.length}):`);
        files.sort().forEach(f => console.log(`  - ${f}`));
        
        console.log('\n✓ Backup completed successfully!');
        
    } catch (error) {
        console.error('\n✗ Backup failed:', error.message);
        process.exit(1);
    }
}

// Run backup
performBackup();

/**
 * SCHEDULING INSTRUCTIONS:
 * 
 * Linux/Mac (using cron):
 * 1. Open terminal and type: crontab -e
 * 2. Add this line: 0 5 * * * /usr/bin/node /path/to/auto-backup.js >> /path/to/backup.log 2>&1
 * 3. Save and exit
 * 
 * Windows (using Task Scheduler):
 * 1. Open Task Scheduler
 * 2. Create Basic Task
 * 3. Set trigger: Daily at 5:00 AM
 * 4. Set action: Start a program
 * 5. Program: node.exe
 * 6. Arguments: C:\path\to\auto-backup.js
 * 
 * Alternative: Use npm package 'node-cron' for cross-platform scheduling
 */
// Parkrun Data Storage Module
// This file handles all data storage and retrieval for the Parkrun Helper Organizer

const ParkrunData = {
    // Storage keys
    STORAGE_KEYS: {
        HELPER_DATA: 'parkrunHelperData',
        HELPERS: 'parkrunHelpers',
        LANGUAGE: 'parkrunLanguage'
    },

    // Data stores
    parkrunData: {},
    helpersDatabase: {},

    // Initialize data from localStorage
    init() {
        this.loadFromStorage();
    },

    // Load all data from localStorage
    loadFromStorage() {
        // Load parkrun weekly data
        const storedData = localStorage.getItem(this.STORAGE_KEYS.HELPER_DATA);
        if (storedData) {
            try {
                this.parkrunData = JSON.parse(storedData);
            } catch (e) {
                console.error('Error loading parkrun data:', e);
                this.parkrunData = {};
            }
        }

        // Load helpers database
        const storedHelpers = localStorage.getItem(this.STORAGE_KEYS.HELPERS);
        if (storedHelpers) {
            try {
                this.helpersDatabase = JSON.parse(storedHelpers);
            } catch (e) {
                console.error('Error loading helpers:', e);
                this.helpersDatabase = {};
            }
        }
    },

    // Save parkrun data to localStorage
    saveParkrunData() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.HELPER_DATA, JSON.stringify(this.parkrunData));
        } catch (e) {
            console.error('Error saving parkrun data:', e);
        }
    },

    // Save helpers to localStorage
    saveHelpers() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.HELPERS, JSON.stringify(this.helpersDatabase));
        } catch (e) {
            console.error('Error saving helpers:', e);
        }
    },

    // Get week data
    getWeekData(weekKey) {
        return this.parkrunData[weekKey] || {};
    },

    // Set week data
    setWeekData(weekKey, data) {
        this.parkrunData[weekKey] = data;
        this.saveParkrunData();
    },

    // Update volunteer for a specific role
    updateVolunteer(weekKey, role, volunteerData) {
        if (!this.parkrunData[weekKey]) {
            this.parkrunData[weekKey] = {};
        }
        
        if (volunteerData) {
            this.parkrunData[weekKey][role] = volunteerData;
        } else {
            delete this.parkrunData[weekKey][role];
        }
        
        this.saveParkrunData();
    },

    // Clear volunteer for a role
    clearVolunteer(weekKey, role) {
        if (this.parkrunData[weekKey] && this.parkrunData[weekKey][role]) {
            delete this.parkrunData[weekKey][role];
            this.saveParkrunData();
        }
    },

    // Clear all data for a week
    clearWeek(weekKey) {
        delete this.parkrunData[weekKey];
        this.saveParkrunData();
    },

    // Add a new helper
    addHelper(name, id) {
        const helperId = Date.now().toString();
        this.helpersDatabase[helperId] = { name, id };
        this.saveHelpers();
        return helperId;
    },

    // Delete a helper
    deleteHelper(helperId) {
        delete this.helpersDatabase[helperId];
        
        // Remove from all weeks
        Object.keys(this.parkrunData).forEach(week => {
            Object.keys(this.parkrunData[week]).forEach(role => {
                if (this.parkrunData[week][role]?.helperId === helperId) {
                    delete this.parkrunData[week][role];
                }
            });
        });
        
        this.saveHelpers();
        this.saveParkrunData();
    },

    // Get all helpers
    getHelpers() {
        return this.helpersDatabase;
    },

    // Get a specific helper
    getHelper(helperId) {
        return this.helpersDatabase[helperId];
    },

    // Get language preference
    getLanguage() {
        return localStorage.getItem(this.STORAGE_KEYS.LANGUAGE) || 'en';
    },

    // Set language preference
    setLanguage(lang) {
        localStorage.setItem(this.STORAGE_KEYS.LANGUAGE, lang);
    },

    // Export all data (for backup purposes)
    exportAllData() {
        return {
            parkrunData: this.parkrunData,
            helpersDatabase: this.helpersDatabase,
            exportDate: new Date().toISOString()
        };
    },

    // Import data (for restore purposes)
    importData(data) {
        if (data.parkrunData) {
            this.parkrunData = data.parkrunData;
            this.saveParkrunData();
        }
        
        if (data.helpersDatabase) {
            this.helpersDatabase = data.helpersDatabase;
            this.saveHelpers();
        }
    },

    // Clear all data (use with caution!)
    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            this.parkrunData = {};
            this.helpersDatabase = {};
            this.saveParkrunData();
            this.saveHelpers();
            return true;
        }
        return false;
    }
};

// Initialize when the script loads
ParkrunData.init();
// Parkrun Configuration and Translations
// This file contains all configuration data, roles, and translations

const ParkrunConfig = {
    // Volunteer roles (using English as keys)
    volunteerRoles: [
        'Run Director',
        'Timekeeper',
        'Token Dispenser',
        'Barcode Scanner',
        'Marshal',
        'Parkwalker',
        'Tail Walker',
        'Photographer',
        'New Runner Briefing',
        'Close Down',
        'Course Setup',
        'Catering',
    ],

    // Translation dictionary
    translations: {
        en: {
            title: "Monrepos Parkrun Helper Organizer",
            activity: "Activity",
            name: "Name",
            parkrunId: "Parkrun ID",
            helper: "Helper",
            manageHelpers: "Manage Helpers",
            viewTeam: "View Team",
            back: "Back",
            addHelper: "Add Helper",
            exportEmail: "Export to Email",
            clearWeek: "Clear Week",
            enterName: "Enter name",
            enterId: "Enter ID",
            selectWeek: "Select Week",
            selectHelper: "Select a helper...",
            clearConfirm: "Are you sure you want to clear all volunteer data for this week?",
            weekCleared: "Week data cleared!",
            noVolunteers: "No volunteers to export for this week!",
            openingEmail: "Opening email client...",
            emailSubject: "Parkrun Helper Team",
            helperAdded: "Helper added successfully!",
            helperDeleted: "Helper deleted!",
            fillBothFields: "Please fill in both name and ID fields!",
            noHelpers: "No helpers added yet. Add your first helper above!",
            teamOverview: "Team Overview",
            filled: "Filled",
            missing: "Missing",
            positionMissing: "Helper needed",
            missingPositions: "Missing positions",
            allPositionsFilled: "All positions filled!",
            roles: {
                'Run Director': 'Run Director',
                'Timekeeper': 'Timekeeper',
                'Course Setup': 'Course Setup',
                'Token Dispenser': 'Token Dispenser',
                'Barcode Scanner': 'Barcode Scanner',
                'Marshal': 'Marshal',
                'Tail Walker': 'Tail Walker',
                'Parkwalker': 'Parkwalker',
                'Photographer': 'Photographer',
                'New Runner Briefing': 'New Runner Briefing',
                'Close Down': 'Close Down',
                'Catering': 'Catering',
            }
        },
        de: {
            title: "Monrepos Parkrun Helfer Organizer",
            activity: "Aufgabe",
            name: "Name",
            parkrunId: "Parkrun ID",
            helper: "Helfer",
            manageHelpers: "Helfer verwalten",
            viewTeam: "Team anzeigen",
            back: "Zurück",
            addHelper: "Helfer hinzufügen",
            exportEmail: "Per E-Mail senden",
            clearWeek: "Woche löschen",
            enterName: "Name eingeben",
            enterId: "ID eingeben",
            selectWeek: "Woche auswählen",
            selectHelper: "Helfer auswählen...",
            clearConfirm: "Möchten Sie wirklich alle Helferdaten für diese Woche löschen?",
            weekCleared: "Wochendaten gelöscht!",
            noVolunteers: "Keine Helfer zum Exportieren für diese Woche!",
            openingEmail: "E-Mail-Client wird geöffnet...",
            emailSubject: "Parkrun Helfer Team",
            helperAdded: "Helfer erfolgreich hinzugefügt!",
            helperDeleted: "Helfer gelöscht!",
            fillBothFields: "Bitte füllen Sie beide Felder aus!",
            noHelpers: "Noch keine Helfer hinzugefügt. Fügen Sie oben Ihren ersten Helfer hinzu!",
            teamOverview: "Team Übersicht",
            filled: "Besetzt",
            missing: "Fehlt",
            positionMissing: "Helfer benötigt",
            missingPositions: "Fehlende Positionen",
            allPositionsFilled: "Alle Positionen besetzt!",
            roles: {
                'Run Director': 'Laufleiter',
                'Timekeeper': 'Zeitnehmer',
                'Funnel Manager': 'Zieleinlauf-Manager',
                'Token Dispenser': 'Platzierungsmarken-Verteiler',
                'Finish Scanner': 'Ziel-Scanner',
                'Barcode Scanner': 'Barcode-Scanner',
                'Marshal': 'Streckenposten',
                'Tail Walker': 'Schlussläufer',
                'Photographer': 'Fotograf',
                'New Runner Briefing': 'Erstläufer-Einweisung',
                'Close Down': 'Abbau',
                'Parkwalker': 'Parkwalker',
                'Course Setup': 'Aufbau und Streckenprüfung',
                'Catering': 'Kuchen backen',
            }
        }
    },

    // Get translation for current language
    getTranslation(lang, key) {
        return this.translations[lang]?.[key] || this.translations['en'][key] || key;
    },

    // Get translated role name
    getTranslatedRole(lang, role) {
        return this.translations[lang]?.roles[role] || this.translations['en'].roles[role] || role;
    },

    // Get all available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    },

    // Validate language code
    isValidLanguage(lang) {
        return lang in this.translations;
    }
};
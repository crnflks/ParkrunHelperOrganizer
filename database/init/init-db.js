// filename: database/init/init-db.js

// Initialize the Parkrun Helper database
db = db.getSiblingDB('parkrunhelper');

// Create collections with validation
db.createCollection('helpers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'parkrunId', 'createdAt', 'createdBy'],
      properties: {
        id: {
          bsonType: 'string',
          description: 'Unique identifier for the helper'
        },
        name: {
          bsonType: 'string',
          description: 'Helper full name'
        },
        parkrunId: {
          bsonType: 'string',
          description: 'Parkrun ID (e.g., A1234567)'
        },
        email: {
          bsonType: 'string',
          description: 'Helper email address'
        },
        phone: {
          bsonType: 'string',
          description: 'Helper phone number'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        },
        createdBy: {
          bsonType: 'string',
          description: 'User who created the helper'
        }
      }
    }
  }
});

db.createCollection('schedules', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['weekKey', 'eventDate', 'assignments', 'createdAt', 'createdBy'],
      properties: {
        weekKey: {
          bsonType: 'string',
          description: 'Week identifier (e.g., 2024-01-06)'
        },
        eventDate: {
          bsonType: 'string',
          description: 'Event date in ISO format'
        },
        assignments: {
          bsonType: 'object',
          description: 'Volunteer assignments by role'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        },
        createdBy: {
          bsonType: 'string',
          description: 'User who created the schedule'
        },
        lastModifiedBy: {
          bsonType: 'string',
          description: 'User who last modified the schedule'
        }
      }
    }
  }
});

// Create indexes
db.helpers.createIndex({ 'id': 1 }, { unique: true });
db.helpers.createIndex({ 'parkrunId': 1 }, { unique: true });
db.helpers.createIndex({ 'createdBy': 1 });

db.schedules.createIndex({ 'weekKey': 1 }, { unique: true });
db.schedules.createIndex({ 'eventDate': 1 });
db.schedules.createIndex({ 'createdBy': 1 });

print('Database initialized successfully');
print('Collections created: helpers, schedules');
print('Indexes created for optimal performance');
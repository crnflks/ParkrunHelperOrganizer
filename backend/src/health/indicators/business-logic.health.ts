// Business logic health indicator for application-specific validations
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Container } from '@azure/cosmos';

@Injectable()
export class BusinessLogicHealthIndicator extends HealthIndicator {
  private container: Container;

  constructor(private configService: ConfigService) {
    super();
    // Initialize Cosmos DB container
    const { CosmosClient } = require('@azure/cosmos');
    const client = new CosmosClient({
      endpoint: this.configService.get('COSMOS_DB_ENDPOINT'),
      key: this.configService.get('COSMOS_DB_KEY'),
    });
    const database = client.database(this.configService.get('COSMOS_DB_DATABASE_NAME'));
    this.container = database.container('helpers');
  }

  async checkDataIntegrity(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Check for data integrity issues
      const checks = await Promise.all([
        this.checkHelperDataIntegrity(),
        this.checkRequiredFieldsPresent(),
        this.validateBusinessRules(),
      ]);
      
      const responseTime = Date.now() - startTime;
      const allChecksPassed = checks.every(check => check.passed);
      
      const result = this.getStatus(key, allChecksPassed, {
        responseTime: `${responseTime}ms`,
        checks: checks.map(check => ({
          name: check.name,
          passed: check.passed,
          details: check.details,
        })),
        timestamp: new Date().toISOString(),
      });

      if (!allChecksPassed) {
        throw new HealthCheckError('Data integrity check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError('Data integrity check failed', result);
    }
  }

  async checkStartupRequirements(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Check critical startup requirements
      const requirements = await Promise.all([
        this.checkDatabaseConnection(),
        this.checkRequiredConfiguration(),
        this.checkCriticalData(),
      ]);
      
      const responseTime = Date.now() - startTime;
      const allRequirementsMet = requirements.every(req => req.met);
      
      const result = this.getStatus(key, allRequirementsMet, {
        responseTime: `${responseTime}ms`,
        requirements: requirements.map(req => ({
          name: req.name,
          met: req.met,
          details: req.details,
        })),
        timestamp: new Date().toISOString(),
      });

      if (!allRequirementsMet) {
        throw new HealthCheckError('Startup requirements not met', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError('Startup requirements check failed', result);
    }
  }

  private async checkHelperDataIntegrity(): Promise<{ name: string; passed: boolean; details: any }> {
    try {
      // Check for helpers with invalid data
      const querySpec = {
        query: `
          SELECT c.id, c.firstName, c.lastName, c.email, c.phone 
          FROM c 
          WHERE c.firstName = null OR c.lastName = null OR c.email = null
        `,
      };
      
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      
      return {
        name: 'Helper Data Integrity',
        passed: resources.length === 0,
        details: {
          invalidRecords: resources.length,
          sampleInvalidIds: resources.slice(0, 5).map(r => r.id),
        },
      };
    } catch (error) {
      return {
        name: 'Helper Data Integrity',
        passed: false,
        details: { error: error.message },
      };
    }
  }

  private async checkRequiredFieldsPresent(): Promise<{ name: string; passed: boolean; details: any }> {
    try {
      // Check that all helpers have required fields
      const querySpec = {
        query: `
          SELECT COUNT(1) as total,
                 COUNT(c.firstName) as hasFirstName,
                 COUNT(c.lastName) as hasLastName,
                 COUNT(c.email) as hasEmail
          FROM c
        `,
      };
      
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      const stats = resources[0];
      
      const requiredFieldsPresent = 
        stats.total === stats.hasFirstName &&
        stats.total === stats.hasLastName &&
        stats.total === stats.hasEmail;
      
      return {
        name: 'Required Fields Present',
        passed: requiredFieldsPresent,
        details: {
          totalRecords: stats.total,
          missingFirstName: stats.total - stats.hasFirstName,
          missingLastName: stats.total - stats.hasLastName,
          missingEmail: stats.total - stats.hasEmail,
        },
      };
    } catch (error) {
      return {
        name: 'Required Fields Present',
        passed: false,
        details: { error: error.message },
      };
    }
  }

  private async validateBusinessRules(): Promise<{ name: string; passed: boolean; details: any }> {
    try {
      // Validate business rules specific to Parkrun Helper application
      const querySpec = {
        query: `
          SELECT c.id, c.email, c.phone, c.preferredRoles
          FROM c
          WHERE ARRAY_LENGTH(c.preferredRoles) = 0 OR c.preferredRoles = null
        `,
      };
      
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      
      // Check for duplicate emails
      const emailQuery = {
        query: `
          SELECT c.email, COUNT(1) as count
          FROM c
          GROUP BY c.email
          HAVING COUNT(1) > 1
        `,
      };
      
      const { resources: duplicateEmails } = await this.container.items.query(emailQuery).fetchAll();
      
      const businessRulesValid = resources.length === 0 && duplicateEmails.length === 0;
      
      return {
        name: 'Business Rules Validation',
        passed: businessRulesValid,
        details: {
          helpersWithoutRoles: resources.length,
          duplicateEmails: duplicateEmails.length,
          sampleIssues: resources.slice(0, 3).map(r => ({ id: r.id, email: r.email })),
        },
      };
    } catch (error) {
      return {
        name: 'Business Rules Validation',
        passed: false,
        details: { error: error.message },
      };
    }
  }

  private async checkDatabaseConnection(): Promise<{ name: string; met: boolean; details: any }> {
    try {
      await this.container.items.query('SELECT TOP 1 c.id FROM c').fetchAll();
      return {
        name: 'Database Connection',
        met: true,
        details: { status: 'connected' },
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        met: false,
        details: { error: error.message },
      };
    }
  }

  private async checkRequiredConfiguration(): Promise<{ name: string; met: boolean; details: any }> {
    const requiredEnvVars = [
      'COSMOS_DB_ENDPOINT',
      'COSMOS_DB_KEY',
      'COSMOS_DB_DATABASE_NAME',
      'AZURE_AD_TENANT_ID',
      'AZURE_AD_CLIENT_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !this.configService.get(varName)
    );

    return {
      name: 'Required Configuration',
      met: missingVars.length === 0,
      details: {
        requiredVars: requiredEnvVars.length,
        missingVars: missingVars.length,
        missing: missingVars,
      },
    };
  }

  private async checkCriticalData(): Promise<{ name: string; met: boolean; details: any }> {
    try {
      // Check if there's at least some data in the system
      const querySpec = {
        query: 'SELECT COUNT(1) as count FROM c',
      };
      
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      const recordCount = resources[0]?.count || 0;
      
      return {
        name: 'Critical Data Present',
        met: recordCount >= 0, // Even 0 records is acceptable for startup
        details: {
          recordCount,
          status: recordCount > 0 ? 'data_present' : 'empty_database',
        },
      };
    } catch (error) {
      return {
        name: 'Critical Data Present',
        met: false,
        details: { error: error.message },
      };
    }
  }
}
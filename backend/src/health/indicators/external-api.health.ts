// External API health indicator for Azure AD and other external dependencies
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class ExternalApiHealthIndicator extends HealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async checkAzureAD(key: string): Promise<HealthIndicatorResult> {
    try {
      const tenantId = this.configService.get('AZURE_AD_TENANT_ID');
      const azureAdEndpoint = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid_configuration`;
      
      const startTime = Date.now();
      
      // Check Azure AD OpenID configuration endpoint
      const response = await firstValueFrom(
        this.httpService.get(azureAdEndpoint).pipe(
          timeout(5000) // 5 second timeout
        )
      );
      
      const responseTime = Date.now() - startTime;
      
      const isHealthy = response.status === 200 && response.data.issuer;
      
      const result = this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        status: response.status,
        issuer: response.data.issuer,
        endpoint: azureAdEndpoint,
        timestamp: new Date().toISOString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError('Azure AD health check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        endpoint: `https://login.microsoftonline.com/${this.configService.get('AZURE_AD_TENANT_ID')}/v2.0/.well-known/openid_configuration`,
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError('Azure AD health check failed', result);
    }
  }

  async checkExternalService(key: string, url: string, expectedStatus: number = 200): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(10000) // 10 second timeout
        )
      );
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === expectedStatus;
      
      const result = this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        status: response.status,
        expectedStatus,
        url,
        timestamp: new Date().toISOString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError(`External service health check failed for ${url}`, result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        error: error.message,
        url,
        timestamp: new Date().toISOString(),
      });

      throw new HealthCheckError(`External service health check failed for ${url}`, result);
    }
  }

  async checkParkrunApi(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check Parkrun API availability (if used)
      const parkrunApiUrl = 'https://www.parkrun.org.uk/results/athleteresultshistory/?athleteNumber=123456';
      
      const startTime = Date.now();
      
      const response = await firstValueFrom(
        this.httpService.head(parkrunApiUrl).pipe(
          timeout(10000)
        )
      );
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status < 400;
      
      const result = this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        status: response.status,
        service: 'Parkrun API',
        timestamp: new Date().toISOString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError('Parkrun API health check failed', result);
      }

      return result;
    } catch (error) {
      // Parkrun API might be down or block requests, but this shouldn't fail the health check
      // Return a warning status instead
      const result = this.getStatus(key, true, {
        warning: 'Parkrun API not accessible - this is expected',
        error: error.message,
        service: 'Parkrun API',
        timestamp: new Date().toISOString(),
      });

      return result;
    }
  }
}
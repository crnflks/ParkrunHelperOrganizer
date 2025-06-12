// Controller for exposing Prometheus metrics endpoint
import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrometheusService } from './prometheus.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get Prometheus metrics',
    description: 'Returns application metrics in Prometheus format for scraping'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        example: `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/helpers",status_code="200"} 123`
      }
    }
  })
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
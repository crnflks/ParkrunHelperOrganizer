// filename: backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/exceptions';
import { winstonConfig } from './common/logging';
import { globalValidationConfig } from './common/validation';
import { SanitizationPipe } from './common/sanitization';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonConfig.instance,
  });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://frontend:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
  });

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global validation and sanitization pipes
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe(globalValidationConfig)
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Parkrun Helper Organizer API')
    .setDescription('API for managing Parkrun volunteer schedules')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend API running on http://localhost:${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
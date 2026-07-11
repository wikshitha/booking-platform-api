import { ValidationPipe, ValidationError } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationException } from './common/exceptions/validation.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[]) => {
      const errors = validationErrors.flatMap((error) => {
        if (!error.constraints) {
          return [
            {
              field: error.property,
              message: `${error.property} is invalid`,
            },
          ];
        }

        return Object.values(error.constraints).map((message) => ({
          field: error.property,
          message,
        }));
      });

      return new ValidationException(errors);
    },
  }),
);


  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Booking Platform REST API')
    .setDescription(
      'A NestJS REST API for managing services and customer bookings.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  console.log(`API running at http://localhost:${port}/api`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
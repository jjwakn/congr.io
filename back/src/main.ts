import { I18nService } from 'nestjs-i18n';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packageJson from '../package.json';
import { AppModule } from './app.module';
import { PORT } from './utils/constants';

type SwaggerSchema = {
  example?: unknown;
  properties?: Record<string, SwaggerSchema>;
};

const swaggerLanguages = ['en', 'es'];

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('congr.io API')
    .setDescription('API')
    .setVersion(packageJson.version)
    .build();

  const i18n = app.get(I18nService);

  swaggerLanguages.forEach((lang) => {
    const document = SwaggerModule.createDocument(app, config);

    // Iterate over schemas and replace 'example' keys if they match i18n keys
    for (const schemaName in document.components?.schemas) {
      const schema = document.components.schemas[schemaName] as SwaggerSchema;
      if (schema.properties) {
        for (const propName in schema.properties) {
          const prop = schema.properties[propName];
          if (typeof prop.example === 'string') {
            prop.example = i18n.t(prop.example as never, { lang });
          }
        }
      }
    }

    SwaggerModule.setup(`api-${lang}`, app, document);
  });

  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  });

  await app.listen(PORT);
};
void bootstrap();

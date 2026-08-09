import { json, urlencoded } from 'express';
import { I18nService } from 'nestjs-i18n';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packageJson from '../package.json';
import { AppModule } from './app.module';
import type { JsonValue } from './common/common.types';
import { applySecurityHeaders, enforceRequestBoundaries } from './config/http-security';
import { MAX_JSON_BODY_BYTES, validateSecurityEnvironment } from './config/security';
import { PORT } from './utils/constants';

type SwaggerSchema = {
  example?: JsonValue;
  properties?: Record<string, SwaggerSchema>;
};
type TranslateExample = (key: string, options: { lang: string }) => string;

const swaggerLanguages = ['en', 'es'];
const bootstrap = async () => {
  const securityEnvironment = validateSecurityEnvironment(process.env);
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const trustedOrigins = new Set(securityEnvironment.corsOrigins);
  const i18n = app.get(I18nService);

  app.use(applySecurityHeaders(isProduction));
  app.use(enforceRequestBoundaries(trustedOrigins, i18n));
  app.use(json({ limit: MAX_JSON_BODY_BYTES }));
  app.use(urlencoded({ extended: false, limit: MAX_JSON_BODY_BYTES, parameterLimit: 100 }));

  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('congr.io API')
      .setDescription('API')
      .setVersion(packageJson.version)
      .build();
    const translateExample = i18n.t.bind(i18n) as TranslateExample;

    swaggerLanguages.forEach((lang) => {
      const document = SwaggerModule.createDocument(app, config);
      for (const schemaName in document.components?.schemas) {
        const schema = document.components.schemas[schemaName] as SwaggerSchema;
        if (schema.properties) {
          for (const propName in schema.properties) {
            const prop = schema.properties[propName];
            if (typeof prop.example === 'string') {
              prop.example = translateExample(prop.example, { lang });
            }
          }
        }
      }
      SwaggerModule.setup(`api-${lang}`, app, document);
    });
  }

  app.enableCors({
    origin: securityEnvironment.corsOrigins,
    credentials: true,
  });

  await app.listen(PORT);
};
void bootstrap();

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packageJson from '../package.json';
import { AppModule } from './app.module';
import { PORT } from './utils/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('congr.io API')
    .setDescription('API')
    .setVersion(packageJson.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
  });

  await app.listen(PORT);
}
void bootstrap();

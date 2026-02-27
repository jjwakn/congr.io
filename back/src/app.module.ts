import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerMiddleware } from './middleware';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigurationsModule } from './modules/configurations/configurations.module';
import { CongregationModule } from './modules/congregation/congregation.module';
import { FeatureModule } from './modules/feature/feature.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { SetupModule } from './modules/setup/setup.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path:
          process.env.NODE_ENV !== 'production'
            ? join(process.cwd(), 'src', 'locales')
            : join(__dirname, 'locales'),
        includeSubfolders: true,
        watch: true,
      },
      loader: I18nJsonLoader,
      resolvers: [
        { use: QueryResolver, options: ['en', 'locale', 'l'] }, // example: ?lang=es
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    SetupModule,
    PermissionModule,
    FeatureModule,
    ConfigurationsModule,
    AuthModule,
    UserModule,
    RoleModule,
    CongregationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}

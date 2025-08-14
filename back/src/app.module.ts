import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permissions.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes .env vars available everywhere
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
            ? join(process.cwd(), 'src', 'i18n')
            : join(__dirname, 'i18n'),
        watch: true,
      },
      loader: I18nJsonLoader,
      resolvers: [
        { use: QueryResolver, options: ['en', 'locale', 'l'] }, // example: ?lang=es
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    PermissionModule,
    AuthModule,
    UserModule,
    RoleModule,
  ],
})
export class AppModule {}

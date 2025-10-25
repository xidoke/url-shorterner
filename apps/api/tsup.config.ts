import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'es2023',
  platform: 'node',
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: false,
  dts: false,
  noExternal: [
    '@xidoke/api-standards',
    '@xidoke/auth',
    '@xidoke/rate-limit',
    '@xidoke/types',
  ],
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/jwt',
    '@nestjs/passport',
    '@prisma/client',
    'reflect-metadata',
    'rxjs',
    'ioredis',
    'bcrypt',
    'class-validator',
    'class-transformer',
    'passport-jwt',
  ],
});

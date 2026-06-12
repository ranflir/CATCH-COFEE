import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema, relations } from '@catch-coffee/db';

export const DRIZZLE = Symbol('DRIZZLE');

const fullSchema = { ...schema, ...relations };

export type DrizzleDB = ReturnType<typeof drizzle<typeof fullSchema>>;
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        const pool = new Pool({ connectionString: url });
        return drizzle(pool, { schema: fullSchema, casing: 'snake_case' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}

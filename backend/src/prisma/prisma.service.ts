import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL || '';
    let connectionUrl = rawUrl;

    // Tự động giới hạn connection pool tối đa 5 kết nối để tránh lỗi tràn connection slot trên Aiven/Supabase
    if (rawUrl && !rawUrl.includes('connection_limit')) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      connectionUrl = `${rawUrl}${separator}connection_limit=5&pool_timeout=30`;
    }

    super({
      datasources: connectionUrl
        ? {
            db: {
              url: connectionUrl,
            },
          }
        : undefined,
    });
  }

  async onModuleInit() {
    let retries = 3;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully.');
        break;
      } catch (err: any) {
        retries -= 1;
        this.logger.warn(
          `Database connection failed. Retrying in 2s... (${retries} attempts left). Error: ${err.message}`
        );
        if (retries === 0) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

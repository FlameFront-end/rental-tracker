import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getHealth() {
    await this.dataSource.query('SELECT 1');

    return {
      status: 'ok' as const,
      database: 'up' as const,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }
}

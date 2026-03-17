import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Rental Tracker API',
      status: 'ok',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}

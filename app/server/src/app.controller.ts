import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Returns API metadata and links to the main utility endpoints.',
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}

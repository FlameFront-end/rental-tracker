import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export function ApiAccessTokenAuth() {
  return applyDecorators(ApiBearerAuth('access-token'));
}

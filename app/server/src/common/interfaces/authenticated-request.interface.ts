import type { Request } from 'express';

import type { RequestUser } from './request-user.interface';

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

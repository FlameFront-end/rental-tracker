import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthStatusDto } from './dto/auth-status.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Get('status')
	@ApiOkResponse({
		type: AuthStatusDto,
	})
	getStatus() {
		return this.authService.getStatus();
	}
}

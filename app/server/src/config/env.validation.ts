import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
	@IsIn(['development', 'test', 'production'])
	NODE_ENV = 'development';

	@IsInt()
	@Min(1)
	@Max(65535)
	PORT = 3000;

	@IsString()
	APP_ORIGIN = 'http://localhost:5173';

	@IsString()
	DB_HOST = 'localhost';

	@IsInt()
	@Min(1)
	@Max(65535)
	DB_PORT = 5432;

	@IsString()
	DB_USERNAME = 'postgres';

	@IsString()
	DB_PASSWORD = 'postgres';

	@IsString()
	DB_NAME = 'rental_tracker';
}

export function validateEnv(config: Record<string, unknown>) {
	const validatedConfig = plainToInstance(
		EnvironmentVariables,
		{
			NODE_ENV: config.NODE_ENV ?? 'development',
			PORT: Number(config.PORT ?? 3000),
			APP_ORIGIN: config.APP_ORIGIN ?? 'http://localhost:5173',
			DB_HOST: config.DB_HOST ?? 'localhost',
			DB_PORT: Number(config.DB_PORT ?? 5432),
			DB_USERNAME: config.DB_USERNAME ?? 'postgres',
			DB_PASSWORD: config.DB_PASSWORD ?? 'postgres',
			DB_NAME: config.DB_NAME ?? 'rental_tracker',
		},
		{
			enableImplicitConversion: true,
		},
	);

	const errors = validateSync(validatedConfig, {
		skipMissingProperties: false,
	});

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}

	return validatedConfig;
}

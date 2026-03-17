import { QueryFailedError } from 'typeorm';

interface PostgresDriverError {
	code?: string;
	constraint?: string;
}

export function isPostgresError(
	error: unknown,
	code: string,
	constraint?: string,
) {
	if (!(error instanceof QueryFailedError)) {
		return false;
	}

	const driverError = error.driverError as PostgresDriverError;

	if (driverError.code !== code) {
		return false;
	}

	if (constraint && driverError.constraint !== constraint) {
		return false;
	}

	return true;
}

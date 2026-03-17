import 'dotenv/config';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { buildDataSourceOptions } from './database.config';

const appDataSource = new DataSource(buildDataSourceOptions());

export default appDataSource;

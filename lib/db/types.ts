import { getDatabase } from '../database';

export type DB = Awaited<ReturnType<typeof getDatabase>>;

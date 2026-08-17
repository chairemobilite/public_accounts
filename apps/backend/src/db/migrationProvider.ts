import { Migrator, FileMigrationProvider } from 'kysely/migration'
import path from 'path'
import { Kysely } from 'kysely'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url';

const migrationFolder = fileURLToPath(new URL('../migrations', import.meta.url));

export function createMigrator(db: Kysely<any>) {
    return new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: migrationFolder
        }),
    })
}
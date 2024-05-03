/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/map", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, async_1, event_1, map_1, path_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SQLiteStorageDatabase = void 0;
    class SQLiteStorageDatabase {
        static { this.IN_MEMORY_PATH = ':memory:'; }
        get onDidChangeItemsExternal() { return event_1.Event.None; } // since we are the only client, there can be no external changes
        static { this.BUSY_OPEN_TIMEOUT = 2000; } // timeout in ms to retry when opening DB fails with SQLITE_BUSY
        static { this.MAX_HOST_PARAMETERS = 256; } // maximum number of parameters within a statement
        constructor(path, options = Object.create(null)) {
            this.path = path;
            this.options = options;
            this.name = (0, path_1.basename)(this.path);
            this.logger = new SQLiteStorageDatabaseLogger(this.options.logging);
            this.whenConnected = this.connect(this.path);
        }
        async getItems() {
            const connection = await this.whenConnected;
            const items = new Map();
            const rows = await this.all(connection, 'SELECT * FROM ItemTable');
            rows.forEach(row => items.set(row.key, row.value));
            if (this.logger.isTracing) {
                this.logger.trace(`[storage ${this.name}] getItems(): ${items.size} rows`);
            }
            return items;
        }
        async updateItems(request) {
            const connection = await this.whenConnected;
            return this.doUpdateItems(connection, request);
        }
        doUpdateItems(connection, request) {
            if (this.logger.isTracing) {
                this.logger.trace(`[storage ${this.name}] updateItems(): insert(${request.insert ? (0, map_1.mapToString)(request.insert) : '0'}), delete(${request.delete ? (0, map_1.setToString)(request.delete) : '0'})`);
            }
            return this.transaction(connection, () => {
                const toInsert = request.insert;
                const toDelete = request.delete;
                // INSERT
                if (toInsert && toInsert.size > 0) {
                    const keysValuesChunks = [];
                    keysValuesChunks.push([]); // seed with initial empty chunk
                    // Split key/values into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the INSERT with as many HOST parameters as possible
                    let currentChunkIndex = 0;
                    toInsert.forEach((value, key) => {
                        let keyValueChunk = keysValuesChunks[currentChunkIndex];
                        if (keyValueChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyValueChunk = [];
                            keysValuesChunks.push(keyValueChunk);
                        }
                        keyValueChunk.push(key, value);
                    });
                    keysValuesChunks.forEach(keysValuesChunk => {
                        this.prepare(connection, `INSERT INTO ItemTable VALUES ${new Array(keysValuesChunk.length / 2).fill('(?,?)').join(',')}`, stmt => stmt.run(keysValuesChunk), () => {
                            const keys = [];
                            let length = 0;
                            toInsert.forEach((value, key) => {
                                keys.push(key);
                                length += value.length;
                            });
                            return `Keys: ${keys.join(', ')} Length: ${length}`;
                        });
                    });
                }
                // DELETE
                if (toDelete && toDelete.size) {
                    const keysChunks = [];
                    keysChunks.push([]); // seed with initial empty chunk
                    // Split keys into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the DELETE with as many HOST parameters
                    // as possible
                    let currentChunkIndex = 0;
                    toDelete.forEach(key => {
                        let keyChunk = keysChunks[currentChunkIndex];
                        if (keyChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyChunk = [];
                            keysChunks.push(keyChunk);
                        }
                        keyChunk.push(key);
                    });
                    keysChunks.forEach(keysChunk => {
                        this.prepare(connection, `DELETE FROM ItemTable WHERE key IN (${new Array(keysChunk.length).fill('?').join(',')})`, stmt => stmt.run(keysChunk), () => {
                            const keys = [];
                            toDelete.forEach(key => {
                                keys.push(key);
                            });
                            return `Keys: ${keys.join(', ')}`;
                        });
                    });
                }
            });
        }
        async optimize() {
            this.logger.trace(`[storage ${this.name}] vacuum()`);
            const connection = await this.whenConnected;
            return this.exec(connection, 'VACUUM');
        }
        async close(recovery) {
            this.logger.trace(`[storage ${this.name}] close()`);
            const connection = await this.whenConnected;
            return this.doClose(connection, recovery);
        }
        doClose(connection, recovery) {
            return new Promise((resolve, reject) => {
                connection.db.close(closeError => {
                    if (closeError) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] close(): ${closeError}`);
                    }
                    // Return early if this storage was created only in-memory
                    // e.g. when running tests we do not need to backup.
                    if (this.path === SQLiteStorageDatabase.IN_MEMORY_PATH) {
                        return resolve();
                    }
                    // If the DB closed successfully and we are not running in-memory
                    // and the DB did not get errors during runtime, make a backup
                    // of the DB so that we can use it as fallback in case the actual
                    // DB becomes corrupt in the future.
                    if (!connection.isErroneous && !connection.isInMemory) {
                        return this.backup().then(resolve, error => {
                            this.logger.error(`[storage ${this.name}] backup(): ${error}`);
                            return resolve(); // ignore failing backup
                        });
                    }
                    // Recovery: if we detected errors while using the DB or we are using
                    // an inmemory DB (as a fallback to not being able to open the DB initially)
                    // and we have a recovery function provided, we recreate the DB with this
                    // data to recover all known data without loss if possible.
                    if (typeof recovery === 'function') {
                        // Delete the existing DB. If the path does not exist or fails to
                        // be deleted, we do not try to recover anymore because we assume
                        // that the path is no longer writeable for us.
                        return pfs_1.Promises.unlink(this.path).then(() => {
                            // Re-open the DB fresh
                            return this.doConnect(this.path).then(recoveryConnection => {
                                const closeRecoveryConnection = () => {
                                    return this.doClose(recoveryConnection, undefined /* do not attempt to recover again */);
                                };
                                // Store items
                                return this.doUpdateItems(recoveryConnection, { insert: recovery() }).then(() => closeRecoveryConnection(), error => {
                                    // In case of an error updating items, still ensure to close the connection
                                    // to prevent SQLITE_BUSY errors when the connection is reestablished
                                    closeRecoveryConnection();
                                    return Promise.reject(error);
                                });
                            });
                        }).then(resolve, reject);
                    }
                    // Finally without recovery we just reject
                    return reject(closeError || new Error('Database has errors or is in-memory without recovery option'));
                });
            });
        }
        backup() {
            const backupPath = this.toBackupPath(this.path);
            return pfs_1.Promises.copy(this.path, backupPath, { preserveSymlinks: false });
        }
        toBackupPath(path) {
            return `${path}.backup`;
        }
        async checkIntegrity(full) {
            this.logger.trace(`[storage ${this.name}] checkIntegrity(full: ${full})`);
            const connection = await this.whenConnected;
            const row = await this.get(connection, full ? 'PRAGMA integrity_check' : 'PRAGMA quick_check');
            const integrity = full ? row['integrity_check'] : row['quick_check'];
            if (connection.isErroneous) {
                return `${integrity} (last error: ${connection.lastError})`;
            }
            if (connection.isInMemory) {
                return `${integrity} (in-memory!)`;
            }
            return integrity;
        }
        async connect(path, retryOnBusy = true) {
            this.logger.trace(`[storage ${this.name}] open(${path}, retryOnBusy: ${retryOnBusy})`);
            try {
                return await this.doConnect(path);
            }
            catch (error) {
                this.logger.error(`[storage ${this.name}] open(): Unable to open DB due to ${error}`);
                // SQLITE_BUSY should only arise if another process is locking the same DB we want
                // to open at that time. This typically never happens because a DB connection is
                // limited per window. However, in the event of a window reload, it may be possible
                // that the previous connection was not properly closed while the new connection is
                // already established.
                //
                // In this case we simply wait for some time and retry once to establish the connection.
                //
                if (error.code === 'SQLITE_BUSY' && retryOnBusy) {
                    await (0, async_1.timeout)(SQLiteStorageDatabase.BUSY_OPEN_TIMEOUT);
                    return this.connect(path, false /* not another retry */);
                }
                // Otherwise, best we can do is to recover from a backup if that exists, as such we
                // move the DB to a different filename and try to load from backup. If that fails,
                // a new empty DB is being created automatically.
                //
                // The final fallback is to use an in-memory DB which should only happen if the target
                // folder is really not writeable for us.
                //
                try {
                    await pfs_1.Promises.unlink(path);
                    try {
                        await pfs_1.Promises.rename(this.toBackupPath(path), path, false /* no retry */);
                    }
                    catch (error) {
                        // ignore
                    }
                    return await this.doConnect(path);
                }
                catch (error) {
                    this.logger.error(`[storage ${this.name}] open(): Unable to use backup due to ${error}`);
                    // In case of any error to open the DB, use an in-memory
                    // DB so that we always have a valid DB to talk to.
                    return this.doConnect(SQLiteStorageDatabase.IN_MEMORY_PATH);
                }
            }
        }
        handleSQLiteError(connection, msg) {
            connection.isErroneous = true;
            connection.lastError = msg;
            this.logger.error(msg);
        }
        doConnect(path) {
            return new Promise((resolve, reject) => {
                new Promise((resolve_1, reject_1) => { require(['@vscode/sqlite3'], resolve_1, reject_1); }).then(sqlite3 => {
                    const connection = {
                        db: new (this.logger.isTracing ? sqlite3.verbose().Database : sqlite3.Database)(path, (error) => {
                            if (error) {
                                return (connection.db && error.code !== 'SQLITE_CANTOPEN' /* https://github.com/TryGhost/node-sqlite3/issues/1617 */) ? connection.db.close(() => reject(error)) : reject(error);
                            }
                            // The following exec() statement serves two purposes:
                            // - create the DB if it does not exist yet
                            // - validate that the DB is not corrupt (the open() call does not throw otherwise)
                            return this.exec(connection, [
                                'PRAGMA user_version = 1;',
                                'CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)'
                            ].join('')).then(() => {
                                return resolve(connection);
                            }, error => {
                                return connection.db.close(() => reject(error));
                            });
                        }),
                        isInMemory: path === SQLiteStorageDatabase.IN_MEMORY_PATH
                    };
                    // Errors
                    connection.db.on('error', error => this.handleSQLiteError(connection, `[storage ${this.name}] Error (event): ${error}`));
                    // Tracing
                    if (this.logger.isTracing) {
                        connection.db.on('trace', sql => this.logger.trace(`[storage ${this.name}] Trace (event): ${sql}`));
                    }
                }, reject);
            });
        }
        exec(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.exec(sql, error => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] exec(): ${error}`);
                        return reject(error);
                    }
                    return resolve();
                });
            });
        }
        get(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.get(sql, (error, row) => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] get(): ${error}`);
                        return reject(error);
                    }
                    return resolve(row);
                });
            });
        }
        all(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.all(sql, (error, rows) => {
                    if (error) {
                        this.handleSQLiteError(connection, `[storage ${this.name}] all(): ${error}`);
                        return reject(error);
                    }
                    return resolve(rows);
                });
            });
        }
        transaction(connection, transactions) {
            return new Promise((resolve, reject) => {
                connection.db.serialize(() => {
                    connection.db.run('BEGIN TRANSACTION');
                    transactions();
                    connection.db.run('END TRANSACTION', error => {
                        if (error) {
                            this.handleSQLiteError(connection, `[storage ${this.name}] transaction(): ${error}`);
                            return reject(error);
                        }
                        return resolve();
                    });
                });
            });
        }
        prepare(connection, sql, runCallback, errorDetails) {
            const stmt = connection.db.prepare(sql);
            const statementErrorListener = (error) => {
                this.handleSQLiteError(connection, `[storage ${this.name}] prepare(): ${error} (${sql}). Details: ${errorDetails()}`);
            };
            stmt.on('error', statementErrorListener);
            runCallback(stmt);
            stmt.finalize(error => {
                if (error) {
                    statementErrorListener(error);
                }
                stmt.removeListener('error', statementErrorListener);
            });
        }
    }
    exports.SQLiteStorageDatabase = SQLiteStorageDatabase;
    class SQLiteStorageDatabaseLogger {
        // to reduce lots of output, require an environment variable to enable tracing
        // this helps when running with --verbose normally where the storage tracing
        // might hide useful output to look at
        static { this.VSCODE_TRACE_STORAGE = 'VSCODE_TRACE_STORAGE'; }
        constructor(options) {
            if (options && typeof options.logTrace === 'function' && process.env[SQLiteStorageDatabaseLogger.VSCODE_TRACE_STORAGE]) {
                this.logTrace = options.logTrace;
            }
            if (options && typeof options.logError === 'function') {
                this.logError = options.logError;
            }
        }
        get isTracing() {
            return !!this.logTrace;
        }
        trace(msg) {
            this.logTrace?.(msg);
        }
        error(error) {
            this.logError?.(error);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9zdG9yYWdlL25vZGUvc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLE1BQWEscUJBQXFCO2lCQUVqQixtQkFBYyxHQUFHLFVBQVUsQUFBYixDQUFjO1FBRTVDLElBQUksd0JBQXdCLEtBQXNDLE9BQU8sYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxpRUFBaUU7aUJBRWhJLHNCQUFpQixHQUFHLElBQUksQUFBUCxDQUFRLEdBQUMsZ0VBQWdFO2lCQUMxRix3QkFBbUIsR0FBRyxHQUFHLEFBQU4sQ0FBTyxHQUFDLGtEQUFrRDtRQVFyRyxZQUE2QixJQUFZLEVBQW1CLFVBQXlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQTNGLFNBQUksR0FBSixJQUFJLENBQVE7WUFBbUIsWUFBTyxHQUFQLE9BQU8sQ0FBcUQ7WUFOdkcsU0FBSSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQixXQUFNLEdBQUcsSUFBSSwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRS9ELGtCQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbUUsQ0FBQztRQUU3SCxLQUFLLENBQUMsUUFBUTtZQUNiLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUU1QyxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUV4QyxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLHlCQUF5QixDQUFDLENB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
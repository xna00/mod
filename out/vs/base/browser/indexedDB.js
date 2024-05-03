/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/performance"], function (require, exports, errorMessage_1, errors_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDB = exports.DBClosedError = void 0;
    class MissingStoresError extends Error {
        constructor(db) {
            super('Missing stores');
            this.db = db;
        }
    }
    class DBClosedError extends Error {
        constructor(dbName) {
            super(`IndexedDB database '${dbName}' is closed.`);
            this.code = 'DBClosed';
        }
    }
    exports.DBClosedError = DBClosedError;
    class IndexedDB {
        static async create(name, version, stores) {
            const database = await IndexedDB.openDatabase(name, version, stores);
            return new IndexedDB(database, name);
        }
        static async openDatabase(name, version, stores) {
            (0, performance_1.mark)(`code/willOpenDatabase/${name}`);
            try {
                return await IndexedDB.doOpenDatabase(name, version, stores);
            }
            catch (err) {
                if (err instanceof MissingStoresError) {
                    console.info(`Attempting to recreate the IndexedDB once.`, name);
                    try {
                        // Try to delete the db
                        await IndexedDB.deleteDatabase(err.db);
                    }
                    catch (error) {
                        console.error(`Error while deleting the IndexedDB`, (0, errors_1.getErrorMessage)(error));
                        throw error;
                    }
                    return await IndexedDB.doOpenDatabase(name, version, stores);
                }
                throw err;
            }
            finally {
                (0, performance_1.mark)(`code/didOpenDatabase/${name}`);
            }
        }
        static doOpenDatabase(name, version, stores) {
            return new Promise((c, e) => {
                const request = indexedDB.open(name, version);
                request.onerror = () => e(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            console.error(`Error while opening IndexedDB. Could not find '${store}'' object store`);
                            e(new MissingStoresError(db));
                            return;
                        }
                    }
                    c(db);
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    for (const store of stores) {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store);
                        }
                    }
                };
            });
        }
        static deleteDatabase(database) {
            return new Promise((c, e) => {
                // Close any opened connections
                database.close();
                // Delete the db
                const deleteRequest = indexedDB.deleteDatabase(database.name);
                deleteRequest.onerror = (err) => e(deleteRequest.error);
                deleteRequest.onsuccess = () => c();
            });
        }
        constructor(database, name) {
            this.name = name;
            this.database = null;
            this.pendingTransactions = [];
            this.database = database;
        }
        hasPendingTransactions() {
            return this.pendingTransactions.length > 0;
        }
        close() {
            if (this.pendingTransactions.length) {
                this.pendingTransactions.splice(0, this.pendingTransactions.length).forEach(transaction => transaction.abort());
            }
            this.database?.close();
            this.database = null;
        }
        async runInTransaction(store, transactionMode, dbRequestFn) {
            if (!this.database) {
                throw new DBClosedError(this.name);
            }
            const transaction = this.database.transaction(store, transactionMode);
            this.pendingTransactions.push(transaction);
            return new Promise((c, e) => {
                transaction.oncomplete = () => {
                    if (Array.isArray(request)) {
                        c(request.map(r => r.result));
                    }
                    else {
                        c(request.result);
                    }
                };
                transaction.onerror = () => e(transaction.error ? errors_1.ErrorNoTelemetry.fromError(transaction.error) : new errors_1.ErrorNoTelemetry('unknown error'));
                transaction.onabort = () => e(transaction.error ? errors_1.ErrorNoTelemetry.fromError(transaction.error) : new errors_1.ErrorNoTelemetry('unknown error'));
                const request = dbRequestFn(transaction.objectStore(store));
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
        async getKeyValues(store, isValid) {
            if (!this.database) {
                throw new DBClosedError(this.name);
            }
            const transaction = this.database.transaction(store, 'readonly');
            this.pendingTransactions.push(transaction);
            return new Promise(resolve => {
                const items = new Map();
                const objectStore = transaction.objectStore(store);
                // Open a IndexedDB Cursor to iterate over key/values
                const cursor = objectStore.openCursor();
                if (!cursor) {
                    return resolve(items); // this means the `ItemTable` was empty
                }
                // Iterate over rows of `ItemTable` until the end
                cursor.onsuccess = () => {
                    if (cursor.result) {
                        // Keep cursor key/value in our map
                        if (isValid(cursor.result.value)) {
                            items.set(cursor.result.key.toString(), cursor.result.value);
                        }
                        // Advance cursor to next row
                        cursor.result.continue();
                    }
                    else {
                        resolve(items); // reached end of table
                    }
                };
                // Error handlers
                const onError = (error) => {
                    console.error(`IndexedDB getKeyValues(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                    resolve(items);
                };
                cursor.onerror = () => onError(cursor.error);
                transaction.onerror = () => onError(transaction.error);
            }).finally(() => this.pendingTransactions.splice(this.pendingTransactions.indexOf(transaction), 1));
        }
    }
    exports.IndexedDB = IndexedDB;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvaW5kZXhlZERCLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFNLGtCQUFtQixTQUFRLEtBQUs7UUFDckMsWUFBcUIsRUFBZTtZQUNuQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQURKLE9BQUUsR0FBRixFQUFFLENBQWE7UUFFcEMsQ0FBQztLQUNEO0lBRUQsTUFBYSxhQUFjLFNBQVEsS0FBSztRQUV2QyxZQUFZLE1BQWM7WUFDekIsS0FBSyxDQUFDLHVCQUF1QixNQUFNLGNBQWMsQ0FBQyxDQUFDO1lBRjNDLFNBQUksR0FBRyxVQUFVLENBQUM7UUFHM0IsQ0FBQztLQUNEO0lBTEQsc0NBS0M7SUFFRCxNQUFhLFNBQVM7UUFFckIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWSxFQUFFLE9BQTJCLEVBQUUsTUFBZ0I7WUFDOUUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckUsT0FBTyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVPLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQVksRUFBRSxPQUEyQixFQUFFLE1BQWdCO1lBQzVGLElBQUEsa0JBQUksRUFBQyx5QkFBeUIsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUM7Z0JBQ0osT0FBTyxNQUFNLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FB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
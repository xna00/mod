/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/api/common/extHostStoragePaths", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/async", "vs/base/node/pfs"], function (require, exports, fs, path, uri_1, extHostStoragePaths_1, lifecycle_1, network_1, async_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStoragePaths = void 0;
    class ExtensionStoragePaths extends extHostStoragePaths_1.ExtensionStoragePaths {
        constructor() {
            super(...arguments);
            this._workspaceStorageLock = null;
        }
        async _getWorkspaceStorageURI(storageName) {
            const workspaceStorageURI = await super._getWorkspaceStorageURI(storageName);
            if (workspaceStorageURI.scheme !== network_1.Schemas.file) {
                return workspaceStorageURI;
            }
            if (this._environment.skipWorkspaceStorageLock) {
                this._logService.info(`Skipping acquiring lock for ${workspaceStorageURI.fsPath}.`);
                return workspaceStorageURI;
            }
            const workspaceStorageBase = workspaceStorageURI.fsPath;
            let attempt = 0;
            do {
                let workspaceStoragePath;
                if (attempt === 0) {
                    workspaceStoragePath = workspaceStorageBase;
                }
                else {
                    workspaceStoragePath = (/[/\\]$/.test(workspaceStorageBase)
                        ? `${workspaceStorageBase.substr(0, workspaceStorageBase.length - 1)}-${attempt}`
                        : `${workspaceStorageBase}-${attempt}`);
                }
                await mkdir(workspaceStoragePath);
                const lockfile = path.join(workspaceStoragePath, 'vscode.lock');
                const lock = await tryAcquireLock(this._logService, lockfile, false);
                if (lock) {
                    this._workspaceStorageLock = lock;
                    process.on('exit', () => {
                        lock.dispose();
                    });
                    return uri_1.URI.file(workspaceStoragePath);
                }
                attempt++;
            } while (attempt < 10);
            // just give up
            return workspaceStorageURI;
        }
        onWillDeactivateAll() {
            // the lock will be released soon
            this._workspaceStorageLock?.setWillRelease(6000);
        }
    }
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
    async function mkdir(dir) {
        try {
            await pfs_1.Promises.stat(dir);
            return;
        }
        catch {
            // doesn't exist, that's OK
        }
        try {
            await pfs_1.Promises.mkdir(dir, { recursive: true });
        }
        catch {
        }
    }
    const MTIME_UPDATE_TIME = 1000; // 1s
    const STALE_LOCK_TIME = 10 * 60 * 1000; // 10 minutes
    class Lock extends lifecycle_1.Disposable {
        constructor(logService, filename) {
            super();
            this.logService = logService;
            this.filename = filename;
            this._timer = this._register(new async_1.IntervalTimer());
            this._timer.cancelAndSet(async () => {
                const contents = await readLockfileContents(logService, filename);
                if (!contents || contents.pid !== process.pid) {
                    // we don't hold the lock anymore ...
                    logService.info(`Lock '${filename}': The lock was lost unexpectedly.`);
                    this._timer.cancel();
                }
                try {
                    await pfs_1.Promises.utimes(filename, new Date(), new Date());
                }
                catch (err) {
                    logService.error(err);
                    logService.info(`Lock '${filename}': Could not update mtime.`);
                }
            }, MTIME_UPDATE_TIME);
        }
        dispose() {
            super.dispose();
            try {
                fs.unlinkSync(this.filename);
            }
            catch (err) { }
        }
        async setWillRelease(timeUntilReleaseMs) {
            this.logService.info(`Lock '${this.filename}': Marking the lockfile as scheduled to be released in ${timeUntilReleaseMs} ms.`);
            try {
                const contents = {
                    pid: process.pid,
                    willReleaseAt: Date.now() + timeUntilReleaseMs
                };
                await pfs_1.Promises.writeFile(this.filename, JSON.stringify(contents), { flag: 'w' });
            }
            catch (err) {
                this.logService.error(err);
            }
        }
    }
    /**
     * Attempt to acquire a lock on a directory.
     * This does not use the real `flock`, but uses a file.
     * @returns a disposable if the lock could be acquired or null if it could not.
     */
    async function tryAcquireLock(logService, filename, isSecondAttempt) {
        try {
            const contents = {
                pid: process.pid,
                willReleaseAt: 0
            };
            await pfs_1.Promises.writeFile(filename, JSON.stringify(contents), { flag: 'wx' });
        }
        catch (err) {
            logService.error(err);
        }
        // let's see if we got the lock
        const contents = await readLockfileContents(logService, filename);
        if (!contents || contents.pid !== process.pid) {
            // we didn't get the lock
            if (isSecondAttempt) {
                logService.info(`Lock '${filename}': Could not acquire lock, giving up.`);
                return null;
            }
            logService.info(`Lock '${filename}': Could not acquire lock, checking if the file is stale.`);
            return checkStaleAndTryAcquireLock(logService, filename);
        }
        // we got the lock
        logService.info(`Lock '${filename}': Lock acquired.`);
        return new Lock(logService, filename);
    }
    /**
     * @returns 0 if the pid cannot be read
     */
    async function readLockfileContents(logService, filename) {
        let contents;
        try {
            contents = await pfs_1.Promises.readFile(filename);
        }
        catch (err) {
            // cannot read the file
            logService.error(err);
            return null;
        }
        try {
            return JSON.parse(String(contents));
        }
        catch (err) {
            // cannot parse the file
            logService.error(err);
            return null;
        }
    }
    /**
     * @returns 0 if the mtime cannot be read
     */
    async function readmtime(logService, filename) {
        let stats;
        try {
            stats = await pfs_1.Promises.stat(filename);
        }
        catch (err) {
            // cannot read the file stats to check if it is stale or not
            logService.error(err);
            return 0;
        }
        return stats.mtime.getTime();
    }
    function processExists(pid) {
        try {
            process.kill(pid, 0); // throws an exception if the process doesn't exist anymore.
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async function checkStaleAndTryAcquireLock(logService, filename) {
        const contents = await readLockfileContents(logService, filename);
        if (!contents) {
            logService.info(`Lock '${filename}': Could not read pid of lock holder.`);
            return tryDeleteAndAcquireLock(logService, filename);
        }
        if (contents.willReleaseAt) {
            let timeUntilRelease = contents.willReleaseAt - Date.now();
            if (timeUntilRelease < 5000) {
                if (timeUntilRelease > 0) {
                    logService.info(`Lock '${filename}': The lockfile is scheduled to be released in ${timeUntilRelease} ms.`);
                }
                else {
                    logService.info(`Lock '${filename}': The lockfile is scheduled to have been released.`);
                }
                while (timeUntilRelease > 0) {
                    await (0, async_1.timeout)(Math.min(100, timeUntilRelease));
                    const mtime = await readmtime(logService, filename);
                    if (mtime === 0) {
                        // looks like the lock was released
                        return tryDeleteAndAcquireLock(logService, filename);
                    }
                    timeUntilRelease = contents.willReleaseAt - Date.now();
                }
                return tryDeleteAndAcquireLock(logService, filename);
            }
        }
        if (!processExists(contents.pid)) {
            logService.info(`Lock '${filename}': The pid ${contents.pid} appears to be gone.`);
            return tryDeleteAndAcquireLock(logService, filename);
        }
        const mtime1 = await readmtime(logService, filename);
        const elapsed1 = Date.now() - mtime1;
        if (elapsed1 <= STALE_LOCK_TIME) {
            // the lock does not look stale
            logService.info(`Lock '${filename}': The lock does not look stale, elapsed: ${elapsed1} ms, giving up.`);
            return null;
        }
        // the lock holder updates the mtime every 1s.
        // let's give it a chance to update the mtime
        // in case of a wake from sleep or something similar
        logService.info(`Lock '${filename}': The lock looks stale, waiting for 2s.`);
        await (0, async_1.timeout)(2000);
        const mtime2 = await readmtime(logService, filename);
        const elapsed2 = Date.now() - mtime2;
        if (elapsed2 <= STALE_LOCK_TIME) {
            // the lock does not look stale
            logService.info(`Lock '${filename}': The lock does not look stale, elapsed: ${elapsed2} ms, giving up.`);
            return null;
        }
        // the lock looks stale
        logService.info(`Lock '${filename}': The lock looks stale even after waiting for 2s.`);
        return tryDeleteAndAcquireLock(logService, filename);
    }
    async function tryDeleteAndAcquireLock(logService, filename) {
        logService.info(`Lock '${filename}': Deleting a stale lock.`);
        try {
            await pfs_1.Promises.unlink(filename);
        }
        catch (err) {
            // cannot delete the file
            // maybe the file is already deleted
        }
        return tryAcquireLock(logService, filename, true);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0b3JhZ2VQYXRocy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL2V4dEhvc3RTdG9yYWdlUGF0aHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEscUJBQXNCLFNBQVEsMkNBQTJCO1FBQXRFOztZQUVTLDBCQUFxQixHQUFnQixJQUFJLENBQUM7UUFrRG5ELENBQUM7UUFoRG1CLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxXQUFtQjtZQUNuRSxNQUFNLG1CQUFtQixHQUFHLE1BQU0sS0FBSyxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2pELE9BQU8sbUJBQW1CLENBQUM7WUFDNUIsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQywrQkFBK0IsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDcEYsT0FBTyxtQkFBbUIsQ0FBQztZQUM1QixDQUFDO1lBRUQsTUFBTSxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUM7WUFDeEQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLEdBQUcsQ0FBQztnQkFDSCxJQUFJLG9CQUE0QixDQUFDO2dCQUNqQyxJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkIsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxvQkFBb0IsR0FBRyxDQUN0QixRQUFRLENBQUMsSUFBSSxDQUFDLG9CQUFv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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/async", "vs/base/common/path", "vs/base/common/types", "vs/base/node/pfs", "vs/nls"], function (require, exports, fs_1, async_1, path, types_1, pfs_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtractError = exports.CorruptZipMessage = void 0;
    exports.zip = zip;
    exports.extract = extract;
    exports.buffer = buffer;
    exports.CorruptZipMessage = 'end of central directory record signature not found';
    const CORRUPT_ZIP_PATTERN = new RegExp(exports.CorruptZipMessage);
    class ExtractError extends Error {
        constructor(type, cause) {
            let message = cause.message;
            switch (type) {
                case 'CorruptZip':
                    message = `Corrupt ZIP: ${message}`;
                    break;
            }
            super(message);
            this.type = type;
            this.cause = cause;
        }
    }
    exports.ExtractError = ExtractError;
    function modeFromEntry(entry) {
        const attr = entry.externalFileAttributes >> 16 || 33188;
        return [448 /* S_IRWXU */, 56 /* S_IRWXG */, 7 /* S_IRWXO */]
            .map(mask => attr & mask)
            .reduce((a, b) => a + b, attr & 61440 /* S_IFMT */);
    }
    function toExtractError(err) {
        if (err instanceof ExtractError) {
            return err;
        }
        let type = undefined;
        if (CORRUPT_ZIP_PATTERN.test(err.message)) {
            type = 'CorruptZip';
        }
        return new ExtractError(type, err);
    }
    function extractEntry(stream, fileName, mode, targetPath, options, token) {
        const dirName = path.dirname(fileName);
        const targetDirName = path.join(targetPath, dirName);
        if (!targetDirName.startsWith(targetPath)) {
            return Promise.reject(new Error(nls.localize('invalid file', "Error extracting {0}. Invalid file.", fileName)));
        }
        const targetFileName = path.join(targetPath, fileName);
        let istream;
        token.onCancellationRequested(() => {
            istream?.destroy();
        });
        return Promise.resolve(pfs_1.Promises.mkdir(targetDirName, { recursive: true })).then(() => new Promise((c, e) => {
            if (token.isCancellationRequested) {
                return;
            }
            try {
                istream = (0, fs_1.createWriteStream)(targetFileName, { mode });
                istream.once('close', () => c());
                istream.once('error', e);
                stream.once('error', e);
                stream.pipe(istream);
            }
            catch (error) {
                e(error);
            }
        }));
    }
    function extractZip(zipfile, targetPath, options, token) {
        let last = (0, async_1.createCancelablePromise)(() => Promise.resolve());
        let extractedEntriesCount = 0;
        const listener = token.onCancellationRequested(() => {
            last.cancel();
            zipfile.close();
        });
        return new Promise((c, e) => {
            const throttler = new async_1.Sequencer();
            const readNextEntry = (token) => {
                if (token.isCancellationRequested) {
                    return;
                }
                extractedEntriesCount++;
                zipfile.readEntry();
            };
            zipfile.once('error', e);
            zipfile.once('close', () => last.then(() => {
                if (token.isCancellationRequested || zipfile.entryCount === extractedEntriesCount) {
                    c();
                }
                else {
                    e(new ExtractError('Incomplete', new Error(nls.localize('incompleteExtract', "Incomplete. Found {0} of {1} entries", extractedEntriesCount, zipfile.entryCount))));
                }
            }, e));
            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
                if (token.isCancellationRequested) {
                    return;
                }
                if (!options.sourcePathRegex.test(entry.fileName)) {
                    readNextEntry(token);
                    return;
                }
                const fileName = entry.fileName.replace(options.sourcePathRegex, '');
                // directory file names end with '/'
                if (/\/$/.test(fileName)) {
                    const targetFileName = path.join(targetPath, fileName);
                    last = (0, async_1.createCancelablePromise)(token => pfs_1.Promises.mkdir(targetFileName, { recursive: true }).then(() => readNextEntry(token)).then(undefined, e));
                    return;
                }
                const stream = openZipStream(zipfile, entry);
                const mode = modeFromEntry(entry);
                last = (0, async_1.createCancelablePromise)(token => throttler.queue(() => stream.then(stream => extractEntry(stream, fileName, mode, targetPath, options, token).then(() => readNextEntry(token)))).then(null, e));
            });
        }).finally(() => listener.dispose());
    }
    async function openZip(zipFile, lazy = false) {
        const { open } = await new Promise((resolve_1, reject_1) => { require(['yauzl'], resolve_1, reject_1); });
        return new Promise((resolve, reject) => {
            open(zipFile, lazy ? { lazyEntries: true } : undefined, (error, zipfile) => {
                if (error) {
                    reject(toExtractError(error));
                }
                else {
                    resolve((0, types_1.assertIsDefined)(zipfile));
                }
            });
        });
    }
    function openZipStream(zipFile, entry) {
        return new Promise((resolve, reject) => {
            zipFile.openReadStream(entry, (error, stream) => {
                if (error) {
                    reject(toExtractError(error));
                }
                else {
                    resolve((0, types_1.assertIsDefined)(stream));
                }
            });
        });
    }
    async function zip(zipPath, files) {
        const { ZipFile } = await new Promise((resolve_2, reject_2) => { require(['yazl'], resolve_2, reject_2); });
        return new Promise((c, e) => {
            const zip = new ZipFile();
            files.forEach(f => {
                if (f.contents) {
                    zip.addBuffer(typeof f.contents === 'string' ? Buffer.from(f.contents, 'utf8') : f.contents, f.path);
                }
                else if (f.localPath) {
                    zip.addFile(f.localPath, f.path);
                }
            });
            zip.end();
            const zipStream = (0, fs_1.createWriteStream)(zipPath);
            zip.outputStream.pipe(zipStream);
            zip.outputStream.once('error', e);
            zipStream.once('error', e);
            zipStream.once('finish', () => c(zipPath));
        });
    }
    function extract(zipPath, targetPath, options = {}, token) {
        const sourcePathRegex = new RegExp(options.sourcePath ? `^${options.sourcePath}` : '');
        let promise = openZip(zipPath, true);
        if (options.overwrite) {
            promise = promise.then(zipfile => pfs_1.Promises.rm(targetPath).then(() => zipfile));
        }
        return promise.then(zipfile => extractZip(zipfile, targetPath, { sourcePathRegex }, token));
    }
    function read(zipPath, filePath) {
        return openZip(zipPath).then(zipfile => {
            return new Promise((c, e) => {
                zipfile.on('entry', (entry) => {
                    if (entry.fileName === filePath) {
                        openZipStream(zipfile, entry).then(stream => c(stream), err => e(err));
                    }
                });
                zipfile.once('close', () => e(new Error(nls.localize('notFound', "{0} not found inside zip.", filePath))));
            });
        });
    }
    function buffer(zipPath, filePath) {
        return read(zipPath, filePath).then(stream => {
            return new Promise((c, e) => {
                const buffers = [];
                stream.once('error', e);
                stream.on('data', (b) => buffers.push(b));
                stream.on('end', () => c(Buffer.concat(buffers)));
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvemlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStMaEcsa0JBcUJDO0lBRUQsMEJBVUM7SUFnQkQsd0JBU0M7SUE3T1ksUUFBQSxpQkFBaUIsR0FBVyxxREFBcUQsQ0FBQztJQUMvRixNQUFNLG1CQUFtQixHQUFHLElBQUksTUFBTSxDQUFDLHlCQUFpQixDQUFDLENBQUM7SUFrQjFELE1BQWEsWUFBYSxTQUFRLEtBQUs7UUFJdEMsWUFBWSxJQUFrQyxFQUFFLEtBQVk7WUFDM0QsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUU1QixRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssWUFBWTtvQkFBRSxPQUFPLEdBQUcsZ0JBQWdCLE9BQU8sRUFBRSxDQUFDO29CQUFDLE1BQU07WUFDL0QsQ0FBQztZQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLENBQUM7S0FDRDtJQWZELG9DQWVDO0lBRUQsU0FBUyxhQUFhLENBQUMsS0FBWTtRQUNsQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsc0JBQXNCLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQztRQUV6RCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUM7YUFDM0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUN4QixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxD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
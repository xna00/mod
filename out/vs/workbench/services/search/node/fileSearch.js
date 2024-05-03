/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "fs", "vs/base/common/path", "string_decoder", "vs/base/common/arrays", "vs/base/common/errorMessage", "vs/base/common/glob", "vs/base/common/normalization", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/base/common/types", "vs/base/node/pfs", "vs/workbench/services/search/common/search", "./ripgrepFileSearch", "vs/base/common/fuzzyScorer"], function (require, exports, childProcess, fs, path, string_decoder_1, arrays, errorMessage_1, glob, normalization, extpath_1, platform, stopwatch_1, strings, types, pfs_1, search_1, ripgrepFileSearch_1, fuzzyScorer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Engine = exports.FileWalker = void 0;
    const killCmds = new Set();
    process.on('exit', () => {
        killCmds.forEach(cmd => cmd());
    });
    class FileWalker {
        constructor(config) {
            this.normalizedFilePatternLowercase = null;
            this.maxFilesize = null;
            this.isCanceled = false;
            this.fileWalkSW = null;
            this.cmdSW = null;
            this.cmdResultCount = 0;
            this.config = config;
            this.filePattern = config.filePattern || '';
            this.includePattern = config.includePattern && glob.parse(config.includePattern);
            this.maxResults = config.maxResults || null;
            this.exists = !!config.exists;
            this.walkedPaths = Object.create(null);
            this.resultCount = 0;
            this.isLimitHit = false;
            this.directoriesWalked = 0;
            this.filesWalked = 0;
            this.errors = [];
            if (this.filePattern) {
                this.normalizedFilePatternLowercase = config.shouldGlobMatchFilePattern ? null : (0, fuzzyScorer_1.prepareQuery)(this.filePattern).normalizedLowercase;
            }
            this.globalExcludePattern = config.excludePattern && glob.parse(config.excludePattern);
            this.folderExcludePatterns = new Map();
            config.folderQueries.forEach(folderQuery => {
                const folderExcludeExpression = Object.assign({}, folderQuery.excludePattern || {}, this.config.excludePattern || {});
                // Add excludes for other root folders
                const fqPath = folderQuery.folder.fsPath;
                config.folderQueries
                    .map(rootFolderQuery => rootFolderQuery.folder.fsPath)
                    .filter(rootFolder => rootFolder !== fqPath)
                    .forEach(otherRootFolder => {
                    // Exclude nested root folders
                    if ((0, extpath_1.isEqualOrParent)(otherRootFolder, fqPath)) {
                        folderExcludeExpression[path.relative(fqPath, otherRootFolder)] = true;
                    }
                });
                this.folderExcludePatterns.set(fqPath, new AbsoluteAndRelativeParsedExpression(folderExcludeExpression, fqPath));
            });
        }
        cancel() {
            this.isCanceled = true;
            killCmds.forEach(cmd => cmd());
        }
        walk(folderQueries, extraFiles, onResult, onMessage, done) {
            this.fileWalkSW = stopwatch_1.StopWatch.create(false);
            // Support that the file pattern is a full path to a file that exists
            if (this.isCanceled) {
                return done(null, this.isLimitHit);
            }
            // For each extra file
            extraFiles.forEach(extraFilePath => {
                const basename = path.basename(extraFilePath.fsPath);
                if (this.globalExcludePattern && this.globalExcludePattern(extraFilePath.fsPath, basename)) {
                    return; // excluded
                }
                // File: Check for match on file pattern and include pattern
                this.matchFile(onResult, { relativePath: extraFilePath.fsPath /* no workspace relative path */, searchPath: undefined });
            });
            this.cmdSW = stopwatch_1.StopWatch.create(false);
            // For each root folder
            this.parallel(folderQueries, (folderQuery, rootFolderDone) => {
                this.call(this.cmdTraversal, this, folderQuery, onResult, onMessage, (err) => {
                    if (err) {
                        const errorMessage = (0, errorMessage_1.toErrorMessage)(err);
                        console.error(errorMessage);
                        this.errors.push(errorMessage);
                        rootFolderDone(err, undefined);
                    }
                    else {
                        rootFolderDone(null, undefined);
                    }
                });
            }, (errors, _result) => {
                this.fileWalkSW.stop();
                const err = errors ? arrays.coalesce(errors)[0] : null;
                done(err, this.isLimitHit);
            });
        }
        parallel(list, fn, callback) {
            const results = new Array(list.length);
            const errors = new Array(list.length);
            let didErrorOccur = false;
            let doneCount = 0;
            if (list.length === 0) {
                return callback(null, []);
            }
            list.forEach((item, index) => {
                fn(item, (error, result) => {
                    if (error) {
                        didErrorOccur = true;
                        results[index] = null;
                        errors[index] = error;
                    }
                    else {
                        results[index] = result;
                        errors[index] = null;
                    }
                    if (++doneCount === list.length) {
                        return callback(didErrorOccur ? errors : null, results);
                    }
                });
            });
        }
        call(fun, that, ...args) {
            try {
                fun.apply(that, args);
            }
            catch (e) {
                args[args.length - 1](e);
            }
        }
        cmdTraversal(folderQuery, onResult, onMessage, cb) {
            const rootFolder = folderQuery.folder.fsPath;
            const isMac = platform.isMacintosh;
            const killCmd = () => cmd && cmd.kill();
            killCmds.add(killCmd);
            let done = (err) => {
                killCmds.delete(killCmd);
                done = () => { };
                cb(err);
            };
            let leftover = '';
            const tree = this.initDirectoryTree();
            const ripgrep = (0, ripgrepFileSearch_1.spawnRipgrepCmd)(this.config, folderQuery, this.config.includePattern, this.folderExcludePatterns.get(folderQuery.folder.fsPath).expression);
            const cmd = ripgrep.cmd;
            const noSiblingsClauses = !Object.keys(ripgrep.siblingClauses).length;
            const escapedArgs = ripgrep.rgArgs.args
                .map(arg => arg.match(/^-/) ? arg : `'${arg}'`)
                .join(' ');
            let rgCmd = `${ripgrep.rgDiskPath} ${escapedArgs}\n - cwd: ${ripgrep.cwd}`;
            if (ripgrep.rgArgs.siblingClauses) {
                rgCmd += `\n - Sibling clauses: ${JSON.stringify(ripgrep.rgArgs.siblingClauses)}`;
            }
            onMessage({ message: rgCmd });
            this.cmdResultCount = 0;
            this.collectStdout(cmd, 'utf8', onMessage, (err, stdout, last) => {
                if (err) {
                    done(err);
                    return;
                }
                if (this.isLimitHit) {
                    done();
                    return;
                }
                // Mac: uses NFD unicode form on disk, but we want NFC
                const normalized = leftover + (isMac ? normalization.normalizeNFC(stdout || '') : stdout);
                const relativeFiles = normalized.split('\n');
                if (last) {
                    const n = relativeFiles.length;
                    relativeFiles[n - 1] = relativeFiles[n - 1].trim();
                    if (!relativeFiles[n - 1]) {
                        relativeFiles.pop();
                    }
                }
                else {
                    leftover = relativeFiles.pop() || '';
                }
                if (relativeFiles.length && relativeFiles[0].indexOf('\n') !== -1) {
                    done(new Error('Splitting up files failed'));
                    return;
                }
                this.cmdResultCount += relativeFiles.length;
                if (noSiblingsClauses) {
                    for (const relativePath of relativeFiles) {
                        this.matchFile(onResult, { base: rootFolder, relativePath, searchPath: this.getSearchPath(folderQuery, relativePath) });
                        if (this.isLimitHit) {
                            killCmd();
                            break;
                        }
                    }
                    if (last || this.isLimitHit) {
                        done();
                    }
                    return;
                }
                // TODO: Optimize siblings clauses with ripgrep here.
                this.addDirectoryEntries(folderQuery, tree, rootFolder, relativeFiles, onResult);
                if (last) {
                    this.matchDirectoryTree(tree, rootFolder, onResult);
                    done();
                }
            });
        }
        /**
         * Public for testing.
         */
        spawnFindCmd(folderQuery) {
            const excludePattern = this.folderExcludePatterns.get(folderQuery.folder.fsPath);
            const basenames = excludePattern.getBasenameTerms();
            const pathTerms = excludePattern.getPathTerms();
            const args = ['-L', '.'];
            if (basenames.length || pathTerms.length) {
                args.push('-not', '(', '(');
                for (const basename of basenames) {
                    args.push('-name', basename);
                    args.push('-o');
                }
                for (const path of pathTerms) {
                    args.push('-path', path);
                    args.push('-o');
                }
                args.pop();
                args.push(')', '-prune', ')');
            }
            args.push('-type', 'f');
            return childProcess.spawn('find', args, { cwd: folderQuery.folder.fsPath });
        }
        /**
         * Public for testing.
         */
        readStdout(cmd, encoding, cb) {
            let all = '';
            this.collectStdout(cmd, encoding, () => { }, (err, stdout, last) => {
                if (err) {
                    cb(err);
                    return;
                }
                all += stdout;
                if (last) {
                    cb(null, all);
                }
            });
        }
        collectStdout(cmd, encoding, onMessage, cb) {
            let onData = (err, stdout, last) => {
                if (err || last) {
                    onData = () => { };
                    this.cmdSW?.stop();
                }
                cb(err, stdout, last);
            };
            let gotData = false;
            if (cmd.stdout) {
                // Should be non-null, but #38195
                this.forwardData(cmd.stdout, encoding, onData);
                cmd.stdout.once('data', () => gotData = true);
            }
            else {
                onMessage({ message: 'stdout is null' });
            }
            let stderr;
            if (cmd.stderr) {
                // Should be non-null, but #38195
                stderr = this.collectData(cmd.stderr);
            }
            else {
                onMessage({ message: 'stderr is null' });
            }
            cmd.on('error', (err) => {
                onData(err);
            });
            cmd.on('close', (code) => {
                // ripgrep returns code=1 when no results are found
                let stderrText;
                if (!gotData && (stderrText = this.decodeData(stderr, encoding)) && rgErrorMsgForDisplay(stderrText)) {
                    onData(new Error(`command failed with error code ${code}: ${this.decodeData(stderr, encoding)}`));
                }
                else {
                    if (this.exists && code === 0) {
                        this.isLimitHit = true;
                    }
                    onData(null, '', true);
                }
            });
        }
        forwardData(stream, encoding, cb) {
            const decoder = new string_decoder_1.StringDecoder(encoding);
            stream.on('data', (data) => {
                cb(null, decoder.write(data));
            });
            return decoder;
        }
        collectData(stream) {
            const buffers = [];
            stream.on('data', (data) => {
                buffers.push(data);
            });
            return buffers;
        }
        decodeData(buffers, encoding) {
            const decoder = new string_decoder_1.StringDecoder(encoding);
            return buffers.map(buffer => decoder.write(buffer)).join('');
        }
        initDirectoryTree() {
            const tree = {
                rootEntries: [],
                pathToEntries: Object.create(null)
            };
            tree.pathToEntries['.'] = tree.rootEntries;
            return tree;
        }
        addDirectoryEntries(folderQuery, { pathToEntries }, base, relativeFiles, onResult) {
            // Support relative paths to files from a root resource (ignores excludes)
            if (relativeFiles.indexOf(this.filePattern) !== -1) {
                this.matchFile(onResult, {
                    base,
                    relativePath: this.filePattern,
                    searchPath: this.getSearchPath(folderQuery, this.filePattern)
                });
            }
            const add = (relativePath) => {
                const basename = path.basename(relativePath);
                const dirname = path.dirname(relativePath);
                let entries = pathToEntries[dirname];
                if (!entries) {
                    entries = pathToEntries[dirname] = [];
                    add(dirname);
                }
                entries.push({
                    base,
                    relativePath,
                    basename,
                    searchPath: this.getSearchPath(folderQuery, relativePath),
                });
            };
            relativeFiles.forEach(add);
        }
        matchDirectoryTree({ rootEntries, pathToEntries }, rootFolder, onResult) {
            const self = this;
            const excludePattern = this.folderExcludePatterns.get(rootFolder);
            const filePattern = this.filePattern;
            function matchDirectory(entries) {
                self.directoriesWalked++;
                const hasSibling = (0, search_1.hasSiblingFn)(() => entries.map(entry => entry.basename));
                for (let i = 0, n = entries.length; i < n; i++) {
                    const entry = entries[i];
                    const { relativePath, basename } = entry;
                    // Check exclude pattern
                    // If the user searches for the exact file name, we adjust the glob matching
                    // to ignore filtering by siblings because the user seems to know what they
                    // are searching for and we want to include the result in that case anyway
                    if (excludePattern.test(relativePath, basename, filePattern !== basename ? hasSibling : undefined)) {
                        continue;
                    }
                    const sub = pathToEntries[relativePath];
                    if (sub) {
                        matchDirectory(sub);
                    }
                    else {
                        self.filesWalked++;
                        if (relativePath === filePattern) {
                            continue; // ignore file if its path matches with the file pattern because that is already matched above
                        }
                        self.matchFile(onResult, entry);
                    }
                    if (self.isLimitHit) {
                        break;
                    }
                }
            }
            matchDirectory(rootEntries);
        }
        getStats() {
            return {
                cmdTime: this.cmdSW.elapsed(),
                fileWalkTime: this.fileWalkSW.elapsed(),
                directoriesWalked: this.directoriesWalked,
                filesWalked: this.filesWalked,
                cmdResultCount: this.cmdResultCount
            };
        }
        doWalk(folderQuery, relativeParentPath, files, onResult, done) {
            const rootFolder = folderQuery.folder;
            // Execute tasks on each file in parallel to optimize throughput
            const hasSibling = (0, search_1.hasSiblingFn)(() => files);
            this.parallel(files, (file, clb) => {
                // Check canceled
                if (this.isCanceled || this.isLimitHit) {
                    return clb(null);
                }
                // Check exclude pattern
                // If the user searches for the exact file name, we adjust the glob matching
                // to ignore filtering by siblings because the user seems to know what they
                // are searching for and we want to include the result in that case anyway
                const currentRelativePath = relativeParentPath ? [relativeParentPath, file].join(path.sep) : file;
                if (this.folderExcludePatterns.get(folderQuery.folder.fsPath).test(currentRelativePath, file, this.config.filePattern !== file ? hasSibling : undefined)) {
                    return clb(null);
                }
                // Use lstat to detect links
                const currentAbsolutePath = [rootFolder.fsPath, currentRelativePath].join(path.sep);
                fs.lstat(currentAbsolutePath, (error, lstat) => {
                    if (error || this.isCanceled || this.isLimitHit) {
                        return clb(null);
                    }
                    // If the path is a link, we must instead use fs.stat() to find out if the
                    // link is a directory or not because lstat will always return the stat of
                    // the link which is always a file.
                    this.statLinkIfNeeded(currentAbsolutePath, lstat, (error, stat) => {
                        if (error || this.isCanceled || this.isLimitHit) {
                            return clb(null);
                        }
                        // Directory: Follow directories
                        if (stat.isDirectory()) {
                            this.directoriesWalked++;
                            // to really prevent loops with links we need to resolve the real path of them
                            return this.realPathIfNeeded(currentAbsolutePath, lstat, (error, realpath) => {
                                if (error || this.isCanceled || this.isLimitHit) {
                                    return clb(null);
                                }
                                realpath = realpath || '';
                                if (this.walkedPaths[realpath]) {
                                    return clb(null); // escape when there are cycles (can happen with symlinks)
                                }
                                this.walkedPaths[realpath] = true; // remember as walked
                                // Continue walking
                                return pfs_1.Promises.readdir(currentAbsolutePath).then(children => {
                                    if (this.isCanceled || this.isLimitHit) {
                                        return clb(null);
                                    }
                                    this.doWalk(folderQuery, currentRelativePath, children, onResult, err => clb(err || null));
                                }, error => {
                                    clb(null);
                                });
                            });
                        }
                        // File: Check for match on file pattern and include pattern
                        else {
                            this.filesWalked++;
                            if (currentRelativePath === this.filePattern) {
                                return clb(null, undefined); // ignore file if its path matches with the file pattern because checkFilePatternRelativeMatch() takes care of those
                            }
                            if (this.maxFilesize && types.isNumber(stat.size) && stat.size > this.maxFilesize) {
                                return clb(null, undefined); // ignore file if max file size is hit
                            }
                            this.matchFile(onResult, {
                                base: rootFolder.fsPath,
                                relativePath: currentRelativePath,
                                searchPath: this.getSearchPath(folderQuery, currentRelativePath),
                            });
                        }
                        // Unwind
                        return clb(null, undefined);
                    });
                });
            }, (error) => {
                const filteredErrors = error ? arrays.coalesce(error) : error; // find any error by removing null values first
                return done(filteredErrors && filteredErrors.length > 0 ? filteredErrors[0] : undefined);
            });
        }
        matchFile(onResult, candidate) {
            if (this.isFileMatch(candidate) && (!this.includePattern || this.includePattern(candidate.relativePath, path.basename(candidate.relativePath)))) {
                this.resultCount++;
                if (this.exists || (this.maxResults && this.resultCount > this.maxResults)) {
                    this.isLimitHit = true;
                }
                if (!this.isLimitHit) {
                    onResult(candidate);
                }
            }
        }
        isFileMatch(candidate) {
            // Check for search pattern
            if (this.filePattern) {
                if (this.filePattern === '*') {
                    return true; // support the all-matching wildcard
                }
                if (this.normalizedFilePatternLowercase) {
                    return (0, search_1.isFilePatternMatch)(candidate, this.normalizedFilePatternLowercase);
                }
                else if (this.filePattern) {
                    return (0, search_1.isFilePatternMatch)(candidate, this.filePattern, false);
                }
            }
            // No patterns means we match all
            return true;
        }
        statLinkIfNeeded(path, lstat, clb) {
            if (lstat.isSymbolicLink()) {
                return fs.stat(path, clb); // stat the target the link points to
            }
            return clb(null, lstat); // not a link, so the stat is already ok for us
        }
        realPathIfNeeded(path, lstat, clb) {
            if (lstat.isSymbolicLink()) {
                return fs.realpath(path, (error, realpath) => {
                    if (error) {
                        return clb(error);
                    }
                    return clb(null, realpath);
                });
            }
            return clb(null, path);
        }
        /**
         * If we're searching for files in multiple workspace folders, then better prepend the
         * name of the workspace folder to the path of the file. This way we'll be able to
         * better filter files that are all on the top of a workspace folder and have all the
         * same name. A typical example are `package.json` or `README.md` files.
         */
        getSearchPath(folderQuery, relativePath) {
            if (folderQuery.folderName) {
                return path.join(folderQuery.folderName, relativePath);
            }
            return relativePath;
        }
    }
    exports.FileWalker = FileWalker;
    class Engine {
        constructor(config) {
            this.folderQueries = config.folderQueries;
            this.extraFiles = config.extraFileResources || [];
            this.walker = new FileWalker(config);
        }
        search(onResult, onProgress, done) {
            this.walker.walk(this.folderQueries, this.extraFiles, onResult, onProgress, (err, isLimitHit) => {
                done(err, {
                    limitHit: isLimitHit,
                    stats: this.walker.getStats(),
                    messages: [],
                });
            });
        }
        cancel() {
            this.walker.cancel();
        }
    }
    exports.Engine = Engine;
    /**
     * This class exists to provide one interface on top of two ParsedExpressions, one for absolute expressions and one for relative expressions.
     * The absolute and relative expressions don't "have" to be kept separate, but this keeps us from having to path.join every single
     * file searched, it's only used for a text search with a searchPath
     */
    class AbsoluteAndRelativeParsedExpression {
        constructor(expression, root) {
            this.expression = expression;
            this.root = root;
            this.init(expression);
        }
        /**
         * Split the IExpression into its absolute and relative components, and glob.parse them separately.
         */
        init(expr) {
            let absoluteGlobExpr;
            let relativeGlobExpr;
            Object.keys(expr)
                .filter(key => expr[key])
                .forEach(key => {
                if (path.isAbsolute(key)) {
                    absoluteGlobExpr = absoluteGlobExpr || glob.getEmptyExpression();
                    absoluteGlobExpr[key] = expr[key];
                }
                else {
                    relativeGlobExpr = relativeGlobExpr || glob.getEmptyExpression();
                    relativeGlobExpr[key] = expr[key];
                }
            });
            this.absoluteParsedExpr = absoluteGlobExpr && glob.parse(absoluteGlobExpr, { trimForExclusions: true });
            this.relativeParsedExpr = relativeGlobExpr && glob.parse(relativeGlobExpr, { trimForExclusions: true });
        }
        test(_path, basename, hasSibling) {
            return (this.relativeParsedExpr && this.relativeParsedExpr(_path, basename, hasSibling)) ||
                (this.absoluteParsedExpr && this.absoluteParsedExpr(path.join(this.root, _path), basename, hasSibling));
        }
        getBasenameTerms() {
            const basenameTerms = [];
            if (this.absoluteParsedExpr) {
                basenameTerms.push(...glob.getBasenameTerms(this.absoluteParsedExpr));
            }
            if (this.relativeParsedExpr) {
                basenameTerms.push(...glob.getBasenameTerms(this.relativeParsedExpr));
            }
            return basenameTerms;
        }
        getPathTerms() {
            const pathTerms = [];
            if (this.absoluteParsedExpr) {
                pathTerms.push(...glob.getPathTerms(this.absoluteParsedExpr));
            }
            if (this.relativeParsedExpr) {
                pathTerms.push(...glob.getPathTerms(this.relativeParsedExpr));
            }
            return pathTerms;
        }
    }
    function rgErrorMsgForDisplay(msg) {
        const lines = msg.trim().split('\n');
        const firstLine = lines[0].trim();
        if (firstLine.startsWith('Error parsing regex')) {
            return firstLine;
        }
        if (firstLine.startsWith('regex parse error')) {
            return strings.uppercaseFirstLetter(lines[lines.length - 1].trim());
        }
        if (firstLine.startsWith('error parsing glob') ||
            firstLine.startsWith('unsupported encoding')) {
            // Uppercase first letter
            return firstLine.charAt(0).toUpperCase() + firstLine.substr(1);
        }
        if (firstLine === `Literal '\\n' not allowed.`) {
            // I won't localize this because none of the Ripgrep error messages are localized
            return `Literal '\\n' currently not supported`;
        }
        if (firstLine.startsWith('Literal ')) {
            // Other unsupported chars
            return firstLine;
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC9ub2RlL2ZpbGVTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0NoRyxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO0lBQ3ZDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtRQUN2QixRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztJQUVILE1BQWEsVUFBVTtRQXVCdEIsWUFBWSxNQUFrQjtZQXBCdEIsbUNBQThCLEdBQWtCLElBQUksQ0FBQztZQUlyRCxnQkFBVyxHQUFrQixJQUFJLENBQUM7WUFHbEMsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQixlQUFVLEdBQXFCLElBQUksQ0FBQztZQUlwQyxVQUFLLEdBQXFCLElBQUksQ0FBQztZQUMvQixtQkFBYyxHQUFXLENBQUMsQ0FBQztZQVFsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDOUIsSUFBSSxDQUFDLFdBQVcs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
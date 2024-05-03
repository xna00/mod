/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/process", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/path"], function (require, exports, process_1, lifecycle_1, map_1, configuration_1, files_1, instantiation_1, storage_1, uri_1, remoteAgentService_1, network_1, platform_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalPersistedHistory = void 0;
    exports.getCommandHistory = getCommandHistory;
    exports.getDirectoryHistory = getDirectoryHistory;
    exports.getShellFileHistory = getShellFileHistory;
    exports.clearShellFileHistory = clearShellFileHistory;
    exports.fetchBashHistory = fetchBashHistory;
    exports.fetchZshHistory = fetchZshHistory;
    exports.fetchPythonHistory = fetchPythonHistory;
    exports.fetchPwshHistory = fetchPwshHistory;
    exports.fetchFishHistory = fetchFishHistory;
    exports.sanitizeFishHistoryCmd = sanitizeFishHistoryCmd;
    var Constants;
    (function (Constants) {
        Constants[Constants["DefaultHistoryLimit"] = 100] = "DefaultHistoryLimit";
    })(Constants || (Constants = {}));
    var StorageKeys;
    (function (StorageKeys) {
        StorageKeys["Entries"] = "terminal.history.entries";
        StorageKeys["Timestamp"] = "terminal.history.timestamp";
    })(StorageKeys || (StorageKeys = {}));
    let commandHistory = undefined;
    function getCommandHistory(accessor) {
        if (!commandHistory) {
            commandHistory = accessor.get(instantiation_1.IInstantiationService).createInstance(TerminalPersistedHistory, 'commands');
        }
        return commandHistory;
    }
    let directoryHistory = undefined;
    function getDirectoryHistory(accessor) {
        if (!directoryHistory) {
            directoryHistory = accessor.get(instantiation_1.IInstantiationService).createInstance(TerminalPersistedHistory, 'dirs');
        }
        return directoryHistory;
    }
    // Shell file history loads once per shell per window
    const shellFileHistory = new Map();
    async function getShellFileHistory(accessor, shellType) {
        const cached = shellFileHistory.get(shellType);
        if (cached === null) {
            return [];
        }
        if (cached !== undefined) {
            return cached;
        }
        let result;
        switch (shellType) {
            case "bash" /* PosixShellType.Bash */:
                result = await fetchBashHistory(accessor);
                break;
            case "pwsh" /* PosixShellType.PowerShell */: // WindowsShellType.PowerShell has the same value
                result = await fetchPwshHistory(accessor);
                break;
            case "zsh" /* PosixShellType.Zsh */:
                result = await fetchZshHistory(accessor);
                break;
            case "fish" /* PosixShellType.Fish */:
                result = await fetchFishHistory(accessor);
                break;
            case "python" /* PosixShellType.Python */:
                result = await fetchPythonHistory(accessor);
                break;
            default: return [];
        }
        if (result === undefined) {
            shellFileHistory.set(shellType, null);
            return [];
        }
        const array = Array.from(result);
        shellFileHistory.set(shellType, array);
        return array;
    }
    function clearShellFileHistory() {
        shellFileHistory.clear();
    }
    let TerminalPersistedHistory = class TerminalPersistedHistory extends lifecycle_1.Disposable {
        get entries() {
            this._ensureUpToDate();
            return this._entries.entries();
        }
        constructor(_storageDataKey, _configurationService, _storageService) {
            super();
            this._storageDataKey = _storageDataKey;
            this._configurationService = _configurationService;
            this._storageService = _storageService;
            this._timestamp = 0;
            this._isReady = false;
            this._isStale = true;
            // Init cache
            this._entries = new map_1.LRUCache(this._getHistoryLimit());
            // Listen for config changes to set history limit
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */)) {
                    this._entries.limit = this._getHistoryLimit();
                }
            }));
            // Listen to cache changes from other windows
            this._register(this._storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, this._getTimestampStorageKey(), this._store)(() => {
                if (!this._isStale) {
                    this._isStale = this._storageService.getNumber(this._getTimestampStorageKey(), -1 /* StorageScope.APPLICATION */, 0) !== this._timestamp;
                }
            }));
        }
        add(key, value) {
            this._ensureUpToDate();
            this._entries.set(key, value);
            this._saveState();
        }
        remove(key) {
            this._ensureUpToDate();
            this._entries.delete(key);
            this._saveState();
        }
        clear() {
            this._ensureUpToDate();
            this._entries.clear();
            this._saveState();
        }
        _ensureUpToDate() {
            // Initial load
            if (!this._isReady) {
                this._loadState();
                this._isReady = true;
            }
            // React to stale cache caused by another window
            if (this._isStale) {
                // Since state is saved whenever the entries change, it's a safe assumption that no
                // merging of entries needs to happen, just loading the new state.
                this._entries.clear();
                this._loadState();
                this._isStale = false;
            }
        }
        _loadState() {
            this._timestamp = this._storageService.getNumber(this._getTimestampStorageKey(), -1 /* StorageScope.APPLICATION */, 0);
            // Load global entries plus
            const serialized = this._loadPersistedState();
            if (serialized) {
                for (const entry of serialized.entries) {
                    this._entries.set(entry.key, entry.value);
                }
            }
        }
        _loadPersistedState() {
            const raw = this._storageService.get(this._getEntriesStorageKey(), -1 /* StorageScope.APPLICATION */);
            if (raw === undefined || raw.length === 0) {
                return undefined;
            }
            let serialized = undefined;
            try {
                serialized = JSON.parse(raw);
            }
            catch {
                // Invalid data
                return undefined;
            }
            return serialized;
        }
        _saveState() {
            const serialized = { entries: [] };
            this._entries.forEach((value, key) => serialized.entries.push({ key, value }));
            this._storageService.store(this._getEntriesStorageKey(), JSON.stringify(serialized), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this._timestamp = Date.now();
            this._storageService.store(this._getTimestampStorageKey(), this._timestamp, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        _getHistoryLimit() {
            const historyLimit = this._configurationService.getValue("terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */);
            return typeof historyLimit === 'number' ? historyLimit : 100 /* Constants.DefaultHistoryLimit */;
        }
        _getTimestampStorageKey() {
            return `${"terminal.history.timestamp" /* StorageKeys.Timestamp */}.${this._storageDataKey}`;
        }
        _getEntriesStorageKey() {
            return `${"terminal.history.entries" /* StorageKeys.Entries */}.${this._storageDataKey}`;
        }
    };
    exports.TerminalPersistedHistory = TerminalPersistedHistory;
    exports.TerminalPersistedHistory = TerminalPersistedHistory = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], TerminalPersistedHistory);
    async function fetchBashHistory(accessor) {
        const fileService = accessor.get(files_1.IFileService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const remoteEnvironment = await remoteAgentService.getEnvironment();
        if (remoteEnvironment?.os === 1 /* OperatingSystem.Windows */ || !remoteEnvironment && platform_1.isWindows) {
            return undefined;
        }
        const content = await fetchFileContents(process_1.env['HOME'], '.bash_history', false, fileService, remoteAgentService);
        if (content === undefined) {
            return undefined;
        }
        // .bash_history does not differentiate wrapped commands from multiple commands. Parse
        // the output to get the
        const fileLines = content.split('\n');
        const result = new Set();
        let currentLine;
        let currentCommand = undefined;
        let wrapChar = undefined;
        for (let i = 0; i < fileLines.length; i++) {
            currentLine = fileLines[i];
            if (currentCommand === undefined) {
                currentCommand = currentLine;
            }
            else {
                currentCommand += `\n${currentLine}`;
            }
            for (let c = 0; c < currentLine.length; c++) {
                if (wrapChar) {
                    if (currentLine[c] === wrapChar) {
                        wrapChar = undefined;
                    }
                }
                else {
                    if (currentLine[c].match(/['"]/)) {
                        wrapChar = currentLine[c];
                    }
                }
            }
            if (wrapChar === undefined) {
                if (currentCommand.length > 0) {
                    result.add(currentCommand.trim());
                }
                currentCommand = undefined;
            }
        }
        return result.values();
    }
    async function fetchZshHistory(accessor) {
        const fileService = accessor.get(files_1.IFileService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const remoteEnvironment = await remoteAgentService.getEnvironment();
        if (remoteEnvironment?.os === 1 /* OperatingSystem.Windows */ || !remoteEnvironment && platform_1.isWindows) {
            return undefined;
        }
        const content = await fetchFileContents(process_1.env['HOME'], '.zsh_history', false, fileService, remoteAgentService);
        if (content === undefined) {
            return undefined;
        }
        const fileLines = content.split(/\:\s\d+\:\d+;/);
        const result = new Set();
        for (let i = 0; i < fileLines.length; i++) {
            const sanitized = fileLines[i].replace(/\\\n/g, '\n').trim();
            if (sanitized.length > 0) {
                result.add(sanitized);
            }
        }
        return result.values();
    }
    async function fetchPythonHistory(accessor) {
        const fileService = accessor.get(files_1.IFileService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const content = await fetchFileContents(process_1.env['HOME'], '.python_history', false, fileService, remoteAgentService);
        if (content === undefined) {
            return undefined;
        }
        // Python history file is a simple text file with one command per line
        const fileLines = content.split('\n');
        const result = new Set();
        fileLines.forEach(line => {
            if (line.trim().length > 0) {
                result.add(line.trim());
            }
        });
        return result.values();
    }
    async function fetchPwshHistory(accessor) {
        const fileService = accessor.get(files_1.IFileService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        let folderPrefix;
        let filePath;
        const remoteEnvironment = await remoteAgentService.getEnvironment();
        const isFileWindows = remoteEnvironment?.os === 1 /* OperatingSystem.Windows */ || !remoteEnvironment && platform_1.isWindows;
        if (isFileWindows) {
            folderPrefix = process_1.env['APPDATA'];
            filePath = '\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt';
        }
        else {
            folderPrefix = process_1.env['HOME'];
            filePath = '.local/share/powershell/PSReadline/ConsoleHost_history.txt';
        }
        const content = await fetchFileContents(folderPrefix, filePath, isFileWindows, fileService, remoteAgentService);
        if (content === undefined) {
            return undefined;
        }
        const fileLines = content.split('\n');
        const result = new Set();
        let currentLine;
        let currentCommand = undefined;
        let wrapChar = undefined;
        for (let i = 0; i < fileLines.length; i++) {
            currentLine = fileLines[i];
            if (currentCommand === undefined) {
                currentCommand = currentLine;
            }
            else {
                currentCommand += `\n${currentLine}`;
            }
            if (!currentLine.endsWith('`')) {
                const sanitized = currentCommand.trim();
                if (sanitized.length > 0) {
                    result.add(sanitized);
                }
                currentCommand = undefined;
                continue;
            }
            // If the line ends with `, the line may be wrapped. Need to also test the case where ` is
            // the last character in the line
            for (let c = 0; c < currentLine.length; c++) {
                if (wrapChar) {
                    if (currentLine[c] === wrapChar) {
                        wrapChar = undefined;
                    }
                }
                else {
                    if (currentLine[c].match(/`/)) {
                        wrapChar = currentLine[c];
                    }
                }
            }
            // Having an even number of backticks means the line is terminated
            // TODO: This doesn't cover more complicated cases where ` is within quotes
            if (!wrapChar) {
                const sanitized = currentCommand.trim();
                if (sanitized.length > 0) {
                    result.add(sanitized);
                }
                currentCommand = undefined;
            }
            else {
                // Remove trailing backtick
                currentCommand = currentCommand.replace(/`$/, '');
                wrapChar = undefined;
            }
        }
        return result.values();
    }
    async function fetchFishHistory(accessor) {
        const fileService = accessor.get(files_1.IFileService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const remoteEnvironment = await remoteAgentService.getEnvironment();
        if (remoteEnvironment?.os === 1 /* OperatingSystem.Windows */ || !remoteEnvironment && platform_1.isWindows) {
            return undefined;
        }
        /**
         * From `fish` docs:
         * > The command history is stored in the file ~/.local/share/fish/fish_history
         *   (or $XDG_DATA_HOME/fish/fish_history if that variable is set) by default.
         *
         * (https://fishshell.com/docs/current/interactive.html#history-search)
         */
        const overridenDataHome = process_1.env['XDG_DATA_HOME'];
        // TODO: Unchecked fish behavior:
        // What if XDG_DATA_HOME was defined but somehow $XDG_DATA_HOME/fish/fish_history
        // was not exist. Does fish fall back to ~/.local/share/fish/fish_history?
        const content = await (overridenDataHome
            ? fetchFileContents(process_1.env['XDG_DATA_HOME'], 'fish/fish_history', false, fileService, remoteAgentService)
            : fetchFileContents(process_1.env['HOME'], '.local/share/fish/fish_history', false, fileService, remoteAgentService));
        if (content === undefined) {
            return undefined;
        }
        /**
         * These apply to `fish` v3.5.1:
         * - It looks like YAML but it's not. It's, quoting, *"a broken psuedo-YAML"*.
         *   See these discussions for more details:
         *   - https://github.com/fish-shell/fish-shell/pull/6493
         *   - https://github.com/fish-shell/fish-shell/issues/3341
         * - Every record should exactly start with `- cmd:` (the whitespace between `-` and `cmd` cannot be replaced with tab)
         * - Both `- cmd: echo 1` and `- cmd:echo 1` are valid entries.
         * - Backslashes are esacped as `\\`.
         * - Multiline commands are joined with a `\n` sequence, hence they're read as single line commands.
         * - Property `when` is optional.
         * - History navigation respects the records order and ignore the actual `when` property values (chronological order).
         * - If `cmd` value is multiline , it just takes the first line. Also YAML operators like `>-` or `|-` are not supported.
         */
        const result = new Set();
        const cmds = content.split('\n')
            .filter(x => x.startsWith('- cmd:'))
            .map(x => x.substring(6).trimStart());
        for (let i = 0; i < cmds.length; i++) {
            const sanitized = sanitizeFishHistoryCmd(cmds[i]).trim();
            if (sanitized.length > 0) {
                result.add(sanitized);
            }
        }
        return result.values();
    }
    function sanitizeFishHistoryCmd(cmd) {
        /**
         * NOTE
         * This repeatedReplace() call can be eliminated by using look-ahead
         * caluses in the original RegExp pattern:
         *
         * >>> ```ts
         * >>> cmds[i].replace(/(?<=^|[^\\])((?:\\\\)*)(\\n)/g, '$1\n')
         * >>> ```
         *
         * But since not all browsers support look aheads we opted to a simple
         * pattern and repeatedly calling replace method.
         */
        return repeatedReplace(/(^|[^\\])((?:\\\\)*)(\\n)/g, cmd, '$1$2\n');
    }
    function repeatedReplace(pattern, value, replaceValue) {
        let last;
        let current = value;
        while (true) {
            last = current;
            current = current.replace(pattern, replaceValue);
            if (current === last) {
                return current;
            }
        }
    }
    async function fetchFileContents(folderPrefix, filePath, isFileWindows, fileService, remoteAgentService) {
        if (!folderPrefix) {
            return undefined;
        }
        const isRemote = !!remoteAgentService.getConnection()?.remoteAuthority;
        const historyFileUri = uri_1.URI.from({
            scheme: isRemote ? network_1.Schemas.vscodeRemote : network_1.Schemas.file,
            path: (isFileWindows ? path_1.win32.join : path_1.posix.join)(folderPrefix, filePath)
        });
        let content;
        try {
            content = await fileService.readFile(historyFileUri);
        }
        catch (e) {
            // Handle file not found only
            if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                return undefined;
            }
            throw e;
        }
        if (content === undefined) {
            return undefined;
        }
        return content.value.toString();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvY29tbW9uL2hpc3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0RoRyw4Q0FLQztJQUdELGtEQUtDO0lBSUQsa0RBa0NDO0lBQ0Qsc0RBRUM7SUEwSEQsNENBNkNDO0lBRUQsMENBb0JDO0lBR0QsZ0RBcUJDO0lBRUQsNENBbUVDO0lBRUQsNENBcURDO0lBRUQsd0RBY0M7SUFqYUQsSUFBVyxTQUVWO0lBRkQsV0FBVyxTQUFTO1FBQ25CLHlFQUF5QixDQUFBO0lBQzFCLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVELElBQVcsV0FHVjtJQUhELFdBQVcsV0FBVztRQUNyQixtREFBb0MsQ0FBQTtRQUNwQyx1REFBd0MsQ0FBQTtJQUN6QyxDQUFDLEVBSFUsV0FBVyxLQUFYLFdBQVcsUUFHckI7SUFFRCxJQUFJLGNBQWMsR0FBNEUsU0FBUyxDQUFDO0lBQ3hHLFNBQWdCLGlCQUFpQixDQUFDLFFBQTBCO1FBQzNELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNyQixjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxVQUFVLENBQStELENBQUM7UUFDekssQ0FBQztRQUNELE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxJQUFJLGdCQUFnQixHQUF3RSxTQUFTLENBQUM7SUFDdEcsU0FBZ0IsbUJBQW1CLENBQUMsUUFBMEI7UUFDN0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDdkIsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQTJELENBQUM7UUFDbkssQ0FBQztRQUNELE9BQU8sZ0JBQWdCLENBQUM7SUFDekIsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCxNQUFNLGdCQUFnQixHQUF3RCxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pGLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxRQUEwQixFQUFFLFNBQXdDO1FBQzdHLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNyQixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMxQixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFDRCxJQUFJLE1BQTRDLENBQUM7UUFDakQsUUFBUSxTQUFTLEVBQUUsQ0FBQztZQUNuQjtnQkFDQyxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUMsTUFBTTtZQUNQLDZDQUFnQyxpREFBaUQ7Z0JBQ2hGLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNO1lBQ1A7Z0JBQ0MsTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNO1lBQ1A7Z0JBQ0MsTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzFDLE1BQU07WUFDUDtnQkFDQyxNQUFNLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUMsTUFBTTtZQUNQLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFDRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMxQixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFDRCxTQUFnQixxQkFBcUI7UUFDcEMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQTRCLFNBQVEsc0JBQVU7UUFNMUQsSUFBSSxPQUFPO1lBQ1YsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsWUFDa0IsZUFBdUIsRUFDakIscUJBQTZELEVBQ25FLGVBQWlEO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBSlMsb0JBQWUsR0FBZixlQUFlLENBQVE7WUFDQSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQVozRCxlQUFVLEdBQVcsQ0FBQyxDQUFDO1lBQ3ZCLGFBQVEsR0FBRyxLQUFLLENBQUM7WUFDakIsYUFBUSxHQUFHLElBQUksQ0FBQztZQWN2QixhQUFhO1lBQ2IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGNBQVEsQ0FBWSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1lBRWpFLGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLHVHQUFrRCxFQUFFLENBQUM7b0JBQzlFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDZDQUE2QztZQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLG9DQUEyQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFO2dCQUNoSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxxQ0FBNEIsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDakksQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFRO1lBQ3hCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCxNQUFNLENBQUMsR0FBVztZQUNqQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFTyxlQUFlO1lBQ3RCLGVBQWU7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxnREFBZ0Q7WUFDaEQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLG1GQUFtRjtnQkFDbkYsa0VBQWtFO2dCQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRU8sVUFBVTtZQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxxQ0FBNEIsQ0FBQyxDQUFDLENBQUM7WUFFOUcsMkJBQTJCO1lBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzlDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssTUFBTSxLQUFLLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sbUJBQW1CO1lBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxvQ0FBMkIsQ0FBQztZQUM3RixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksVUFBVSxHQUFvQyxTQUFTLENBQUM7WUFDNUQsSUFBSSxDQUFDO2dCQUNKLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1IsZUFBZTtnQkFDZixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVPLFVBQVU7WUFDakIsTUFBTSxVQUFVLEdBQXdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQ3hELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLG1FQUFrRCxDQUFDO1lBQ3RJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLElBQUksQ0FBQyxVQUFVLG1FQUFrRCxDQUFDO1FBQzlILENBQUM7UUFFTyxnQkFBZ0I7WUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsdUdBQWtELENBQUM7WUFDM0csT0FBTyxPQUFPLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdDQUE4QixDQUFDO1FBQ3hGLENBQUM7UUFFTyx1QkFBdUI7WUFDOUIsT0FBTyxHQUFHLHdEQUFxQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMzRCxDQUFDO1FBRU8scUJBQXFCO1lBQzVCLE9BQU8sR0FBRyxvREFBbUIsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekQsQ0FBQztLQUNELENBQUE7SUF0SFksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFhbEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7T0FkTCx3QkFBd0IsQ0FzSHBDO0lBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQTBCO1FBQ2hFLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDO1FBQzdELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNwRSxJQUFJLGlCQUFpQixFQUFFLEVBQUUsb0NBQTRCLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDMUYsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0saUJBQWlCLENBQUMsYUFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDOUcsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELHNGQUFzRjtRQUN0Rix3QkFBd0I7UUFDeEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0QyxJQUFJLFdBQW1CLENBQUM7UUFDeEIsSUFBSSxjQUFjLEdBQXVCLFNBQVMsQ0FBQztRQUNuRCxJQUFJLFFBQVEsR0FBdUIsU0FBUyxDQUFDO1FBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0MsV0FBVyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsY0FBYyxHQUFHLFdBQVcsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsY0FBYyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ2pDLFFBQVEsR0FBRyxTQUFTLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUNsQyxRQUFRLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFDRCxjQUFjLEdBQUcsU0FBUyxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVNLEtBQUssVUFBVSxlQUFlLENBQUMsUUFBMEI7UUFDL0QsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7UUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixDQUFDLENBQUM7UUFDN0QsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BFLElBQUksaUJBQWlCLEVBQUUsRUFBRSxvQ0FBNEIsSUFBSSxDQUFDLGlCQUFpQixJQUFJLG9CQUFTLEVBQUUsQ0FBQztZQUMxRixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxhQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUM3RyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMzQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqRCxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzNDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzdELElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFHTSxLQUFLLFVBQVUsa0JBQWtCLENBQUMsUUFBMEI7UUFDbEUsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7UUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixDQUFDLENBQUM7UUFFN0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxhQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBRWhILElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxzRUFBc0U7UUFDdEUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV0QyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6QixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQTBCO1FBQ2hFLE1BQU0sV0FBVyxHQUFtQyxRQUFRLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztRQUMvRSxNQUFNLGtCQUFrQixHQUFrRSxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixDQUFDLENBQUM7UUFDNUgsSUFBSSxZQUFnQyxDQUFDO1FBQ3JDLElBQUksUUFBZ0IsQ0FBQztRQUNyQixNQUFNLGlCQUFpQixHQUFHLE1BQU0sa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDcEUsTUFBTSxhQUFhLEdBQUcsaUJBQWlCLEVBQUUsRUFBRSxvQ0FBNEIsSUFBSSxDQUFDLGlCQUFpQixJQUFJLG9CQUFTLENBQUM7UUFDM0csSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNuQixZQUFZLEdBQUcsYUFBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlCLFFBQVEsR0FBRyx1RUFBdUUsQ0FBQztRQUNwRixDQUFDO2FBQU0sQ0FBQztZQUNQLFlBQVksR0FBRyxhQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsUUFBUSxHQUFHLDREQUE0RCxDQUFDO1FBQ3pFLENBQUM7UUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLGlCQUFpQixDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hILElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sTUFBTSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3RDLElBQUksV0FBbUIsQ0FBQztRQUN4QixJQUFJLGNBQWMsR0FBdUIsU0FBUyxDQUFDO1FBQ25ELElBQUksUUFBUSxHQUF1QixTQUFTLENBQUM7UUFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMzQyxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNsQyxjQUFjLEdBQUcsV0FBVyxDQUFDO1lBQzlCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxjQUFjLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBQ0QsY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFDM0IsU0FBUztZQUNWLENBQUM7WUFDRCwwRkFBMEY7WUFDMUYsaUNBQWlDO1lBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ2pDLFFBQVEsR0FBRyxTQUFTLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUMvQixRQUFRLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0Qsa0VBQWtFO1lBQ2xFLDJFQUEyRTtZQUMzRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBQ0QsY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUM1QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsMkJBQTJCO2dCQUMzQixjQUFjLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xELFFBQVEsR0FBRyxTQUFTLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRU0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFFBQTBCO1FBQ2hFLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO1FBQy9DLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDO1FBQzdELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNwRSxJQUFJLGlCQUFpQixFQUFFLEVBQUUsb0NBQTRCLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDMUYsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVEOzs7Ozs7V0FNRztRQUNILE1BQU0saUJBQWlCLEdBQUcsYUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRS9DLGlDQUFpQztRQUNqQyxpRkFBaUY7UUFDakYsMEVBQTBFO1FBRTFFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUI7WUFDdkMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLGFBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDO1lBQ3RHLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsZ0NBQWdDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDN0csSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVEOzs7Ozs7Ozs7Ozs7O1dBYUc7UUFDSCxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQzthQUM5QixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ25DLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pELElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxHQUFXO1FBQ2pEOzs7Ozs7Ozs7OztXQVdHO1FBQ0gsT0FBTyxlQUFlLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUFlLEVBQUUsS0FBYSxFQUFFLFlBQW9CO1FBQzVFLElBQUksSUFBSSxDQUFDO1FBQ1QsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDYixJQUFJLEdBQUcsT0FBTyxDQUFDO1lBQ2YsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pELElBQUksT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN0QixPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQy9CLFlBQWdDLEVBQ2hDLFFBQWdCLEVBQ2hCLGFBQXNCLEVBQ3RCLFdBQTJDLEVBQzNDLGtCQUE4RDtRQUU5RCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsRUFBRSxlQUFlLENBQUM7UUFDdkUsTUFBTSxjQUFjLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztZQUMvQixNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxJQUFJO1lBQ3RELElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUM7U0FDdkUsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFxQixDQUFDO1FBQzFCLElBQUksQ0FBQztZQUNKLE9BQU8sR0FBRyxNQUFNLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUFDLE9BQU8sQ0FBVSxFQUFFLENBQUM7WUFDckIsNkJBQTZCO1lBQzdCLElBQUksQ0FBQyxZQUFZLDBCQUFrQixJQUFJLENBQUMsQ0FBQyxtQkFBbUIsK0NBQXVDLEVBQUUsQ0FBQztnQkFDckcsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sQ0FBQyxDQUFDO1FBQ1QsQ0FBQztRQUNELElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDakMsQ0FBQyJ9
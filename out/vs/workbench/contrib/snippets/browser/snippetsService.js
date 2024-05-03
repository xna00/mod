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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/languages/language", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/language/common/languageService", "./snippetCompletionProvider", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/languageConfigurationRegistry", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/arrays"], function (require, exports, lifecycle_1, resources, strings_1, language_1, suggest_1, nls_1, environment_1, files_1, lifecycle_2, log_1, workspace_1, snippetsFile_1, extensionsRegistry_1, languageService_1, snippetCompletionProvider_1, extensionResourceLoader_1, map_1, storage_1, types_1, instantiation_1, textfiles_1, languageConfigurationRegistry_1, userDataProfile_1, arrays_1) {
    "use strict";
    var SnippetEnablement_1, SnippetUsageTimestamps_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsService = void 0;
    exports.getNonWhitespacePrefix = getNonWhitespacePrefix;
    var snippetExt;
    (function (snippetExt) {
        function toValidSnippet(extension, snippet, languageService) {
            if ((0, strings_1.isFalsyOrWhitespace)(snippet.path)) {
                extension.collector.error((0, nls_1.localize)('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", extension.description.name, String(snippet.path)));
                return null;
            }
            if ((0, strings_1.isFalsyOrWhitespace)(snippet.language) && !snippet.path.endsWith('.code-snippets')) {
                extension.collector.error((0, nls_1.localize)('invalid.language.0', "When omitting the language, the value of `contributes.{0}.path` must be a `.code-snippets`-file. Provided value: {1}", extension.description.name, String(snippet.path)));
                return null;
            }
            if (!(0, strings_1.isFalsyOrWhitespace)(snippet.language) && !languageService.isRegisteredLanguageId(snippet.language)) {
                extension.collector.error((0, nls_1.localize)('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", extension.description.name, String(snippet.language)));
                return null;
            }
            const extensionLocation = extension.description.extensionLocation;
            const snippetLocation = resources.joinPath(extensionLocation, snippet.path);
            if (!resources.isEqualOrParent(snippetLocation, extensionLocation)) {
                extension.collector.error((0, nls_1.localize)('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", extension.description.name, snippetLocation.path, extensionLocation.path));
                return null;
            }
            return {
                language: snippet.language,
                location: snippetLocation
            };
        }
        snippetExt.toValidSnippet = toValidSnippet;
        snippetExt.snippetsContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.snippets', 'Contributes snippets.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '', path: '' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { language: '${1:id}', path: './snippets/${2:id}.json.' } }],
                properties: {
                    language: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.snippets-language', 'Language identifier for which this snippet is contributed to.'),
                        type: 'string'
                    },
                    path: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.snippets-path', 'Path of the snippets file. The path is relative to the extension folder and typically starts with \'./snippets/\'.'),
                        type: 'string'
                    }
                }
            }
        };
        snippetExt.point = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'snippets',
            deps: [languageService_1.languagesExtPoint],
            jsonSchema: snippetExt.snippetsContribution
        });
    })(snippetExt || (snippetExt = {}));
    function watch(service, resource, callback) {
        return (0, lifecycle_1.combinedDisposable)(service.watch(resource), service.onDidFilesChange(e => {
            if (e.affects(resource)) {
                callback();
            }
        }));
    }
    let SnippetEnablement = class SnippetEnablement {
        static { SnippetEnablement_1 = this; }
        static { this._key = 'snippets.ignoredSnippets'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            const raw = _storageService.get(SnippetEnablement_1._key, 0 /* StorageScope.PROFILE */, '');
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch { }
            this._ignored = (0, types_1.isStringArray)(data) ? new Set(data) : new Set();
        }
        isIgnored(id) {
            return this._ignored.has(id);
        }
        updateIgnored(id, value) {
            let changed = false;
            if (this._ignored.has(id) && !value) {
                this._ignored.delete(id);
                changed = true;
            }
            else if (!this._ignored.has(id) && value) {
                this._ignored.add(id);
                changed = true;
            }
            if (changed) {
                this._storageService.store(SnippetEnablement_1._key, JSON.stringify(Array.from(this._ignored)), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
    };
    SnippetEnablement = SnippetEnablement_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], SnippetEnablement);
    let SnippetUsageTimestamps = class SnippetUsageTimestamps {
        static { SnippetUsageTimestamps_1 = this; }
        static { this._key = 'snippets.usageTimestamps'; }
        constructor(_storageService) {
            this._storageService = _storageService;
            const raw = _storageService.get(SnippetUsageTimestamps_1._key, 0 /* StorageScope.PROFILE */, '');
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch {
                data = [];
            }
            this._usages = Array.isArray(data) ? new Map(data) : new Map();
        }
        getUsageTimestamp(id) {
            return this._usages.get(id);
        }
        updateUsageTimestamp(id) {
            // map uses insertion order, we want most recent at the end
            this._usages.delete(id);
            this._usages.set(id, Date.now());
            // persist last 100 item
            const all = [...this._usages].slice(-100);
            this._storageService.store(SnippetUsageTimestamps_1._key, JSON.stringify(all), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    SnippetUsageTimestamps = SnippetUsageTimestamps_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], SnippetUsageTimestamps);
    let SnippetsService = class SnippetsService {
        constructor(_environmentService, _userDataProfileService, _contextService, _languageService, _logService, _fileService, _textfileService, _extensionResourceLoaderService, lifecycleService, instantiationService, languageConfigurationService) {
            this._environmentService = _environmentService;
            this._userDataProfileService = _userDataProfileService;
            this._contextService = _contextService;
            this._languageService = _languageService;
            this._logService = _logService;
            this._fileService = _fileService;
            this._textfileService = _textfileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._pendingWork = [];
            this._files = new map_1.ResourceMap();
            this._pendingWork.push(Promise.resolve(lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                this._initExtensionSnippets();
                this._initUserSnippets();
                this._initWorkspaceSnippets();
            })));
            (0, suggest_1.setSnippetSuggestSupport)(new snippetCompletionProvider_1.SnippetCompletionProvider(this._languageService, this, languageConfigurationService));
            this._enablement = instantiationService.createInstance(SnippetEnablement);
            this._usageTimestamps = instantiationService.createInstance(SnippetUsageTimestamps);
        }
        dispose() {
            this._disposables.dispose();
        }
        isEnabled(snippet) {
            return !this._enablement.isIgnored(snippet.snippetIdentifier);
        }
        updateEnablement(snippet, enabled) {
            this._enablement.updateIgnored(snippet.snippetIdentifier, !enabled);
        }
        updateUsageTimestamp(snippet) {
            this._usageTimestamps.updateUsageTimestamp(snippet.snippetIdentifier);
        }
        _joinSnippets() {
            const promises = this._pendingWork.slice(0);
            this._pendingWork.length = 0;
            return Promise.all(promises);
        }
        async getSnippetFiles() {
            await this._joinSnippets();
            return this._files.values();
        }
        async getSnippets(languageId, opts) {
            await this._joinSnippets();
            const result = [];
            const promises = [];
            if (languageId) {
                if (this._languageService.isRegisteredLanguageId(languageId)) {
                    for (const file of this._files.values()) {
                        promises.push(file.load()
                            .then(file => file.select(languageId, result))
                            .catch(err => this._logService.error(err, file.location.toString())));
                    }
                }
            }
            else {
                for (const file of this._files.values()) {
                    promises.push(file.load()
                        .then(file => (0, arrays_1.insertInto)(result, result.length, file.data))
                        .catch(err => this._logService.error(err, file.location.toString())));
                }
            }
            await Promise.all(promises);
            return this._filterAndSortSnippets(result, opts);
        }
        getSnippetsSync(languageId, opts) {
            const result = [];
            if (this._languageService.isRegisteredLanguageId(languageId)) {
                for (const file of this._files.values()) {
                    // kick off loading (which is a noop in case it's already loaded)
                    // and optimistically collect snippets
                    file.load().catch(_err => { });
                    file.select(languageId, result);
                }
            }
            return this._filterAndSortSnippets(result, opts);
        }
        _filterAndSortSnippets(snippets, opts) {
            const result = [];
            for (const snippet of snippets) {
                if (!snippet.prefix && !opts?.includeNoPrefixSnippets) {
                    // prefix or no-prefix wanted
                    continue;
                }
                if (!this.isEnabled(snippet) && !opts?.includeDisabledSnippets) {
                    // enabled or disabled wanted
                    continue;
                }
                if (typeof opts?.fileTemplateSnippets === 'boolean' && opts.fileTemplateSnippets !== snippet.isFileTemplate) {
                    // isTopLevel requested but mismatching
                    continue;
                }
                result.push(snippet);
            }
            return result.sort((a, b) => {
                let result = 0;
                if (!opts?.noRecencySort) {
                    const val1 = this._usageTimestamps.getUsageTimestamp(a.snippetIdentifier) ?? -1;
                    const val2 = this._usageTimestamps.getUsageTimestamp(b.snippetIdentifier) ?? -1;
                    result = val2 - val1;
                }
                if (result === 0) {
                    result = this._compareSnippet(a, b);
                }
                return result;
            });
        }
        _compareSnippet(a, b) {
            if (a.snippetSource < b.snippetSource) {
                return -1;
            }
            else if (a.snippetSource > b.snippetSource) {
                return 1;
            }
            else if (a.source < b.source) {
                return -1;
            }
            else if (a.source > b.source) {
                return 1;
            }
            else if (a.name > b.name) {
                return 1;
            }
            else if (a.name < b.name) {
                return -1;
            }
            else {
                return 0;
            }
        }
        // --- loading, watching
        _initExtensionSnippets() {
            snippetExt.point.setHandler(extensions => {
                for (const [key, value] of this._files) {
                    if (value.source === 3 /* SnippetSource.Extension */) {
                        this._files.delete(key);
                    }
                }
                for (const extension of extensions) {
                    for (const contribution of extension.value) {
                        const validContribution = snippetExt.toValidSnippet(extension, contribution, this._languageService);
                        if (!validContribution) {
                            continue;
                        }
                        const file = this._files.get(validContribution.location);
                        if (file) {
                            if (file.defaultScopes) {
                                file.defaultScopes.push(validContribution.language);
                            }
                            else {
                                file.defaultScopes = [];
                            }
                        }
                        else {
                            const file = new snippetsFile_1.SnippetFile(3 /* SnippetSource.Extension */, validContribution.location, validContribution.language ? [validContribution.language] : undefined, extension.description, this._fileService, this._extensionResourceLoaderService);
                            this._files.set(file.location, file);
                            if (this._environmentService.isExtensionDevelopment) {
                                file.load().then(file => {
                                    // warn about bad tabstop/variable usage
                                    if (file.data.some(snippet => snippet.isBogous)) {
                                        extension.collector.warn((0, nls_1.localize)('badVariableUse', "One or more snippets from the extension '{0}' very likely confuse snippet-variables and snippet-placeholders (see https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax for more details)", extension.description.name));
                                    }
                                }, err => {
                                    // generic error
                                    extension.collector.warn((0, nls_1.localize)('badFile', "The snippet file \"{0}\" could not be read.", file.location.toString()));
                                });
                            }
                        }
                    }
                }
            });
        }
        _initWorkspaceSnippets() {
            // workspace stuff
            const disposables = new lifecycle_1.DisposableStore();
            const updateWorkspaceSnippets = () => {
                disposables.clear();
                this._pendingWork.push(this._initWorkspaceFolderSnippets(this._contextService.getWorkspace(), disposables));
            };
            this._disposables.add(disposables);
            this._disposables.add(this._contextService.onDidChangeWorkspaceFolders(updateWorkspaceSnippets));
            this._disposables.add(this._contextService.onDidChangeWorkbenchState(updateWorkspaceSnippets));
            updateWorkspaceSnippets();
        }
        async _initWorkspaceFolderSnippets(workspace, bucket) {
            const promises = workspace.folders.map(async (folder) => {
                const snippetFolder = folder.toResource('.vscode');
                const value = await this._fileService.exists(snippetFolder);
                if (value) {
                    this._initFolderSnippets(2 /* SnippetSource.Workspace */, snippetFolder, bucket);
                }
                else {
                    // watch
                    bucket.add(this._fileService.onDidFilesChange(e => {
                        if (e.contains(snippetFolder, 1 /* FileChangeType.ADDED */)) {
                            this._initFolderSnippets(2 /* SnippetSource.Workspace */, snippetFolder, bucket);
                        }
                    }));
                }
            });
            await Promise.all(promises);
        }
        async _initUserSnippets() {
            const disposables = new lifecycle_1.DisposableStore();
            const updateUserSnippets = async () => {
                disposables.clear();
                const userSnippetsFolder = this._userDataProfileService.currentProfile.snippetsHome;
                await this._fileService.createFolder(userSnippetsFolder);
                await this._initFolderSnippets(1 /* SnippetSource.User */, userSnippetsFolder, disposables);
            };
            this._disposables.add(disposables);
            this._disposables.add(this._userDataProfileService.onDidChangeCurrentProfile(e => e.join((async () => {
                this._pendingWork.push(updateUserSnippets());
            })())));
            await updateUserSnippets();
        }
        _initFolderSnippets(source, folder, bucket) {
            const disposables = new lifecycle_1.DisposableStore();
            const addFolderSnippets = async () => {
                disposables.clear();
                if (!await this._fileService.exists(folder)) {
                    return;
                }
                try {
                    const stat = await this._fileService.resolve(folder);
                    for (const entry of stat.children || []) {
                        disposables.add(this._addSnippetFile(entry.resource, source));
                    }
                }
                catch (err) {
                    this._logService.error(`Failed snippets from folder '${folder.toString()}'`, err);
                }
            };
            bucket.add(this._textfileService.files.onDidSave(e => {
                if (resources.isEqualOrParent(e.model.resource, folder)) {
                    addFolderSnippets();
                }
            }));
            bucket.add(watch(this._fileService, folder, addFolderSnippets));
            bucket.add(disposables);
            return addFolderSnippets();
        }
        _addSnippetFile(uri, source) {
            const ext = resources.extname(uri);
            if (source === 1 /* SnippetSource.User */ && ext === '.json') {
                const langName = resources.basename(uri).replace(/\.json/, '');
                this._files.set(uri, new snippetsFile_1.SnippetFile(source, uri, [langName], undefined, this._fileService, this._extensionResourceLoaderService));
            }
            else if (ext === '.code-snippets') {
                this._files.set(uri, new snippetsFile_1.SnippetFile(source, uri, undefined, undefined, this._fileService, this._extensionResourceLoaderService));
            }
            return {
                dispose: () => this._files.delete(uri)
            };
        }
    };
    exports.SnippetsService = SnippetsService;
    exports.SnippetsService = SnippetsService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, language_1.ILanguageService),
        __param(4, log_1.ILogService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(8, lifecycle_2.ILifecycleService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetsService);
    function getNonWhitespacePrefix(model, position) {
        /**
         * Do not analyze more characters
         */
        const MAX_PREFIX_LENGTH = 100;
        const line = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
        const minChIndex = Math.max(0, line.length - MAX_PREFIX_LENGTH);
        for (let chIndex = line.length - 1; chIndex >= minChIndex; chIndex--) {
            const ch = line.charAt(chIndex);
            if (/\s/.test(ch)) {
                return line.substr(chIndex + 1);
            }
        }
        if (minChIndex === 0) {
            return line;
        }
        return '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL3NuaXBwZXRzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd2ZoRyx3REFzQkM7SUEvZUQsSUFBVSxVQUFVLENBb0ZuQjtJQXBGRCxXQUFVLFVBQVU7UUFZbkIsU0FBZ0IsY0FBYyxDQUFDLFNBQXlELEVBQUUsT0FBZ0MsRUFBRSxlQUFpQztZQUU1SixJQUFJLElBQUEsNkJBQW1CLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUNqQyxnQkFBZ0IsRUFDaEIsZ0VBQWdFLEVBQ2hFLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQ2hELENBQUMsQ0FBQztnQkFDSCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLElBQUEsNkJBQW1CLEVBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUN2RixTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFDakMsb0JBQW9CLEVBQ3BCLHNIQUFzSCxFQUN0SCxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUNoRCxDQUFDLENBQUM7Z0JBQ0gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUEsNkJB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
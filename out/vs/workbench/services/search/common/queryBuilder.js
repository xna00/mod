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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/glob", "vs/base/common/labels", "vs/base/common/map", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/model/textModelSearch", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/search/common/search"], function (require, exports, arrays, collections, glob, labels_1, map_1, network_1, path, resources_1, strings, types_1, uri_1, textModelSearch_1, nls, configuration_1, log_1, workspace_1, editorGroupsService_1, pathService_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryBuilder = void 0;
    exports.resolveResourcesForSearchIncludes = resolveResourcesForSearchIncludes;
    let QueryBuilder = class QueryBuilder {
        constructor(configurationService, workspaceContextService, editorGroupsService, logService, pathService) {
            this.configurationService = configurationService;
            this.workspaceContextService = workspaceContextService;
            this.editorGroupsService = editorGroupsService;
            this.logService = logService;
            this.pathService = pathService;
        }
        text(contentPattern, folderResources, options = {}) {
            contentPattern = this.getContentPattern(contentPattern, options);
            const searchConfig = this.configurationService.getValue();
            const fallbackToPCRE = folderResources && folderResources.some(folder => {
                const folderConfig = this.configurationService.getValue({ resource: folder });
                return !folderConfig.search.useRipgrep;
            });
            const commonQuery = this.commonQuery(folderResources?.map(workspace_1.toWorkspaceFolder), options);
            return {
                ...commonQuery,
                type: 2 /* QueryType.Text */,
                contentPattern,
                previewOptions: options.previewOptions,
                maxFileSize: options.maxFileSize,
                usePCRE2: searchConfig.search.usePCRE2 || fallbackToPCRE || false,
                beforeContext: options.beforeContext,
                afterContext: options.afterContext,
                userDisabledExcludesAndIgnoreFiles: options.disregardExcludeSettings && options.disregardIgnoreFiles,
            };
        }
        /**
         * Adjusts input pattern for config
         */
        getContentPattern(inputPattern, options) {
            const searchConfig = this.configurationService.getValue();
            if (inputPattern.isRegExp) {
                inputPattern.pattern = inputPattern.pattern.replace(/\r?\n/g, '\\n');
            }
            const newPattern = {
                ...inputPattern,
                wordSeparators: searchConfig.editor.wordSeparators
            };
            if (this.isCaseSensitive(inputPattern, options)) {
                newPattern.isCaseSensitive = true;
            }
            if (this.isMultiline(inputPattern)) {
                newPattern.isMultiline = true;
            }
            if (options.notebookSearchConfig?.includeMarkupInput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookMarkdownInput = options.notebookSearchConfig.includeMarkupInput;
            }
            if (options.notebookSearchConfig?.includeMarkupPreview) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookMarkdownPreview = options.notebookSearchConfig.includeMarkupPreview;
            }
            if (options.notebookSearchConfig?.includeCodeInput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookCellInput = options.notebookSearchConfig.includeCodeInput;
            }
            if (options.notebookSearchConfig?.includeOutput) {
                if (!newPattern.notebookInfo) {
                    newPattern.notebookInfo = {};
                }
                newPattern.notebookInfo.isInNotebookCellOutput = options.notebookSearchConfig.includeOutput;
            }
            return newPattern;
        }
        file(folders, options = {}) {
            const commonQuery = this.commonQuery(folders, options);
            return {
                ...commonQuery,
                type: 1 /* QueryType.File */,
                filePattern: options.filePattern
                    ? options.filePattern.trim()
                    : options.filePattern,
                exists: options.exists,
                sortByScore: options.sortByScore,
                cacheKey: options.cacheKey,
                shouldGlobMatchFilePattern: options.shouldGlobSearch
            };
        }
        handleIncludeExclude(pattern, expandPatterns) {
            if (!pattern) {
                return {};
            }
            pattern = Array.isArray(pattern) ? pattern.map(normalizeSlashes) : normalizeSlashes(pattern);
            return expandPatterns
                ? this.parseSearchPaths(pattern)
                : { pattern: patternListToIExpression(...(Array.isArray(pattern) ? pattern : [pattern])) };
        }
        commonQuery(folderResources = [], options = {}) {
            const includeSearchPathsInfo = this.handleIncludeExclude(options.includePattern, options.expandPatterns);
            const excludeSearchPathsInfo = this.handleIncludeExclude(options.excludePattern, options.expandPatterns);
            // Build folderQueries from searchPaths, if given, otherwise folderResources
            const includeFolderName = folderResources.length > 1;
            const folderQueries = (includeSearchPathsInfo.searchPaths && includeSearchPathsInfo.searchPaths.length ?
                includeSearchPathsInfo.searchPaths.map(searchPath => this.getFolderQueryForSearchPath(searchPath, options, excludeSearchPathsInfo)) :
                folderResources.map(folder => this.getFolderQueryForRoot(folder, options, excludeSearchPathsInfo, includeFolderName)))
                .filter(query => !!query);
            const queryProps = {
                _reason: options._reason,
                folderQueries,
                usingSearchPaths: !!(includeSearchPathsInfo.searchPaths && includeSearchPathsInfo.searchPaths.length),
                extraFileResources: options.extraFileResources,
                excludePattern: excludeSearchPathsInfo.pattern,
                includePattern: includeSearchPathsInfo.pattern,
                onlyOpenEditors: options.onlyOpenEditors,
                maxResults: options.maxResults
            };
            if (options.onlyOpenEditors) {
                const openEditors = arrays.coalesce(arrays.flatten(this.editorGroupsService.groups.map(group => group.editors.map(editor => editor.resource))));
                this.logService.trace('QueryBuilder#commonQuery - openEditor URIs', JSON.stringify(openEditors));
                const openEditorsInQuery = openEditors.filter(editor => (0, search_1.pathIncludedInQuery)(queryProps, editor.fsPath));
                const openEditorsQueryProps = this.commonQueryFromFileList(openEditorsInQuery);
                this.logService.trace('QueryBuilder#commonQuery - openEditor Query', JSON.stringify(openEditorsQueryProps));
                return { ...queryProps, ...openEditorsQueryProps };
            }
            // Filter extraFileResources against global include/exclude patterns - they are already expected to not belong to a workspace
            const extraFileResources = options.extraFileResources && options.extraFileResources.filter(extraFile => (0, search_1.pathIncludedInQuery)(queryProps, extraFile.fsPath));
            queryProps.extraFileResources = extraFileResources && extraFileResources.length ? extraFileResources : undefined;
            return queryProps;
        }
        commonQueryFromFileList(files) {
            const folderQueries = [];
            const foldersToSearch = new map_1.ResourceMap();
            const includePattern = {};
            let hasIncludedFile = false;
            files.forEach(file => {
                if (file.scheme === network_1.Schemas.walkThrough) {
                    return;
                }
                const providerExists = (0, resources_1.isAbsolutePath)(file);
                // Special case userdata as we don't have a search provider for it, but it can be searched.
                if (providerExists) {
                    const searchRoot = this.workspaceContextService.getWorkspaceFolder(file)?.uri ?? file.with({ path: path.dirname(file.fsPath) });
                    let folderQuery = foldersToSearch.get(searchRoot);
                    if (!folderQuery) {
                        hasIncludedFile = true;
                        folderQuery = { folder: searchRoot, includePattern: {} };
                        folderQueries.push(folderQuery);
                        foldersToSearch.set(searchRoot, folderQuery);
                    }
                    const relPath = path.relative(searchRoot.fsPath, file.fsPath);
                    (0, types_1.assertIsDefined)(folderQuery.includePattern)[relPath.replace(/\\/g, '/')] = true;
                }
                else {
                    if (file.fsPath) {
                        hasIncludedFile = true;
                        includePattern[file.fsPath] = true;
                    }
                }
            });
            return {
                folderQueries,
                includePattern,
                usingSearchPaths: true,
                excludePattern: hasIncludedFile ? undefined : { '**/*': true }
            };
        }
        /**
         * Resolve isCaseSensitive flag based on the query and the isSmartCase flag, for search providers that don't support smart case natively.
         */
        isCaseSensitive(contentPattern, options) {
            if (options.isSmartCase) {
                if (contentPattern.isRegExp) {
                    // Consider it case sensitive if it contains an unescaped capital letter
                    if (strings.containsUppercaseCharacter(contentPattern.pattern, true)) {
                        return true;
                    }
                }
                else if (strings.containsUppercaseCharacter(contentPattern.pattern)) {
                    return true;
                }
            }
            return !!contentPattern.isCaseSensitive;
        }
        isMultiline(contentPattern) {
            if (contentPattern.isMultiline) {
                return true;
            }
            if (contentPattern.isRegExp && (0, textModelSearch_1.isMultilineRegexSource)(contentPattern.pattern)) {
                return true;
            }
            if (contentPattern.pattern.indexOf('\n') >= 0) {
                return true;
            }
            return !!contentPattern.isMultiline;
        }
        /**
         * Take the includePattern as seen in the search viewlet, and split into components that look like searchPaths, and
         * glob patterns. Glob patterns are expanded from 'foo/bar' to '{foo/bar/**, **\/foo/bar}.
         *
         * Public for test.
         */
        parseSearchPaths(pattern) {
            const isSearchPath = (segment) => {
                // A segment is a search path if it is an absolute path or starts with ./, ../, .\, or ..\
                return path.isAbsolute(segment) || /^\.\.?([\/\\]|$)/.test(segment);
            };
            const patterns = Array.isArray(pattern) ? pattern : splitGlobPattern(pattern);
            const segments = patterns
                .map(segment => {
                const userHome = this.pathService.resolvedUserHome;
                if (userHome) {
                    return (0, labels_1.untildify)(segment, userHome.scheme === network_1.Schemas.file ? userHome.fsPath : userHome.path);
                }
                return segment;
            });
            const groups = collections.groupBy(segments, segment => isSearchPath(segment) ? 'searchPaths' : 'exprSegments');
            const expandedExprSegments = (groups.exprSegments || [])
                .map(s => strings.rtrim(s, '/'))
                .map(s => strings.rtrim(s, '\\'))
                .map(p => {
                if (p[0] === '.') {
                    p = '*' + p; // convert ".js" to "*.js"
                }
                return expandGlobalGlob(p);
            });
            const result = {};
            const searchPaths = this.expandSearchPathPatterns(groups.searchPaths || []);
            if (searchPaths && searchPaths.length) {
                result.searchPaths = searchPaths;
            }
            const exprSegments = arrays.flatten(expandedExprSegments);
            const includePattern = patternListToIExpression(...exprSegments);
            if (includePattern) {
                result.pattern = includePattern;
            }
            return result;
        }
        getExcludesForFolder(folderConfig, options) {
            return options.disregardExcludeSettings ?
                undefined :
                (0, search_1.getExcludes)(folderConfig, !options.disregardSearchExcludeSettings);
        }
        /**
         * Split search paths (./ or ../ or absolute paths in the includePatterns) into absolute paths and globs applied to those paths
         */
        expandSearchPathPatterns(searchPaths) {
            if (!searchPaths || !searchPaths.length) {
                // No workspace => ignore search paths
                return [];
            }
            const expandedSearchPaths = searchPaths.flatMap(searchPath => {
                // 1 open folder => just resolve the search paths to absolute paths
                let { pathPortion, globPortion } = splitGlobFromPath(searchPath);
                if (globPortion) {
                    globPortion = normalizeGlobPattern(globPortion);
                }
                // One pathPortion to multiple expanded search paths (e.g. duplicate matching workspace folders)
                const oneExpanded = this.expandOneSearchPath(pathPortion);
                // Expanded search paths to multiple resolved patterns (with ** and without)
                return oneExpanded.flatMap(oneExpandedResult => this.resolveOneSearchPathPattern(oneExpandedResult, globPortion));
            });
            const searchPathPatternMap = new Map();
            expandedSearchPaths.forEach(oneSearchPathPattern => {
                const key = oneSearchPathPattern.searchPath.toString();
                const existing = searchPathPatternMap.get(key);
                if (existing) {
                    if (oneSearchPathPattern.pattern) {
                        existing.pattern = existing.pattern || {};
                        existing.pattern[oneSearchPathPattern.pattern] = true;
                    }
                }
                else {
                    searchPathPatternMap.set(key, {
                        searchPath: oneSearchPathPattern.searchPath,
                        pattern: oneSearchPathPattern.pattern ? patternListToIExpression(oneSearchPathPattern.pattern) : undefined
                    });
                }
            });
            return Array.from(searchPathPatternMap.values());
        }
        /**
         * Takes a searchPath like `./a/foo` or `../a/foo` and expands it to absolute paths for all the workspaces it matches.
         */
        expandOneSearchPath(searchPath) {
            if (path.isAbsolute(searchPath)) {
                const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
                if (workspaceFolders[0] && workspaceFolders[0].uri.scheme !== network_1.Schemas.file) {
                    return [{
                            searchPath: workspaceFolders[0].uri.with({ path: searchPath })
                        }];
                }
                // Currently only local resources can be searched for with absolute search paths.
                // TODO convert this to a workspace folder + pattern, so excludes will be resolved properly for an absolute path inside a workspace folder
                return [{
                        searchPath: uri_1.URI.file(path.normalize(searchPath))
                    }];
            }
            if (this.workspaceContextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceUri = this.workspaceContextService.getWorkspace().folders[0].uri;
                searchPath = normalizeSlashes(searchPath);
                if (searchPath.startsWith('../') || searchPath === '..') {
                    const resolvedPath = path.posix.resolve(workspaceUri.path, searchPath);
                    return [{
                            searchPath: workspaceUri.with({ path: resolvedPath })
                        }];
                }
                const cleanedPattern = normalizeGlobPattern(searchPath);
                return [{
                        searchPath: workspaceUri,
                        pattern: cleanedPattern
                    }];
            }
            else if (searchPath === './' || searchPath === '.\\') {
                return []; // ./ or ./**/foo makes sense for single-folder but not multi-folder workspaces
            }
            else {
                const searchPathWithoutDotSlash = searchPath.replace(/^\.[\/\\]/, '');
                const folders = this.workspaceContextService.getWorkspace().folders;
                const folderMatches = folders.map(folder => {
                    const match = searchPathWithoutDotSlash.match(new RegExp(`^${strings.escapeRegExpCharacters(folder.name)}(?:/(.*)|$)`));
                    return match ? {
                        match,
                        folder
                    } : null;
                }).filter(types_1.isDefined);
                if (folderMatches.length) {
                    return folderMatches.map(match => {
                        const patternMatch = match.match[1];
                        return {
                            searchPath: match.folder.uri,
                            pattern: patternMatch && normalizeGlobPattern(patternMatch)
                        };
                    });
                }
                else {
                    const probableWorkspaceFolderNameMatch = searchPath.match(/\.[\/\\](.+)[\/\\]?/);
                    const probableWorkspaceFolderName = probableWorkspaceFolderNameMatch ? probableWorkspaceFolderNameMatch[1] : searchPath;
                    // No root folder with name
                    const searchPathNotFoundError = nls.localize('search.noWorkspaceWithName', "Workspace folder does not exist: {0}", probableWorkspaceFolderName);
                    throw new Error(searchPathNotFoundError);
                }
            }
        }
        resolveOneSearchPathPattern(oneExpandedResult, globPortion) {
            const pattern = oneExpandedResult.pattern && globPortion ?
                `${oneExpandedResult.pattern}/${globPortion}` :
                oneExpandedResult.pattern || globPortion;
            const results = [
                {
                    searchPath: oneExpandedResult.searchPath,
                    pattern
                }
            ];
            if (pattern && !pattern.endsWith('**')) {
                results.push({
                    searchPath: oneExpandedResult.searchPath,
                    pattern: pattern + '/**'
                });
            }
            return results;
        }
        getFolderQueryForSearchPath(searchPath, options, searchPathExcludes) {
            const rootConfig = this.getFolderQueryForRoot((0, workspace_1.toWorkspaceFolder)(searchPath.searchPath), options, searchPathExcludes, false);
            if (!rootConfig) {
                return null;
            }
            return {
                ...rootConfig,
                ...{
                    includePattern: searchPath.pattern
                }
            };
        }
        getFolderQueryForRoot(folder, options, searchPathExcludes, includeFolderName) {
            let thisFolderExcludeSearchPathPattern;
            const folderUri = uri_1.URI.isUri(folder) ? folder : folder.uri;
            if (searchPathExcludes.searchPaths) {
                const thisFolderExcludeSearchPath = searchPathExcludes.searchPaths.filter(sp => (0, resources_1.isEqual)(sp.searchPath, folderUri))[0];
                if (thisFolderExcludeSearchPath && !thisFolderExcludeSearchPath.pattern) {
                    // entire folder is excluded
                    return null;
                }
                else if (thisFolderExcludeSearchPath) {
                    thisFolderExcludeSearchPathPattern = thisFolderExcludeSearchPath.pattern;
                }
            }
            const folderConfig = this.configurationService.getValue({ resource: folderUri });
            const settingExcludes = this.getExcludesForFolder(folderConfig, options);
            const excludePattern = {
                ...(settingExcludes || {}),
                ...(thisFolderExcludeSearchPathPattern || {})
            };
            const folderName = uri_1.URI.isUri(folder) ? (0, resources_1.basename)(folder) : folder.name;
            return {
                folder: folderUri,
                folderName: includeFolderName ? folderName : undefined,
                excludePattern: Object.keys(excludePattern).length > 0 ? excludePattern : undefined,
                fileEncoding: folderConfig.files && folderConfig.files.encoding,
                disregardIgnoreFiles: typeof options.disregardIgnoreFiles === 'boolean' ? options.disregardIgnoreFiles : !folderConfig.search.useIgnoreFiles,
                disregardGlobalIgnoreFiles: typeof options.disregardGlobalIgnoreFiles === 'boolean' ? options.disregardGlobalIgnoreFiles : !folderConfig.search.useGlobalIgnoreFiles,
                disregardParentIgnoreFiles: typeof options.disregardParentIgnoreFiles === 'boolean' ? options.disregardParentIgnoreFiles : !folderConfig.search.useParentIgnoreFiles,
                ignoreSymlinks: typeof options.ignoreSymlinks === 'boolean' ? options.ignoreSymlinks : !folderConfig.search.followSymlinks,
            };
        }
    };
    exports.QueryBuilder = QueryBuilder;
    exports.QueryBuilder = QueryBuilder = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, log_1.ILogService),
        __param(4, pathService_1.IPathService)
    ], QueryBuilder);
    function splitGlobFromPath(searchPath) {
        const globCharMatch = searchPath.match(/[\*\{\}\(\)\[\]\?]/);
        if (globCharMatch) {
            const globCharIdx = globCharMatch.index;
            const lastSlashMatch = searchPath.substr(0, globCharIdx).match(/[/|\\][^/\\]*$/);
            if (lastSlashMatch) {
                let pathPortion = searchPath.substr(0, lastSlashMatch.index);
                if (!pathPortion.match(/[/\\]/)) {
                    // If the last slash was the only slash, then we now have '' or 'C:' or '.'. Append a slash.
                    pathPortion += '/';
                }
                return {
                    pathPortion,
                    globPortion: searchPath.substr((lastSlashMatch.index || 0) + 1)
                };
            }
        }
        // No glob char, or malformed
        return {
            pathPortion: searchPath
        };
    }
    function patternListToIExpression(...patterns) {
        return patterns.length ?
            patterns.reduce((glob, cur) => { glob[cur] = true; return glob; }, Object.create(null)) :
            undefined;
    }
    function splitGlobPattern(pattern) {
        return glob.splitGlobAware(pattern, ',')
            .map(s => s.trim())
            .filter(s => !!s.length);
    }
    /**
     * Note - we used {} here previously but ripgrep can't handle nested {} patterns. See https://github.com/microsoft/vscode/issues/32761
     */
    function expandGlobalGlob(pattern) {
        const patterns = [
            `**/${pattern}/**`,
            `**/${pattern}`
        ];
        return patterns.map(p => p.replace(/\*\*\/\*\*/g, '**'));
    }
    function normalizeSlashes(pattern) {
        return pattern.replace(/\\/g, '/');
    }
    /**
     * Normalize slashes, remove `./` and trailing slashes
     */
    function normalizeGlobPattern(pattern) {
        return normalizeSlashes(pattern)
            .replace(/^\.\//, '')
            .replace(/\/+$/g, '');
    }
    /**
     * Escapes a path for use as a glob pattern that would match the input precisely.
     * Characters '?', '*', '[', and ']' are escaped into character range glob syntax
     * (for example, '?' becomes '[?]').
     * NOTE: This implementation makes no special cases for UNC paths. For example,
     * given the input "//?/C:/A?.txt", this would produce output '//[?]/C:/A[?].txt',
     * which may not be desirable in some cases. Use with caution if UNC paths could be expected.
     */
    function escapeGlobPattern(path) {
        return path.replace(/([?*[\]])/g, '[$1]');
    }
    /**
     * Construct an include pattern from a list of folders uris to search in.
     */
    function resolveResourcesForSearchIncludes(resources, contextService) {
        resources = arrays.distinct(resources, resource => resource.toString());
        const folderPaths = [];
        const workspace = contextService.getWorkspace();
        if (resources) {
            resources.forEach(resource => {
                let folderPath;
                if (contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    // Show relative path from the root for single-root mode
                    folderPath = (0, resources_1.relativePath)(workspace.folders[0].uri, resource); // always uses forward slashes
                    if (folderPath && folderPath !== '.') {
                        folderPath = './' + folderPath;
                    }
                }
                else {
                    const owningFolder = contextService.getWorkspaceFolder(resource);
                    if (owningFolder) {
                        const owningRootName = owningFolder.name;
                        // If this root is the only one with its basename, use a relative ./ path. If there is another, use an absolute path
                        const isUniqueFolder = workspace.folders.filter(folder => folder.name === owningRootName).length === 1;
                        if (isUniqueFolder) {
                            const relPath = (0, resources_1.relativePath)(owningFolder.uri, resource); // always uses forward slashes
                            if (relPath === '') {
                                folderPath = `./${owningFolder.name}`;
                            }
                            else {
                                folderPath = `./${owningFolder.name}/${relPath}`;
                            }
                        }
                        else {
                            folderPath = resource.fsPath; // TODO rob: handle non-file URIs
                        }
                    }
                }
                if (folderPath) {
                    folderPaths.push(escapeGlobPattern(folderPath));
                }
            });
        }
        return folderPaths;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL2NvbW1vbi9xdWVyeUJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcW5CaEcsOEVBd0NDO0lBcmtCTSxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO1FBRXhCLFlBQ3lDLG9CQUEyQyxFQUN4Qyx1QkFBaUQsRUFDckQsbUJBQXlDLEVBQ2xELFVBQXVCLEVBQ3RCLFdBQXlCO1lBSmhCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDeEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNyRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ2xELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdEIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7UUFFekQsQ0FBQztRQUVELElBQUksQ0FBQyxjQUE0QixFQUFFLGVBQXVCLEVBQUUsVUFBb0MsRUFBRTtZQUNqRyxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNqRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUF3QixDQUFDO1lBRWhGLE1BQU0sY0FBYyxHQUFHLGVBQWUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN2RSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUF1QixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsNkJBQWlCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2RixPQUFtQjtnQkFDbEIsR0FBRyxXQUFXO2dCQUNkLElBQUksd0JBQWdCO2dCQUNwQixjQUFjO2dCQUNkLGNBQWMsRUFBRSxPQUFPLENBQUMsY0FBYztnQkFDdEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO2dCQUNoQyxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksY0FBYyxJQUFJLEtBQUs7Z0JBQ2pFLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYTtnQkFDcEMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxZQUFZO2dCQUNsQyxrQ0FBa0MsRUFBRSxPQUFPLENBQUMsd0JBQXdCLElBQUksT0FBTyxDQUFDLG9CQUFvQjthQUVwRyxDQUFDO1FBQ0gsQ0FBQztRQUVEOztXQUVHO1FBQ0ssaUJBQWlCLENBQUMsWUFBMEIsRUFBRSxPQUFpQztZQUN0RixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUF3QixDQUFDO1lBRWhGLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMzQixZQUFZLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUc7Z0JBQ2xCLEdBQUcsWUFBWTtnQkFDZixjQUFjLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxjQUFjO2FBQ2xELENBQUM7WUFFRixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pELFVBQVUsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ25DLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDcEMsVUFBVSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDL0IsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzlCLFVBQVUsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO2dCQUM5QixDQUFDO2dCQUNELFVBQVUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1lBQ3JHLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUM5QixVQUFVLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxVQUFVLENBQUMsWUFBWSxDQUFDLDJCQUEyQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQztZQUN6RyxDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDOUIsVUFBVSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsVUFBVSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUM7WUFDL0YsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUM5QixVQUFVLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxVQUFVLENBQUMsWUFBWSxDQUFDLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUM7WUFDN0YsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBdUMsRUFBRSxVQUFvQyxFQUFFO1lBQ25GLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELE9BQW1CO2dCQUNsQixHQUFHLFdBQVc7Z0JBQ2QsSUFBSSx3QkFBZ0I7Z0JBQ3BCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztvQkFDL0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFO29CQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVc7Z0JBQ3RCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtnQkFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO2dCQUNoQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7Z0JBQzFCLDBCQUEwQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0I7YUFDcEQsQ0FBQztRQUNILENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxPQUFzQyxFQUFFLGNBQW1DO1lBQ3ZHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3RixPQUFPLGNBQWM7Z0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM3RixDQUFDO1FBRU8sV0FBVyxDQUFDLGtCQUFrRCxFQUFFLEVBQUUsVUFBc0MsRUFBRTtZQUNqSCxNQUFNLHNCQUFzQixHQUFxQixJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0gsTUFBTSxzQkFBc0IsR0FBcUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTNILDRFQUE0RTtZQUM1RSxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sYUFBYSxHQUFHLENBQUMsc0JBQXNCLENBQUMsV0FBVyxJQUFJLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdkcsc0JBQXNCLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNySSxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2lCQUNySCxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFtQixDQUFDO1lBRTdDLE1BQU0sVUFBVSxHQUEyQjtnQkFDMUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2dCQUN4QixhQUFhO2dCQUNiLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLFdBQVcsSUFBSSxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO2dCQUNyRyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsa0JBQWtCO2dCQUU5QyxjQUFjLEVBQUUsc0JBQXNCLENBQUMsT0FBTztnQkFDOUMsY0FBYyxFQUFFLHNCQUFzQixDQUFDLE9BQU87Z0JBQzlDLGVBQWUsRUFBRSxPQUFPLENBQUMsZUFBZTtnQkFDeEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO2FBQzlCLENBQUM7WUFFRixJQUFJLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hKLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDakcsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3hHLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQy9FLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUM1RyxPQUFPLEVBQUUsR0FBRyxVQUFVLEVBQUUsR0FBRyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BELENBQUM7WUFFRCw2SEFBNkg7WUFDN0gsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUEsNEJBQW1CLEVBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzNKLFVBQVUsQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFFakgsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVPLHVCQUF1QixDQUFDLEtBQVk7WUFDM0MsTUFBTSxhQUFhLEdBQW1CLEVBQUUsQ0FBQztZQUN6QyxNQUFNLGVBQWUsR0FBOEIsSUFBSSxpQkFBVyxFQUFFLENBQUM7WUFDckUsTUFBTSxjQUFjLEdBQXFCLEVBQUUsQ0FBQztZQUM1QyxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDNUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQUMsT0FBTztnQkFBQyxDQUFDO2dCQUVwRCxNQUFNLGNBQWMsR0FBRyxJQUFBLDBCQUFjLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLDJGQUEyRjtnQkFDM0YsSUFBSSxjQUFjLEVBQUUsQ0FBQztvQkFDcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFFaEksSUFBSSxXQUFXLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNsQixlQUFlLEdBQUcsSUFBSSxDQUFDO3dCQUN2QixXQUFXLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUUsQ0FBQzt3QkFDekQsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDaEMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQzlDLENBQUM7b0JBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDOUQsSUFBQSx1QkFBZSxFQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDakYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNqQixlQUFlLEdBQUcsSUFBSSxDQUFDO3dCQUN2QixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPO2dCQUNOLGFBQWE7Z0JBQ2IsY0FBYztnQkFDZCxnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTthQUM5RCxDQUFDO1FBQ0gsQ0FBQztRQUVEOztXQUVHO1FBQ0ssZUFBZSxDQUFDLGNBQTRCLEVBQUUsT0FBaUM7WUFDdEYsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUM3Qix3RUFBd0U7b0JBQ3hFLElBQUksT0FBTyxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEUsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksT0FBTyxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN2RSxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7UUFDekMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxjQUE0QjtZQUMvQyxJQUFJLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxjQUFjLENBQUMsUUFBUSxJQUFJLElBQUEsd0NBQXNCLEVBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQy9FLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUM7UUFDckMsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsZ0JBQWdCLENBQUMsT0FBMEI7WUFDMUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFlLEVBQUUsRUFBRTtnQkFDeEMsMEZBQTBGO2dCQUMxRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JFLENBQUMsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUUsTUFBTSxRQUFRLEdBQUcsUUFBUTtpQkFDdkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNkLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ25ELElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsT0FBTyxJQUFBLGtCQUFTLEVBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0YsQ0FBQztnQkFFRCxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztZQUNKLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUMxQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVwRSxNQUFNLG9CQUFvQixHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7aUJBQ3RELEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMvQixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDaEMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNSLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO29CQUNsQixDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtnQkFDeEMsQ0FBQztnQkFFRCxPQUFPLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1RSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQ2xDLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDMUQsTUFBTSxjQUFjLEdBQUcsd0JBQXdCLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztZQUNqRSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQztZQUNqQyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sb0JBQW9CLENBQUMsWUFBa0MsRUFBRSxPQUFtQztZQUNuRyxPQUFPLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUN4QyxTQUFTLENBQUMsQ0FBQztnQkFDWCxJQUFBLG9CQUFXLEVBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVEOztXQUVHO1FBQ0ssd0JBQXdCLENBQUMsV0FBcUI7WUFDckQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekMsc0NBQXNDO2dCQUN0QyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQzVELG1FQUFtRTtnQkFDbkUsSUFBSSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFakUsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsV0FBVyxHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO2dCQUVELGdHQUFnRztnQkFDaEcsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUUxRCw0RUFBNEU7Z0JBQzVFLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDbkgsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1lBQ25FLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO2dCQUNsRCxNQUFNLEdBQUcsR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sUUFBUSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxJQUFJLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsQyxRQUFRLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO3dCQUMxQyxRQUFRLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDdkQsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1Asb0JBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTt3QkFDN0IsVUFBVSxFQUFFLG9CQUFvQixDQUFDLFVBQVU7d0JBQzNDLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO3FCQUMxRyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVEOztXQUVHO1FBQ0ssbUJBQW1CLENBQUMsVUFBa0I7WUFDN0MsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztnQkFDN0UsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzVFLE9BQU8sQ0FBQzs0QkFDUCxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQzt5QkFDOUQsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsaUZBQWlGO2dCQUNqRiwwSUFBMEk7Z0JBQzFJLE9BQU8sQ0FBQzt3QkFDUCxVQUFVLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUNoRCxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCLEVBQUUsa0NBQTBCLEVBQUUsQ0FBQztnQkFDaEYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0JBRWhGLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDekQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDdkUsT0FBTyxDQUFDOzRCQUNQLFVBQVUsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDO3lCQUNyRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxDQUFDO3dCQUNQLFVBQVUsRUFBRSxZQUFZO3dCQUN4QixPQUFPLEVBQUUsY0FBYztxQkFDdkIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxJQUFJLFVBQVUsS0FBSyxJQUFJLElBQUksVUFBVSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN4RCxPQUFPLEVBQUUsQ0FBQyxDQUFDLCtFQUErRTtZQUMzRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSx5QkFBeUIsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQztnQkFDcEUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxLQUFLLEdBQUcseUJBQXlCLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDeEgsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUNkLEtBQUs7d0JBQ0wsTUFBTTtxQkFDTixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ1YsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFTLENBQUMsQ0FBQztnQkFFckIsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQzFCLE9BQU8sYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDaEMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEMsT0FBTzs0QkFDTixVQUFVLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHOzRCQUM1QixPQUFPLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixDQUFDLFlBQVksQ0FBQzt5QkFDM0QsQ0FBQztvQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxnQ0FBZ0MsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7b0JBQ2pGLE1BQU0sMkJBQTJCLEdBQUcsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7b0JBRXhILDJCQUEyQjtvQkFDM0IsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHNDQUFzQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7b0JBQ2hKLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sMkJBQTJCLENBQUMsaUJBQXdDLEVBQUUsV0FBb0I7WUFDakcsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDO2dCQUN6RCxHQUFHLGlCQUFpQixDQUFDLE9BQU8sSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxpQkFBaUIsQ0FBQyxPQUFPLElBQUksV0FBVyxDQUFDO1lBRTFDLE1BQU0sT0FBTyxHQUFHO2dCQUNmO29CQUNDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxVQUFVO29CQUN4QyxPQUFPO2lCQUNQO2FBQUMsQ0FBQztZQUVKLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNaLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxVQUFVO29CQUN4QyxPQUFPLEVBQUUsT0FBTyxHQUFHLEtBQUs7aUJBQ3hCLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRU8sMkJBQTJCLENBQUMsVUFBOEIsRUFBRSxPQUFtQyxFQUFFLGtCQUFvQztZQUM1SSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBQSw2QkFBaUIsRUFBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTztnQkFDTixHQUFHLFVBQVU7Z0JBQ2IsR0FBRztvQkFDRixjQUFjLEVBQUUsVUFBVSxDQUFDLE9BQU87aUJBQ2xDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxNQUFvQyxFQUFFLE9BQW1DLEVBQUUsa0JBQW9DLEVBQUUsaUJBQTBCO1lBQ3hLLElBQUksa0NBQWdFLENBQUM7WUFDckUsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQzFELElBQUksa0JBQWtCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUEsbUJBQU8sRUFBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RILElBQUksMkJBQTJCLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDekUsNEJBQTRCO29CQUM1QixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO3FCQUFNLElBQUksMkJBQTJCLEVBQUUsQ0FBQztvQkFDeEMsa0NBQWtDLEdBQUcsMkJBQTJCLENBQUMsT0FBTyxDQUFDO2dCQUMxRSxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQXVCLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDdkcsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLGNBQWMsR0FBcUI7Z0JBQ3hDLEdBQUcsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDO2dCQUMxQixHQUFHLENBQUMsa0NBQWtDLElBQUksRUFBRSxDQUFDO2FBQzdDLENBQUM7WUFFRixNQUFNLFVBQVUsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDdEUsT0FBcUI7Z0JBQ3BCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDdEQsY0FBYyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUNuRixZQUFZLEVBQUUsWUFBWSxDQUFDLEtBQUssSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVE7Z0JBQy9ELG9CQUFvQixFQUFFLE9BQU8sT0FBTyxDQUFDLG9CQUFvQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsY0FBYztnQkFDNUksMEJBQTBCLEVBQUUsT0FBTyxPQUFPLENBQUMsMEJBQTBCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0I7Z0JBQ3BLLDBCQUEwQixFQUFFLE9BQU8sT0FBTyxDQUFDLDBCQUEwQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsb0JBQW9CO2dCQUNwSyxjQUFjLEVBQUUsT0FBTyxPQUFPLENBQUMsY0FBYyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLGNBQWM7YUFDMUgsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBOWNZLG9DQUFZOzJCQUFaLFlBQVk7UUFHdEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsMENBQW9CLENBQUE7UUFDcEIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSwwQkFBWSxDQUFBO09BUEYsWUFBWSxDQThjeEI7SUFFRCxTQUFTLGlCQUFpQixDQUFDLFVBQWtCO1FBQzVDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM3RCxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ25CLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFDeEMsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDakYsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNqQyw0RkFBNEY7b0JBQzVGLFdBQVcsSUFBSSxHQUFHLENBQUM7Z0JBQ3BCLENBQUM7Z0JBRUQsT0FBTztvQkFDTixXQUFXO29CQUNYLFdBQVcsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQy9ELENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixPQUFPO1lBQ04sV0FBVyxFQUFFLFVBQVU7U0FDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLEdBQUcsUUFBa0I7UUFDdEQsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixTQUFTLENBQUM7SUFDWixDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFlO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDO2FBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNsQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsZ0JBQWdCLENBQUMsT0FBZTtRQUN4QyxNQUFNLFFBQVEsR0FBRztZQUNoQixNQUFNLE9BQU8sS0FBSztZQUNsQixNQUFNLE9BQU8sRUFBRTtTQUNmLENBQUM7UUFFRixPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLE9BQWU7UUFDeEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLG9CQUFvQixDQUFDLE9BQWU7UUFDNUMsT0FBTyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7YUFDOUIsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7YUFDcEIsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILFNBQVMsaUJBQWlCLENBQUMsSUFBWTtRQUN0QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLGlDQUFpQyxDQUFDLFNBQWdCLEVBQUUsY0FBd0M7UUFDM0csU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFeEUsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVoRCxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2YsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDNUIsSUFBSSxVQUE4QixDQUFDO2dCQUNuQyxJQUFJLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxrQ0FBMEIsRUFBRSxDQUFDO29CQUNsRSx3REFBd0Q7b0JBQ3hELFVBQVUsR0FBRyxJQUFBLHdCQUFZLEVBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7b0JBQzdGLElBQUksVUFBVSxJQUFJLFVBQVUsS0FBSyxHQUFHLEVBQUUsQ0FBQzt3QkFDdEMsVUFBVSxHQUFHLElBQUksR0FBRyxVQUFVLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDakUsSUFBSSxZQUFZLEVBQUUsQ0FBQzt3QkFDbEIsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQzt3QkFDekMsb0hBQW9IO3dCQUNwSCxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQzt3QkFDdkcsSUFBSSxjQUFjLEVBQUUsQ0FBQzs0QkFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBQSx3QkFBWSxFQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7NEJBQ3hGLElBQUksT0FBTyxLQUFLLEVBQUUsRUFBRSxDQUFDO2dDQUNwQixVQUFVLEdBQUcsS0FBSyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQ3ZDLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxVQUFVLEdBQUcsS0FBSyxZQUFZLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBRSxDQUFDOzRCQUNsRCxDQUFDO3dCQUNGLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxVQUFVLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGlDQUFpQzt3QkFDaEUsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDaEIsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQyJ9
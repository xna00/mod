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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/network", "vs/base/common/map", "vs/base/common/extpath"], function (require, exports, uri_1, objects_1, path_1, event_1, resources_1, lifecycle_1, glob_1, workspace_1, configuration_1, network_1, map_1, extpath_1) {
    "use strict";
    var ResourceGlobMatcher_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceGlobMatcher = void 0;
    let ResourceGlobMatcher = class ResourceGlobMatcher extends lifecycle_1.Disposable {
        static { ResourceGlobMatcher_1 = this; }
        static { this.NO_FOLDER = null; }
        constructor(getExpression, shouldUpdate, contextService, configurationService) {
            super();
            this.getExpression = getExpression;
            this.shouldUpdate = shouldUpdate;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this._onExpressionChange = this._register(new event_1.Emitter());
            this.onExpressionChange = this._onExpressionChange.event;
            this.mapFolderToParsedExpression = new Map();
            this.mapFolderToConfiguredExpression = new Map();
            this.updateExpressions(false);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.shouldUpdate(e)) {
                    this.updateExpressions(true);
                }
            }));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateExpressions(true)));
        }
        updateExpressions(fromEvent) {
            let changed = false;
            // Add expressions per workspaces that got added
            for (const folder of this.contextService.getWorkspace().folders) {
                const folderUriStr = folder.uri.toString();
                const newExpression = this.doGetExpression(folder.uri);
                const currentExpression = this.mapFolderToConfiguredExpression.get(folderUriStr);
                if (newExpression) {
                    if (!currentExpression || !(0, objects_1.equals)(currentExpression.expression, newExpression.expression)) {
                        changed = true;
                        this.mapFolderToParsedExpression.set(folderUriStr, (0, glob_1.parse)(newExpression.expression));
                        this.mapFolderToConfiguredExpression.set(folderUriStr, newExpression);
                    }
                }
                else {
                    if (currentExpression) {
                        changed = true;
                        this.mapFolderToParsedExpression.delete(folderUriStr);
                        this.mapFolderToConfiguredExpression.delete(folderUriStr);
                    }
                }
            }
            // Remove expressions per workspace no longer present
            const foldersMap = new map_1.ResourceSet(this.contextService.getWorkspace().folders.map(folder => folder.uri));
            for (const [folder] of this.mapFolderToConfiguredExpression) {
                if (folder === ResourceGlobMatcher_1.NO_FOLDER) {
                    continue; // always keep this one
                }
                if (!foldersMap.has(uri_1.URI.parse(folder))) {
                    this.mapFolderToParsedExpression.delete(folder);
                    this.mapFolderToConfiguredExpression.delete(folder);
                    changed = true;
                }
            }
            // Always set for resources outside workspace as well
            const globalNewExpression = this.doGetExpression(undefined);
            const globalCurrentExpression = this.mapFolderToConfiguredExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
            if (globalNewExpression) {
                if (!globalCurrentExpression || !(0, objects_1.equals)(globalCurrentExpression.expression, globalNewExpression.expression)) {
                    changed = true;
                    this.mapFolderToParsedExpression.set(ResourceGlobMatcher_1.NO_FOLDER, (0, glob_1.parse)(globalNewExpression.expression));
                    this.mapFolderToConfiguredExpression.set(ResourceGlobMatcher_1.NO_FOLDER, globalNewExpression);
                }
            }
            else {
                if (globalCurrentExpression) {
                    changed = true;
                    this.mapFolderToParsedExpression.delete(ResourceGlobMatcher_1.NO_FOLDER);
                    this.mapFolderToConfiguredExpression.delete(ResourceGlobMatcher_1.NO_FOLDER);
                }
            }
            if (fromEvent && changed) {
                this._onExpressionChange.fire();
            }
        }
        doGetExpression(resource) {
            const expression = this.getExpression(resource);
            if (!expression) {
                return undefined;
            }
            const keys = Object.keys(expression);
            if (keys.length === 0) {
                return undefined;
            }
            let hasAbsolutePath = false;
            // Check the expression for absolute paths/globs
            // and specifically for Windows, make sure the
            // drive letter is lowercased, because we later
            // check with `URI.fsPath` which is always putting
            // the drive letter lowercased.
            const massagedExpression = Object.create(null);
            for (const key of keys) {
                if (!hasAbsolutePath) {
                    hasAbsolutePath = (0, path_1.isAbsolute)(key);
                }
                let massagedKey = key;
                const driveLetter = (0, extpath_1.getDriveLetter)(massagedKey, true /* probe for windows */);
                if (driveLetter) {
                    const driveLetterLower = driveLetter.toLowerCase();
                    if (driveLetter !== driveLetter.toLowerCase()) {
                        massagedKey = `${driveLetterLower}${massagedKey.substring(1)}`;
                    }
                }
                massagedExpression[massagedKey] = expression[key];
            }
            return {
                expression: massagedExpression,
                hasAbsolutePath
            };
        }
        matches(resource, hasSibling) {
            if (this.mapFolderToParsedExpression.size === 0) {
                return false; // return early: no expression for this matcher
            }
            const folder = this.contextService.getWorkspaceFolder(resource);
            let expressionForFolder;
            let expressionConfigForFolder;
            if (folder && this.mapFolderToParsedExpression.has(folder.uri.toString())) {
                expressionForFolder = this.mapFolderToParsedExpression.get(folder.uri.toString());
                expressionConfigForFolder = this.mapFolderToConfiguredExpression.get(folder.uri.toString());
            }
            else {
                expressionForFolder = this.mapFolderToParsedExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
                expressionConfigForFolder = this.mapFolderToConfiguredExpression.get(ResourceGlobMatcher_1.NO_FOLDER);
            }
            if (!expressionForFolder) {
                return false; // return early: no expression for this resource
            }
            // If the resource if from a workspace, convert its absolute path to a relative
            // path so that glob patterns have a higher probability to match. For example
            // a glob pattern of "src/**" will not match on an absolute path "/folder/src/file.txt"
            // but can match on "src/file.txt"
            let resourcePathToMatch;
            if (folder) {
                resourcePathToMatch = (0, resources_1.relativePath)(folder.uri, resource);
            }
            else {
                resourcePathToMatch = this.uriToPath(resource);
            }
            if (typeof resourcePathToMatch === 'string' && !!expressionForFolder(resourcePathToMatch, undefined, hasSibling)) {
                return true;
            }
            // If the configured expression has an absolute path, we also check for absolute paths
            // to match, otherwise we potentially miss out on matches. We only do that if we previously
            // matched on the relative path.
            if (resourcePathToMatch !== this.uriToPath(resource) && expressionConfigForFolder?.hasAbsolutePath) {
                return !!expressionForFolder(this.uriToPath(resource), undefined, hasSibling);
            }
            return false;
        }
        uriToPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return uri.fsPath;
            }
            return uri.path;
        }
    };
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
    exports.ResourceGlobMatcher = ResourceGlobMatcher = ResourceGlobMatcher_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService)
    ], ResourceGlobMatcher);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL3Jlc291cmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVOztpQkFFMUIsY0FBUyxHQUFHLElBQUksQUFBUCxDQUFRO1FBUXpDLFlBQ1MsYUFBd0QsRUFDeEQsWUFBMkQsRUFDekMsY0FBeUQsRUFDNUQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBTEEsa0JBQWEsR0FBYixhQUFhLENBQTJDO1lBQ3hELGlCQUFZLEdBQVosWUFBWSxDQUErQztZQUN4QixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVZuRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNsRSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRTVDLGdDQUEyQixHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBQ3pFLG9DQUErQixHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO1lBVWxHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU5QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDMUIs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
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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/services/outline/browser/outline"], function (require, exports, cancellation_1, errors_1, event_1, lifecycle_1, network_1, resources_1, configuration_1, files_1, workspace_1, breadcrumbs_1, outline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsModel = exports.OutlineElement2 = exports.FileElement = void 0;
    class FileElement {
        constructor(uri, kind) {
            this.uri = uri;
            this.kind = kind;
        }
    }
    exports.FileElement = FileElement;
    class OutlineElement2 {
        constructor(element, outline) {
            this.element = element;
            this.outline = outline;
        }
    }
    exports.OutlineElement2 = OutlineElement2;
    let BreadcrumbsModel = class BreadcrumbsModel {
        constructor(resource, editor, configurationService, _workspaceService, _outlineService) {
            this.resource = resource;
            this._workspaceService = _workspaceService;
            this._outlineService = _outlineService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._currentOutline = new lifecycle_1.MutableDisposable();
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this._onDidUpdate = new event_1.Emitter();
            this.onDidUpdate = this._onDidUpdate.event;
            this._cfgFilePath = breadcrumbs_1.BreadcrumbsConfig.FilePath.bindTo(configurationService);
            this._cfgSymbolPath = breadcrumbs_1.BreadcrumbsConfig.SymbolPath.bindTo(configurationService);
            this._disposables.add(this._cfgFilePath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._disposables.add(this._cfgSymbolPath.onDidChange(_ => this._onDidUpdate.fire(this)));
            this._workspaceService.onDidChangeWorkspaceFolders(this._onDidChangeWorkspaceFolders, this, this._disposables);
            this._fileInfo = this._initFilePathInfo(resource);
            if (editor) {
                this._bindToEditor(editor);
                this._disposables.add(_outlineService.onDidChange(() => this._bindToEditor(editor)));
                this._disposables.add(editor.onDidChangeControl(() => this._bindToEditor(editor)));
            }
            this._onDidUpdate.fire(this);
        }
        dispose() {
            this._disposables.dispose();
            this._cfgFilePath.dispose();
            this._cfgSymbolPath.dispose();
            this._currentOutline.dispose();
            this._outlineDisposables.dispose();
            this._onDidUpdate.dispose();
        }
        isRelative() {
            return Boolean(this._fileInfo.folder);
        }
        getElements() {
            let result = [];
            // file path elements
            if (this._cfgFilePath.getValue() === 'on') {
                result = result.concat(this._fileInfo.path);
            }
            else if (this._cfgFilePath.getValue() === 'last' && this._fileInfo.path.length > 0) {
                result = result.concat(this._fileInfo.path.slice(-1));
            }
            if (this._cfgSymbolPath.getValue() === 'off') {
                return result;
            }
            if (!this._currentOutline.value) {
                return result;
            }
            const breadcrumbsElements = this._currentOutline.value.config.breadcrumbsDataSource.getBreadcrumbElements();
            for (let i = this._cfgSymbolPath.getValue() === 'last' && breadcrumbsElements.length > 0 ? breadcrumbsElements.length - 1 : 0; i < breadcrumbsElements.length; i++) {
                result.push(new OutlineElement2(breadcrumbsElements[i], this._currentOutline.value));
            }
            if (breadcrumbsElements.length === 0 && !this._currentOutline.value.isEmpty) {
                result.push(new OutlineElement2(this._currentOutline.value, this._currentOutline.value));
            }
            return result;
        }
        _initFilePathInfo(uri) {
            if ((0, network_1.matchesSomeScheme)(uri, network_1.Schemas.untitled, network_1.Schemas.data)) {
                return {
                    folder: undefined,
                    path: []
                };
            }
            const info = {
                folder: this._workspaceService.getWorkspaceFolder(uri) ?? undefined,
                path: []
            };
            let uriPrefix = uri;
            while (uriPrefix && uriPrefix.path !== '/') {
                if (info.folder && (0, resources_1.isEqual)(info.folder.uri, uriPrefix)) {
                    break;
                }
                info.path.unshift(new FileElement(uriPrefix, info.path.length === 0 ? files_1.FileKind.FILE : files_1.FileKind.FOLDER));
                const prevPathLength = uriPrefix.path.length;
                uriPrefix = (0, resources_1.dirname)(uriPrefix);
                if (uriPrefix.path.length === prevPathLength) {
                    break;
                }
            }
            if (info.folder && this._workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                info.path.unshift(new FileElement(info.folder.uri, files_1.FileKind.ROOT_FOLDER));
            }
            return info;
        }
        _onDidChangeWorkspaceFolders() {
            this._fileInfo = this._initFilePathInfo(this.resource);
            this._onDidUpdate.fire(this);
        }
        _bindToEditor(editor) {
            const newCts = new cancellation_1.CancellationTokenSource();
            this._currentOutline.clear();
            this._outlineDisposables.clear();
            this._outlineDisposables.add((0, lifecycle_1.toDisposable)(() => newCts.dispose(true)));
            this._outlineService.createOutline(editor, 2 /* OutlineTarget.Breadcrumbs */, newCts.token).then(outline => {
                if (newCts.token.isCancellationRequested) {
                    // cancelled: dispose new outline and reset
                    outline?.dispose();
                    outline = undefined;
                }
                this._currentOutline.value = outline;
                this._onDidUpdate.fire(this);
                if (outline) {
                    this._outlineDisposables.add(outline.onDidChange(() => this._onDidUpdate.fire(this)));
                }
            }).catch(err => {
                this._onDidUpdate.fire(this);
                (0, errors_1.onUnexpectedError)(err);
            });
        }
    };
    exports.BreadcrumbsModel = BreadcrumbsModel;
    exports.BreadcrumbsModel = BreadcrumbsModel = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, outline_1.IOutlineService)
    ], BreadcrumbsModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2JyZWFkY3J1bWJzTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRyxNQUFhLFdBQVc7UUFDdkIsWUFDVSxHQUFRLEVBQ1IsSUFBYztZQURkLFFBQUcsR0FBSCxHQUFHLENBQUs7WUFDUixTQUFJLEdBQUosSUFBSSxDQUFVO1FBQ3BCLENBQUM7S0FDTDtJQUxELGtDQUtDO0lBSUQsTUFBYSxlQUFlO1FBQzNCLFlBQ1UsT0FBNEIsRUFDNUIsT0FBc0I7WUFEdEIsWUFBTyxHQUFQLE9BQU8sQ0FBcUI7WUFDNUIsWUFBTyxHQUFQLE9BQU8sQ0FBZTtRQUM1QixDQUFDO0tBQ0w7SUFMRCwwQ0FLQztJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBYzVCLFlBQ1UsUUFBYSxFQUN0QixNQUErQixFQUNSLG9CQUEyQyxFQUN4QyxpQkFBNEQsRUFDckUsZUFBaUQ7WUFKekQsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUdxQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQTBCO1lBQ3BELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQWpCbEQsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU1yQyxvQkFBZSxHQUFHLElBQUksNkJBQWlCLEVBQWlCLENBQUM7WUFDekQsd0JBQW1CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFNUMsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzNDLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBUzNELElBQUksQ0FBQyxZQUFZLEdBQUcsK0JBQWlCLENB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
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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditor", "vs/workbench/contrib/webviewPanel/browser/webviewIconManager", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput"], function (require, exports, async_1, cancellation_1, decorators_1, errors_1, event_1, iterator_1, lifecycle_1, contextkey_1, editor_1, instantiation_1, diffEditorInput_1, webview_1, webviewEditor_1, webviewIconManager_1, editorService_1, webviewEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorService = exports.LazilyResolvedWebviewEditorInput = exports.IWebviewWorkbenchService = void 0;
    exports.IWebviewWorkbenchService = (0, instantiation_1.createDecorator)('webviewEditorService');
    function canRevive(reviver, webview) {
        return reviver.canResolve(webview);
    }
    let LazilyResolvedWebviewEditorInput = class LazilyResolvedWebviewEditorInput extends webviewEditorInput_1.WebviewInput {
        constructor(init, webview, _webviewWorkbenchService) {
            super(init, webview, _webviewWorkbenchService.iconManager);
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._resolved = false;
        }
        dispose() {
            super.dispose();
            this._resolvePromise?.cancel();
            this._resolvePromise = undefined;
        }
        async resolve() {
            if (!this._resolved) {
                this._resolved = true;
                this._resolvePromise = (0, async_1.createCancelablePromise)(token => this._webviewWorkbenchService.resolveWebview(this, token));
                try {
                    await this._resolvePromise;
                }
                catch (e) {
                    if (!(0, errors_1.isCancellationError)(e)) {
                        throw e;
                    }
                }
            }
            return super.resolve();
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            other._resolved = this._resolved;
            return other;
        }
    };
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput;
    __decorate([
        decorators_1.memoize
    ], LazilyResolvedWebviewEditorInput.prototype, "resolve", null);
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput = __decorate([
        __param(2, exports.IWebviewWorkbenchService)
    ], LazilyResolvedWebviewEditorInput);
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        enqueueForRestoration(input, token) {
            const promise = new async_1.DeferredPromise();
            const remove = () => {
                const index = this._awaitingRevival.findIndex(entry => input === entry.input);
                if (index >= 0) {
                    this._awaitingRevival.splice(index, 1);
                }
            };
            const disposable = (0, lifecycle_1.combinedDisposable)(input.webview.onDidDispose(remove), token.onCancellationRequested(() => {
                remove();
                promise.cancel();
            }));
            this._awaitingRevival.push({ input, promise, disposable });
            return promise.p;
        }
        reviveFor(reviver, token) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, promise: resolve, disposable } of toRevive) {
                reviver.resolveWebview(input, token).then(x => resolve.complete(x), err => resolve.error(err)).finally(() => {
                    disposable.dispose();
                });
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService extends lifecycle_1.Disposable {
        constructor(contextKeyService, _editorService, _instantiationService, _webviewService) {
            super();
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
            this._onDidChangeActiveWebviewEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveWebviewEditor = this._onDidChangeActiveWebviewEditor.event;
            this._activeWebviewPanelIdContext = webviewEditor_1.CONTEXT_ACTIVE_WEBVIEW_PANEL_ID.bindTo(contextKeyService);
            this._iconManager = this._register(this._instantiationService.createInstance(webviewIconManager_1.WebviewIconManager));
            this._register(_editorService.onDidActiveEditorChange(() => {
                this.updateActiveWebview();
            }));
            // The user may have switched focus between two sides of a diff editor
            this._register(_webviewService.onDidChangeActiveWebview(() => {
                this.updateActiveWebview();
            }));
            this.updateActiveWebview();
        }
        get iconManager() {
            return this._iconManager;
        }
        updateActiveWebview() {
            const activeInput = this._editorService.activeEditor;
            let newActiveWebview;
            if (activeInput instanceof webviewEditorInput_1.WebviewInput) {
                newActiveWebview = activeInput;
            }
            else if (activeInput instanceof diffEditorInput_1.DiffEditorInput) {
                if (activeInput.primary instanceof webviewEditorInput_1.WebviewInput && activeInput.primary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.primary;
                }
                else if (activeInput.secondary instanceof webviewEditorInput_1.WebviewInput && activeInput.secondary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.secondary;
                }
            }
            if (newActiveWebview) {
                this._activeWebviewPanelIdContext.set(newActiveWebview.webview.providedViewType ?? '');
            }
            else {
                this._activeWebviewPanelIdContext.reset();
            }
            if (newActiveWebview !== this._activeWebview) {
                this._activeWebview = newActiveWebview;
                this._onDidChangeActiveWebviewEditor.fire(newActiveWebview);
            }
        }
        openWebview(webviewInitInfo, viewType, title, showOptions) {
            const webview = this._webviewService.createWebviewOverlay(webviewInitInfo);
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewInput, { viewType, name: title, providedId: webviewInitInfo.providedViewType }, webview, this.iconManager);
            this._editorService.openEditor(webviewInput, {
                pinned: true,
                preserveFocus: showOptions.preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: showOptions.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            const topLevelEditor = this.findTopLevelEditorForWebview(webview);
            this._editorService.openEditor(topLevelEditor, {
                preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, group);
        }
        findTopLevelEditorForWebview(webview) {
            for (const editor of this._editorService.editors) {
                if (editor === webview) {
                    return editor;
                }
                if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                    if (webview === editor.primary || webview === editor.secondary) {
                        return editor;
                    }
                }
            }
            return webview;
        }
        openRevivedWebview(options) {
            const webview = this._webviewService.createWebviewOverlay(options.webviewInitInfo);
            webview.state = options.state;
            const webviewInput = this._instantiationService.createInstance(LazilyResolvedWebviewEditorInput, { viewType: options.viewType, providedId: options.webviewInitInfo.providedViewType, name: options.title }, webview);
            webviewInput.iconPath = options.iconPath;
            if (typeof options.group === 'number') {
                webviewInput.updateGroup(options.group);
            }
            return webviewInput;
        }
        registerResolver(reviver) {
            this._revivers.add(reviver);
            const cts = new cancellation_1.CancellationTokenSource();
            this._revivalPool.reviveFor(reviver, cts.token);
            return (0, lifecycle_1.toDisposable)(() => {
                this._revivers.delete(reviver);
                cts.dispose(true);
            });
        }
        shouldPersist(webview) {
            // Revived webviews may not have an actively registered reviver but we still want to persist them
            // since a reviver should exist when it is actually needed.
            if (webview instanceof LazilyResolvedWebviewEditorInput) {
                return true;
            }
            return iterator_1.Iterable.some(this._revivers.values(), reviver => canRevive(reviver, webview));
        }
        async tryRevive(webview, token) {
            for (const reviver of this._revivers.values()) {
                if (canRevive(reviver, webview)) {
                    await reviver.resolveWebview(webview, token);
                    return true;
                }
            }
            return false;
        }
        async resolveWebview(webview, token) {
            const didRevive = await this.tryRevive(webview, token);
            if (!didRevive && !token.isCancellationRequested) {
                // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                return this._revivalPool.enqueueForRestoration(webview, token);
            }
        }
        setIcons(id, iconPath) {
            this._iconManager.setIcons(id, iconPath);
        }
    };
    exports.WebviewEditorService = WebviewEditorService;
    exports.WebviewEditorService = WebviewEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, webview_1.IWebviewService)
    ], WebviewEditorService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1dvcmtiZW5jaFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXdQYW5lbC9icm93c2VyL3dlYnZpZXdXb3JrYmVuY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCbkYsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLHNCQUFzQixDQUFDLENBQUM7SUFvRjFHLFNBQVMsU0FBUyxDQUFDLE9BQXdCLEVBQUUsT0FBcUI7UUFDakUsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLGlDQUFZO1FBS2pFLFlBQ0MsSUFBMEIsRUFDMUIsT0FBd0IsRUFDRSx3QkFBbUU7WUFFN0YsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFGaEIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQU50RixjQUFTLEdBQUcsS0FBSyxDQUFDO1FBUzFCLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7UUFDbEMsQ0FBQztRQUdxQixBQUFOLEtBQUssQ0FBQyxPQUFPO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUN0QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUEsK0JBQXVCLEVB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
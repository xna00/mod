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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/callHierarchy/browser/callHierarchyPeek", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/storage/common/storage", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/errors"], function (require, exports, nls_1, callHierarchy_1, cancellation_1, instantiation_1, callHierarchyPeek_1, event_1, editorExtensions_1, contextkey_1, lifecycle_1, editorContextKeys_1, peekView_1, storage_1, codeEditorService_1, range_1, actions_1, codicons_1, iconRegistry_1, errors_1) {
    "use strict";
    var CallHierarchyController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasCallHierarchyProvider = new contextkey_1.RawContextKey('editorHasCallHierarchyProvider', false, (0, nls_1.localize)('editorHasCallHierarchyProvider', 'Whether a call hierarchy provider is available'));
    const _ctxCallHierarchyVisible = new contextkey_1.RawContextKey('callHierarchyVisible', false, (0, nls_1.localize)('callHierarchyVisible', 'Whether call hierarchy peek is currently showing'));
    const _ctxCallHierarchyDirection = new contextkey_1.RawContextKey('callHierarchyDirection', undefined, { type: 'string', description: (0, nls_1.localize)('callHierarchyDirection', 'Whether call hierarchy shows incoming or outgoing calls') });
    function sanitizedDirection(candidate) {
        return candidate === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */ || candidate === "incomingCalls" /* CallHierarchyDirection.CallsTo */
            ? candidate
            : "incomingCalls" /* CallHierarchyDirection.CallsTo */;
    }
    let CallHierarchyController = class CallHierarchyController {
        static { CallHierarchyController_1 = this; }
        static { this.Id = 'callHierarchy'; }
        static get(editor) {
            return editor.getContribution(CallHierarchyController_1.Id);
        }
        static { this._StorageDirection = 'callHierarchy/defaultDirection'; }
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxIsVisible = _ctxCallHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxHasProvider = _ctxHasCallHierarchyProvider.bindTo(this._contextKeyService);
            this._ctxDirection = _ctxCallHierarchyDirection.bindTo(this._contextKeyService);
            this._dispoables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, callHierarchy_1.CallHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && callHierarchy_1.CallHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._dispoables.add(this._sessionDisposables);
        }
        dispose() {
            this._ctxHasProvider.reset();
            this._ctxIsVisible.reset();
            this._dispoables.dispose();
        }
        async startCallHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!callHierarchy_1.CallHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = callHierarchy_1.CallHierarchyModel.create(document, position, cts.token);
            const direction = sanitizedDirection(this._storageService.get(CallHierarchyController_1._StorageDirection, 0 /* StorageScope.PROFILE */, "incomingCalls" /* CallHierarchyDirection.CallsTo */));
            this._showCallHierarchyWidget(position, direction, model, cts);
        }
        async startCallHierarchyFromCallHierarchy() {
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const call = this._widget.getFocused();
            if (!call || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: call.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(call.item);
            this._sessionDisposables.clear();
            CallHierarchyController_1.get(newEditor)?._showCallHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        _showCallHierarchyWidget(position, direction, model, cts) {
            this._ctxIsVisible.set(true);
            this._ctxDirection.set(direction);
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endCallHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(callHierarchyPeek_1.CallHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endCallHierarchy();
                this._storageService.store(CallHierarchyController_1._StorageDirection, this._widget.direction, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }));
            this._sessionDisposables.add({ dispose() { cts.dispose(true); } });
            this._sessionDisposables.add(this._widget);
            model.then(model => {
                if (cts.token.isCancellationRequested) {
                    return; // nothing
                }
                if (model) {
                    this._sessionDisposables.add(model);
                    this._widget.showModel(model);
                }
                else {
                    this._widget.showMessage((0, nls_1.localize)('no.item', "No results"));
                }
            }).catch(err => {
                if ((0, errors_1.isCancellationError)(err)) {
                    this.endCallHierarchy();
                    return;
                }
                this._widget.showMessage((0, nls_1.localize)('error', "Failed to show call hierarchy"));
            });
        }
        showOutgoingCalls() {
            this._widget?.updateDirection("outgoingCalls" /* CallHierarchyDirection.CallsFrom */);
            this._ctxDirection.set("outgoingCalls" /* CallHierarchyDirection.CallsFrom */);
        }
        showIncomingCalls() {
            this._widget?.updateDirection("incomingCalls" /* CallHierarchyDirection.CallsTo */);
            this._ctxDirection.set("incomingCalls" /* CallHierarchyDirection.CallsTo */);
        }
        endCallHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    CallHierarchyController = CallHierarchyController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], CallHierarchyController);
    (0, editorExtensions_1.registerEditorContribution)(CallHierarchyController.Id, CallHierarchyController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    (0, actions_1.registerAction2)(class PeekCallHierarchyAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showCallHierarchy',
                title: (0, nls_1.localize2)('title', 'Peek Call Hierarchy'),
                menu: {
                    id: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000,
                    when: contextkey_1.ContextKeyExpr.and(_ctxHasCallHierarchyProvider, peekView_1.PeekContext.notInPeekEditor, editorContextKeys_1.EditorContextKeys.isInEmbeddedEditor.toNegated()),
                },
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasCallHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                f1: true
            });
        }
        async runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor)?.startCallHierarchyFromEditor();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showIncomingCalls',
                title: (0, nls_1.localize2)('title.incoming', 'Show Incoming Calls'),
                icon: (0, iconRegistry_1.registerIcon)('callhierarchy-incoming', codicons_1.Codicon.callIncoming, (0, nls_1.localize)('showIncomingCallsIcons', 'Icon for incoming calls in the call hierarchy view.')),
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, _ctxCallHierarchyDirection.isEqualTo("outgoingCalls" /* CallHierarchyDirection.CallsFrom */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxCallHierarchyDirection.isEqualTo("outgoingCalls" /* CallHierarchyDirection.CallsFrom */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor)?.showIncomingCalls();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showOutgoingCalls',
                title: (0, nls_1.localize2)('title.outgoing', 'Show Outgoing Calls'),
                icon: (0, iconRegistry_1.registerIcon)('callhierarchy-outgoing', codicons_1.Codicon.callOutgoing, (0, nls_1.localize)('showOutgoingCallsIcon', 'Icon for outgoing calls in the call hierarchy view.')),
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, _ctxCallHierarchyDirection.isEqualTo("incomingCalls" /* CallHierarchyDirection.CallsTo */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxCallHierarchyDirection.isEqualTo("incomingCalls" /* CallHierarchyDirection.CallsTo */),
                    order: 1
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor)?.showOutgoingCalls();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.refocusCallHierarchy',
                title: (0, nls_1.localize2)('title.refocus', 'Refocus Call Hierarchy'),
                precondition: _ctxCallHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
                }
            });
        }
        async runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor)?.startCallHierarchyFromCallHierarchy();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeCallHierarchy',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: _ctxCallHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    primary: 9 /* KeyCode.Escape */,
                    when: contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    order: 1000
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor)?.endCallHierarchy();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbEhpZXJhcmNoeS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NhbGxIaWVyYXJjaHkvYnJvd3Nlci9jYWxsSGllcmFyY2h5LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDLENBQUM7SUFDdk0sTUFBTSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGtEQUFrRCxDQUFDLENBQUMsQ0FBQztJQUNqTCxNQUFNLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBUyx3QkFBd0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSx5REFBeUQsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVsTyxTQUFTLGtCQUFrQixDQUFDLFNBQWlCO1FBQzVDLE9BQU8sU0FBUywyREFBcUMsSUFBSSxTQUFTLHlEQUFtQztZQUNwRyxDQUFDLENBQUMsU0FBUztZQUNYLENBQUMscURBQStCLENBQUM7SUFDbkMsQ0FBQztJQUVELElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCOztpQkFFWixPQUFFLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtRQUVyQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBMEIseUJBQXVCLENBQUMs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
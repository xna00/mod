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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/typeHierarchy/browser/typeHierarchyPeek", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy"], function (require, exports, cancellation_1, codicons_1, errors_1, event_1, lifecycle_1, editorExtensions_1, codeEditorService_1, range_1, peekView_1, nls_1, actions_1, contextkey_1, instantiation_1, storage_1, typeHierarchyPeek_1, typeHierarchy_1) {
    "use strict";
    var TypeHierarchyController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasTypeHierarchyProvider = new contextkey_1.RawContextKey('editorHasTypeHierarchyProvider', false, (0, nls_1.localize)('editorHasTypeHierarchyProvider', 'Whether a type hierarchy provider is available'));
    const _ctxTypeHierarchyVisible = new contextkey_1.RawContextKey('typeHierarchyVisible', false, (0, nls_1.localize)('typeHierarchyVisible', 'Whether type hierarchy peek is currently showing'));
    const _ctxTypeHierarchyDirection = new contextkey_1.RawContextKey('typeHierarchyDirection', undefined, { type: 'string', description: (0, nls_1.localize)('typeHierarchyDirection', 'whether type hierarchy shows super types or subtypes') });
    function sanitizedDirection(candidate) {
        return candidate === "subtypes" /* TypeHierarchyDirection.Subtypes */ || candidate === "supertypes" /* TypeHierarchyDirection.Supertypes */
            ? candidate
            : "subtypes" /* TypeHierarchyDirection.Subtypes */;
    }
    let TypeHierarchyController = class TypeHierarchyController {
        static { TypeHierarchyController_1 = this; }
        static { this.Id = 'typeHierarchy'; }
        static get(editor) {
            return editor.getContribution(TypeHierarchyController_1.Id);
        }
        static { this._storageDirectionKey = 'typeHierarchy/defaultDirection'; }
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxHasProvider = _ctxHasTypeHierarchyProvider.bindTo(this._contextKeyService);
            this._ctxIsVisible = _ctxTypeHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxDirection = _ctxTypeHierarchyDirection.bindTo(this._contextKeyService);
            this._disposables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, typeHierarchy_1.TypeHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && typeHierarchy_1.TypeHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._disposables.add(this._sessionDisposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        // Peek
        async startTypeHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!typeHierarchy_1.TypeHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = typeHierarchy_1.TypeHierarchyModel.create(document, position, cts.token);
            const direction = sanitizedDirection(this._storageService.get(TypeHierarchyController_1._storageDirectionKey, 0 /* StorageScope.PROFILE */, "subtypes" /* TypeHierarchyDirection.Subtypes */));
            this._showTypeHierarchyWidget(position, direction, model, cts);
        }
        _showTypeHierarchyWidget(position, direction, model, cts) {
            this._ctxIsVisible.set(true);
            this._ctxDirection.set(direction);
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endTypeHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(typeHierarchyPeek_1.TypeHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endTypeHierarchy();
                this._storageService.store(TypeHierarchyController_1._storageDirectionKey, this._widget.direction, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
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
                    this.endTypeHierarchy();
                    return;
                }
                this._widget.showMessage((0, nls_1.localize)('error', "Failed to show type hierarchy"));
            });
        }
        async startTypeHierarchyFromTypeHierarchy() {
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const typeItem = this._widget.getFocused();
            if (!typeItem || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: typeItem.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(typeItem.item);
            this._sessionDisposables.clear();
            TypeHierarchyController_1.get(newEditor)?._showTypeHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        showSupertypes() {
            this._widget?.updateDirection("supertypes" /* TypeHierarchyDirection.Supertypes */);
            this._ctxDirection.set("supertypes" /* TypeHierarchyDirection.Supertypes */);
        }
        showSubtypes() {
            this._widget?.updateDirection("subtypes" /* TypeHierarchyDirection.Subtypes */);
            this._ctxDirection.set("subtypes" /* TypeHierarchyDirection.Subtypes */);
        }
        endTypeHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    TypeHierarchyController = TypeHierarchyController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], TypeHierarchyController);
    (0, editorExtensions_1.registerEditorContribution)(TypeHierarchyController.Id, TypeHierarchyController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    // Peek
    (0, actions_1.registerAction2)(class PeekTypeHierarchyAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showTypeHierarchy',
                title: (0, nls_1.localize2)('title', 'Peek Type Hierarchy'),
                menu: {
                    id: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000,
                    when: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                f1: true
            });
        }
        async runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.startTypeHierarchyFromEditor();
        }
    });
    // actions for peek widget
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSupertypes',
                title: (0, nls_1.localize2)('title.supertypes', 'Show Supertypes'),
                icon: codicons_1.Codicon.typeHierarchySuper,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.showSupertypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSubtypes',
                title: (0, nls_1.localize2)('title.subtypes', 'Show Subtypes'),
                icon: codicons_1.Codicon.typeHierarchySub,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.showSubtypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.refocusTypeHierarchy',
                title: (0, nls_1.localize2)('title.refocusTypeHierarchy', 'Refocus Type Hierarchy'),
                precondition: _ctxTypeHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
                }
            });
        }
        async runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.startTypeHierarchyFromTypeHierarchy();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeTypeHierarchy',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: _ctxTypeHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    primary: 9 /* KeyCode.Escape */,
                    when: contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    order: 1000
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.endTypeHierarchy();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3R5cGVIaWVyYXJjaHkvYnJvd3Nlci90eXBlSGllcmFyY2h5LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDLENBQUM7SUFDdk0sTUFBTSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGtEQUFrRCxDQUFDLENBQUMsQ0FBQztJQUNqTCxNQUFNLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBUyx3QkFBd0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxzREFBc0QsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUUvTixTQUFTLGtCQUFrQixDQUFDLFNBQWlCO1FBQzVDLE9BQU8sU0FBUyxxREFBb0MsSUFBSSxTQUFTLHlEQUFzQztZQUN0RyxDQUFDLENBQUMsU0FBUztZQUNYLENBQUMsaURBQWdDLENBQUM7SUFDcEMsQ0FBQztJQUVELElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCOztpQkFDWixPQUFFLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtRQUVyQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBMEIseUJBQXVCLENBQUMs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
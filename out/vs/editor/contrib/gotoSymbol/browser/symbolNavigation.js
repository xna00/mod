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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/notification/common/notification"], function (require, exports, event_1, lifecycle_1, resources_1, editorExtensions_1, codeEditorService_1, range_1, nls_1, contextkey_1, extensions_1, instantiation_1, keybinding_1, keybindingsRegistry_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISymbolNavigationService = exports.ctxHasSymbols = void 0;
    exports.ctxHasSymbols = new contextkey_1.RawContextKey('hasSymbols', false, (0, nls_1.localize)('hasSymbols', "Whether there are symbol locations that can be navigated via keyboard-only."));
    exports.ISymbolNavigationService = (0, instantiation_1.createDecorator)('ISymbolNavigationService');
    let SymbolNavigationService = class SymbolNavigationService {
        constructor(contextKeyService, _editorService, _notificationService, _keybindingService) {
            this._editorService = _editorService;
            this._notificationService = _notificationService;
            this._keybindingService = _keybindingService;
            this._currentModel = undefined;
            this._currentIdx = -1;
            this._ignoreEditorChange = false;
            this._ctxHasSymbols = exports.ctxHasSymbols.bindTo(contextKeyService);
        }
        reset() {
            this._ctxHasSymbols.reset();
            this._currentState?.dispose();
            this._currentMessage?.dispose();
            this._currentModel = undefined;
            this._currentIdx = -1;
        }
        put(anchor) {
            const refModel = anchor.parent.parent;
            if (refModel.references.length <= 1) {
                this.reset();
                return;
            }
            this._currentModel = refModel;
            this._currentIdx = refModel.references.indexOf(anchor);
            this._ctxHasSymbols.set(true);
            this._showMessage();
            const editorState = new EditorState(this._editorService);
            const listener = editorState.onDidChange(_ => {
                if (this._ignoreEditorChange) {
                    return;
                }
                const editor = this._editorService.getActiveCodeEditor();
                if (!editor) {
                    return;
                }
                const model = editor.getModel();
                const position = editor.getPosition();
                if (!model || !position) {
                    return;
                }
                let seenUri = false;
                let seenPosition = false;
                for (const reference of refModel.references) {
                    if ((0, resources_1.isEqual)(reference.uri, model.uri)) {
                        seenUri = true;
                        seenPosition = seenPosition || range_1.Range.containsPosition(reference.range, position);
                    }
                    else if (seenUri) {
                        break;
                    }
                }
                if (!seenUri || !seenPosition) {
                    this.reset();
                }
            });
            this._currentState = (0, lifecycle_1.combinedDisposable)(editorState, listener);
        }
        revealNext(source) {
            if (!this._currentModel) {
                return Promise.resolve();
            }
            // get next result and advance
            this._currentIdx += 1;
            this._currentIdx %= this._currentModel.references.length;
            const reference = this._currentModel.references[this._currentIdx];
            // status
            this._showMessage();
            // open editor, ignore events while that happens
            this._ignoreEditorChange = true;
            return this._editorService.openCodeEditor({
                resource: reference.uri,
                options: {
                    selection: range_1.Range.collapseToStart(reference.range),
                    selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */
                }
            }, source).finally(() => {
                this._ignoreEditorChange = false;
            });
        }
        _showMessage() {
            this._currentMessage?.dispose();
            const kb = this._keybindingService.lookupKeybinding('editor.gotoNextSymbolFromResult');
            const message = kb
                ? (0, nls_1.localize)('location.kb', "Symbol {0} of {1}, {2} for next", this._currentIdx + 1, this._currentModel.references.length, kb.getLabel())
                : (0, nls_1.localize)('location', "Symbol {0} of {1}", this._currentIdx + 1, this._currentModel.references.length);
            this._currentMessage = this._notificationService.status(message);
        }
    };
    SymbolNavigationService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, notification_1.INotificationService),
        __param(3, keybinding_1.IKeybindingService)
    ], SymbolNavigationService);
    (0, extensions_1.registerSingleton)(exports.ISymbolNavigationService, SymbolNavigationService, 1 /* InstantiationType.Delayed */);
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.gotoNextSymbolFromResult',
                precondition: exports.ctxHasSymbols,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 70 /* KeyCode.F12 */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            return accessor.get(exports.ISymbolNavigationService).revealNext(editor);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'editor.gotoNextSymbolFromResult.cancel',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        when: exports.ctxHasSymbols,
        primary: 9 /* KeyCode.Escape */,
        handler(accessor) {
            accessor.get(exports.ISymbolNavigationService).reset();
        }
    });
    //
    let EditorState = class EditorState {
        constructor(editorService) {
            this._listener = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._disposables.add(editorService.onCodeEditorRemove(this._onDidRemoveEditor, this));
            this._disposables.add(editorService.onCodeEditorAdd(this._onDidAddEditor, this));
            editorService.listCodeEditors().forEach(this._onDidAddEditor, this);
        }
        dispose() {
            this._disposables.dispose();
            this._onDidChange.dispose();
            (0, lifecycle_1.dispose)(this._listener.values());
        }
        _onDidAddEditor(editor) {
            this._listener.set(editor, (0, lifecycle_1.combinedDisposable)(editor.onDidChangeCursorPosition(_ => this._onDidChange.fire({ editor })), editor.onDidChangeModelContent(_ => this._onDidChange.fire({ editor }))));
        }
        _onDidRemoveEditor(editor) {
            this._listener.get(editor)?.dispose();
            this._listener.delete(editor);
        }
    };
    EditorState = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sTmF2aWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZ290b1N5bWJvbC9icm93c2VyL3N5bWJvbE5hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JuRixRQUFBLGFBQWEsR0FBRyxJQUFJLDBCQUFhLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsNkVBQTZFLENBQUMsQ0FBQyxDQUFDO0lBRTlKLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQiwwQkFBMEIsQ0FBQyxDQUFDO0lBUzlHLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBWTVCLFlBQ3FCLGlCQUFxQyxFQUNyQyxjQUFtRCxFQUNqRCxvQkFBMkQsRUFDN0Qsa0JBQXVEO1lBRnRDLG1CQUFjLEdBQWQsY0FBYyxDQUFvQjtZQUNoQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQzVDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFWcEUsa0JBQWEsR0FBcUIsU0FBUyxDQUFDO1lBQzVDLGdCQUFXLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFHekIsd0JBQW1CLEdBQVksS0FBSyxDQUFDO1lBUTVDLElBQUksQ0FBQyxjQUFjLEdBQUcscUJBQWEsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxhQUFhLEdB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
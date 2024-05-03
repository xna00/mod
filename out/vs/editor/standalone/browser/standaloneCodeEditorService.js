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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/network", "vs/editor/browser/services/abstractCodeEditorService", "vs/editor/browser/services/codeEditorService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, network_1, abstractCodeEditorService_1, codeEditorService_1, contextkey_1, extensions_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneCodeEditorService = void 0;
    let StandaloneCodeEditorService = class StandaloneCodeEditorService extends abstractCodeEditorService_1.AbstractCodeEditorService {
        constructor(contextKeyService, themeService) {
            super(themeService);
            this._register(this.onCodeEditorAdd(() => this._checkContextKey()));
            this._register(this.onCodeEditorRemove(() => this._checkContextKey()));
            this._editorIsOpen = contextKeyService.createKey('editorIsOpen', false);
            this._activeCodeEditor = null;
            this._register(this.registerCodeEditorOpenHandler(async (input, source, sideBySide) => {
                if (!source) {
                    return null;
                }
                return this.doOpenEditor(source, input);
            }));
        }
        _checkContextKey() {
            let hasCodeEditor = false;
            for (const editor of this.listCodeEditors()) {
                if (!editor.isSimpleWidget) {
                    hasCodeEditor = true;
                    break;
                }
            }
            this._editorIsOpen.set(hasCodeEditor);
        }
        setActiveCodeEditor(activeCodeEditor) {
            this._activeCodeEditor = activeCodeEditor;
        }
        getActiveCodeEditor() {
            return this._activeCodeEditor;
        }
        doOpenEditor(editor, input) {
            const model = this.findModel(editor, input.resource);
            if (!model) {
                if (input.resource) {
                    const schema = input.resource.scheme;
                    if (schema === network_1.Schemas.http || schema === network_1.Schemas.https) {
                        // This is a fully qualified http or https URL
                        (0, dom_1.windowOpenNoOpener)(input.resource.toString());
                        return editor;
                    }
                }
                return null;
            }
            const selection = (input.options ? input.options.selection : null);
            if (selection) {
                if (typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                    editor.setSelection(selection);
                    editor.revealRangeInCenter(selection, 1 /* ScrollType.Immediate */);
                }
                else {
                    const pos = {
                        lineNumber: selection.startLineNumber,
                        column: selection.startColumn
                    };
                    editor.setPosition(pos);
                    editor.revealPositionInCenter(pos, 1 /* ScrollType.Immediate */);
                }
            }
            return editor;
        }
        findModel(editor, resource) {
            const model = editor.getModel();
            if (model && model.uri.toString() !== resource.toString()) {
                return null;
            }
            return model;
        }
    };
    exports.StandaloneCodeEditorService = StandaloneCodeEditorService;
    exports.StandaloneCodeEditorService = StandaloneCodeEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, themeService_1.IThemeService)
    ], StandaloneCodeEditorService);
    (0, extensions_1.registerSingleton)(codeEditorService_1.ICodeEditorService, StandaloneCodeEditorService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvZGVFZGl0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS9icm93c2VyL3N0YW5kYWxvbmVDb2RlRWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEscURBQXlCO1FBS3pFLFlBQ3FCLGlCQUFxQyxFQUMxQyxZQUEyQjtZQUUxQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFFOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENB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
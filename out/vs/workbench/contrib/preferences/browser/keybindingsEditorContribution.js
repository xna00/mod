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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/preferences/common/smartSnippetInserter", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/base/common/json", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/platform/theme/common/themeService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/model", "vs/base/common/keybindingParser", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/preferences/common/preferences"], function (require, exports, nls, async_1, htmlContent_1, lifecycle_1, keybinding_1, instantiation_1, range_1, editorExtensions_1, snippetController2_1, smartSnippetInserter_1, keybindingWidgets_1, json_1, windowsKeyboardMapper_1, themeService_1, editorColorRegistry_1, model_1, keybindingParser_1, types_1, resources_1, userDataProfile_1, preferences_1) {
    "use strict";
    var KeybindingEditorDecorationsRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingEditorDecorationsRenderer = void 0;
    const NLS_KB_LAYOUT_ERROR_MESSAGE = nls.localize('defineKeybinding.kbLayoutErrorMessage', "You won't be able to produce this key combination under your current keyboard layout.");
    let DefineKeybindingEditorContribution = class DefineKeybindingEditorContribution extends lifecycle_1.Disposable {
        constructor(_editor, _instantiationService, _userDataProfileService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._userDataProfileService = _userDataProfileService;
            this._keybindingDecorationRenderer = this._register(new lifecycle_1.MutableDisposable());
            this._defineWidget = this._register(this._instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingOverlayWidget, this._editor));
            this._register(this._editor.onDidChangeModel(e => this._update()));
            this._update();
        }
        _update() {
            this._keybindingDecorationRenderer.value = isInterestingEditorModel(this._editor, this._userDataProfileService)
                // Decorations are shown for the default keybindings.json **and** for the user keybindings.json
                ? this._instantiationService.createInstance(KeybindingEditorDecorationsRenderer, this._editor)
                : undefined;
        }
        showDefineKeybindingWidget() {
            if (isInterestingEditorModel(this._editor, this._userDataProfileService)) {
                this._defineWidget.start().then(keybinding => this._onAccepted(keybinding));
            }
        }
        _onAccepted(keybinding) {
            this._editor.focus();
            if (keybinding && this._editor.hasModel()) {
                const regexp = new RegExp(/\\/g);
                const backslash = regexp.test(keybinding);
                if (backslash) {
                    keybinding = keybinding.slice(0, -1) + '\\\\';
                }
                let snippetText = [
                    '{',
                    '\t"key": ' + JSON.stringify(keybinding) + ',',
                    '\t"command": "${1:commandId}",',
                    '\t"when": "${2:editorTextFocus}"',
                    '}$0'
                ].join('\n');
                const smartInsertInfo = smartSnippetInserter_1.SmartSnippetInserter.insertSnippet(this._editor.getModel(), this._editor.getPosition());
                snippetText = smartInsertInfo.prepend + snippetText + smartInsertInfo.append;
                this._editor.setPosition(smartInsertInfo.position);
                snippetController2_1.SnippetController2.get(this._editor)?.insert(snippetText, { overwriteBefore: 0, overwriteAfter: 0 });
            }
        }
    };
    DefineKeybindingEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataProfile_1.IUserDataProfileService)
    ], DefineKeybindingEditorContribution);
    let KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer_1 = class KeybindingEditorDecorationsRenderer extends lifecycle_1.Disposable {
        constructor(_editor, _keybindingService) {
            super();
            this._editor = _editor;
            this._keybindingService = _keybindingService;
            this._dec = this._editor.createDecorationsCollection();
            this._updateDecorations = this._register(new async_1.RunOnceScheduler(() => this._updateDecorationsNow(), 500));
            const model = (0, types_1.assertIsDefined)(this._editor.getModel());
            this._register(model.onDidChangeContent(() => this._updateDecorations.schedule()));
            this._register(this._keybindingService.onDidUpdateKeybindings(() => this._updateDecorations.schedule()));
            this._register({
                dispose: () => {
                    this._dec.clear();
                    this._updateDecorations.cancel();
                }
            });
            this._updateDecorations.schedule();
        }
        _updateDecorationsNow() {
            const model = (0, types_1.assertIsDefined)(this._editor.getModel());
            const newDecorations = [];
            const root = (0, json_1.parseTree)(model.getValue());
            if (root && Array.isArray(root.children)) {
                for (let i = 0, len = root.children.length; i < len; i++) {
                    const entry = root.children[i];
                    const dec = this._getDecorationForEntry(model, entry);
                    if (dec !== null) {
                        newDecorations.push(dec);
                    }
                }
            }
            this._dec.set(newDecorations);
        }
        _getDecorationForEntry(model, entry) {
            if (!Array.isArray(entry.children)) {
                return null;
            }
            for (let i = 0, len = entry.children.length; i < len; i++) {
                const prop = entry.children[i];
                if (prop.type !== 'property') {
                    continue;
                }
                if (!Array.isArray(prop.children) || prop.children.length !== 2) {
                    continue;
                }
                const key = prop.children[0];
                if (key.value !== 'key') {
                    continue;
                }
                const value = prop.children[1];
                if (value.type !== 'string') {
                    continue;
                }
                const resolvedKeybindings = this._keybindingService.resolveUserBinding(value.value);
                if (resolvedKeybindings.length === 0) {
                    return this._createDecoration(true, null, null, model, value);
                }
                const resolvedKeybinding = resolvedKeybindings[0];
                let usLabel = null;
                if (resolvedKeybinding instanceof windowsKeyboardMapper_1.WindowsNativeResolvedKeybinding) {
                    usLabel = resolvedKeybinding.getUSLabel();
                }
                if (!resolvedKeybinding.isWYSIWYG()) {
                    const uiLabel = resolvedKeybinding.getLabel();
                    if (typeof uiLabel === 'string' && value.value.toLowerCase() === uiLabel.toLowerCase()) {
                        // coincidentally, this is actually WYSIWYG
                        return null;
                    }
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                if (/abnt_|oem_/.test(value.value)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                const expectedUserSettingsLabel = resolvedKeybinding.getUserSettingsLabel();
                if (typeof expectedUserSettingsLabel === 'string' && !KeybindingEditorDecorationsRenderer_1._userSettingsFuzzyEquals(value.value, expectedUserSettingsLabel)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                return null;
            }
            return null;
        }
        static _userSettingsFuzzyEquals(a, b) {
            a = a.trim().toLowerCase();
            b = b.trim().toLowerCase();
            if (a === b) {
                return true;
            }
            const aKeybinding = keybindingParser_1.KeybindingParser.parseKeybinding(a);
            const bKeybinding = keybindingParser_1.KeybindingParser.parseKeybinding(b);
            if (aKeybinding === null && bKeybinding === null) {
                return true;
            }
            if (!aKeybinding || !bKeybinding) {
                return false;
            }
            return aKeybinding.equals(bKeybinding);
        }
        _createDecoration(isError, uiLabel, usLabel, model, keyNode) {
            let msg;
            let className;
            let overviewRulerColor;
            if (isError) {
                // this is the error case
                msg = new htmlContent_1.MarkdownString().appendText(NLS_KB_LAYOUT_ERROR_MESSAGE);
                className = 'keybindingError';
                overviewRulerColor = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerError);
            }
            else {
                // this is the info case
                if (usLabel && uiLabel !== usLabel) {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalAndUSMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholders such that they will be rendered in bold.',
                            'The placeholders will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout (**{1}** for US standard).", uiLabel, usLabel));
                }
                else {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholder such that it will be rendered in bold.',
                            'The placeholder will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout.", uiLabel));
                }
                className = 'keybindingInfo';
                overviewRulerColor = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerInfo);
            }
            const startPosition = model.getPositionAt(keyNode.offset);
            const endPosition = model.getPositionAt(keyNode.offset + keyNode.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            // icon + highlight + message decoration
            return {
                range: range,
                options: {
                    description: 'keybindings-widget',
                    stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                    className: className,
                    hoverMessage: msg,
                    overviewRuler: {
                        color: overviewRulerColor,
                        position: model_1.OverviewRulerLane.Right
                    }
                }
            };
        }
    };
    exports.KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer;
    exports.KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], KeybindingEditorDecorationsRenderer);
    function isInterestingEditorModel(editor, userDataProfileService) {
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        return (0, resources_1.isEqual)(model.uri, userDataProfileService.currentProfile.keybindingsResource);
    }
    (0, editorExtensions_1.registerEditorContribution)(preferences_1.DEFINE_KEYBINDING_EDITOR_CONTRIB_ID, DefineKeybindingEditorContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5YmluZGluZ3NFZGl0b3JDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBTSwyQkFBMkIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHVDQUF1QyxFQUFFLHVGQUF1RixDQUFDLENBQUM7SUFFbkwsSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBbUMsU0FBUSxzQkFBVTtRQU0xRCxZQUNTLE9BQW9CLEVBQ0wscUJBQTZELEVBQzNELHVCQUFpRTtZQUUxRixLQUFLLEVBQUUsQ0FBQztZQUpBLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDWSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzFDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUFQbkYsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUF1QyxDQUFDLENBQUM7WUFXcEgsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsaURBQTZCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDNUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVPLE9BQU87WUFDZCxJQUFJLENB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
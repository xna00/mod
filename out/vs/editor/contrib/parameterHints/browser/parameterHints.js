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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/parameterHints/browser/parameterHintsModel", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "./parameterHintsWidget"], function (require, exports, lazy_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, languages, languageFeatures_1, parameterHintsModel_1, provideSignatureHelp_1, nls, contextkey_1, instantiation_1, parameterHintsWidget_1) {
    "use strict";
    var ParameterHintsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerParameterHintsAction = exports.ParameterHintsController = void 0;
    let ParameterHintsController = class ParameterHintsController extends lifecycle_1.Disposable {
        static { ParameterHintsController_1 = this; }
        static { this.ID = 'editor.controller.parameterHints'; }
        static get(editor) {
            return editor.getContribution(ParameterHintsController_1.ID);
        }
        constructor(editor, instantiationService, languageFeaturesService) {
            super();
            this.editor = editor;
            this.model = this._register(new parameterHintsModel_1.ParameterHintsModel(editor, languageFeaturesService.signatureHelpProvider));
            this._register(this.model.onChangedHints(newParameterHints => {
                if (newParameterHints) {
                    this.widget.value.show();
                    this.widget.value.render(newParameterHints);
                }
                else {
                    this.widget.rawValue?.hide();
                }
            }));
            this.widget = new lazy_1.Lazy(() => this._register(instantiationService.createInstance(parameterHintsWidget_1.ParameterHintsWidget, this.editor, this.model)));
        }
        cancel() {
            this.model.cancel();
        }
        previous() {
            this.widget.rawValue?.previous();
        }
        next() {
            this.widget.rawValue?.next();
        }
        trigger(context) {
            this.model.trigger(context, 0);
        }
    };
    exports.ParameterHintsController = ParameterHintsController;
    exports.ParameterHintsController = ParameterHintsController = ParameterHintsController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], ParameterHintsController);
    class TriggerParameterHintsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.triggerParameterHints',
                label: nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
                alias: 'Trigger Parameter Hints',
                precondition: editorContextKeys_1.EditorContextKeys.hasSignatureHelpProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 10 /* KeyCode.Space */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = ParameterHintsController.get(editor);
            controller?.trigger({
                triggerKind: languages.SignatureHelpTriggerKind.Invoke
            });
        }
    }
    exports.TriggerParameterHintsAction = TriggerParameterHintsAction;
    (0, editorExtensions_1.registerEditorContribution)(ParameterHintsController.ID, ParameterHintsController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(TriggerParameterHintsAction);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 75;
    const ParameterHintsCommand = editorExtensions_1.EditorCommand.bindToContribution(ParameterHintsController.get);
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'closeParameterHints',
        precondition: provideSignatureHelp_1.Context.Visible,
        handler: x => x.cancel(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showPrevParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.previous(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
            mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showNextParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.next(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
            mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVySGludHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3BhcmFtZXRlckhpbnRzL2Jyb3dzZXIvcGFyYW1ldGVySGludHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBRWhDLE9BQUUsR0FBRyxrQ0FBa0MsQUFBckMsQ0FBc0M7UUFFeEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTJCLDBCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFNRCxZQUNDLE1BQW1CLEVBQ0ksb0JBQTJDLEVBQ3hDLHVCQUFpRDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBRXJCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlDQUFtQixDQUFDLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFFNUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO2dCQUM1RCxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxF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
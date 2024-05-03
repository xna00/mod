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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/dialogs/common/dialogs"], function (require, exports, lifecycle_1, resources_1, editorExtensions_1, codeEditorService_1, nls, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnusualLineTerminatorsDetector = void 0;
    const ignoreUnusualLineTerminators = 'ignoreUnusualLineTerminators';
    function writeIgnoreState(codeEditorService, model, state) {
        codeEditorService.setModelProperty(model.uri, ignoreUnusualLineTerminators, state);
    }
    function readIgnoreState(codeEditorService, model) {
        return codeEditorService.getModelProperty(model.uri, ignoreUnusualLineTerminators);
    }
    let UnusualLineTerminatorsDetector = class UnusualLineTerminatorsDetector extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.unusualLineTerminatorsDetector'; }
        constructor(_editor, _dialogService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._dialogService = _dialogService;
            this._codeEditorService = _codeEditorService;
            this._isPresentingDialog = false;
            this._config = this._editor.getOption(126 /* EditorOption.unusualLineTerminators */);
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(126 /* EditorOption.unusualLineTerminators */)) {
                    this._config = this._editor.getOption(126 /* EditorOption.unusualLineTerminators */);
                    this._checkForUnusualLineTerminators();
                }
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._checkForUnusualLineTerminators();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                if (e.isUndoing) {
                    // skip checking in case of undoing
                    return;
                }
                this._checkForUnusualLineTerminators();
            }));
            this._checkForUnusualLineTerminators();
        }
        async _checkForUnusualLineTerminators() {
            if (this._config === 'off') {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (!model.mightContainUnusualLineTerminators()) {
                return;
            }
            const ignoreState = readIgnoreState(this._codeEditorService, model);
            if (ignoreState === true) {
                // this model should be ignored
                return;
            }
            if (this._editor.getOption(91 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return;
            }
            if (this._config === 'auto') {
                // just do it!
                model.removeUnusualLineTerminators(this._editor.getSelections());
                return;
            }
            if (this._isPresentingDialog) {
                // we're currently showing the dialog, which is async.
                // avoid spamming the user
                return;
            }
            let result;
            try {
                this._isPresentingDialog = true;
                result = await this._dialogService.confirm({
                    title: nls.localize('unusualLineTerminators.title', "Unusual Line Terminators"),
                    message: nls.localize('unusualLineTerminators.message', "Detected unusual line terminators"),
                    detail: nls.localize('unusualLineTerminators.detail', "The file '{0}' contains one or more unusual line terminator characters, like Line Separator (LS) or Paragraph Separator (PS).\n\nIt is recommended to remove them from the file. This can be configured via `editor.unusualLineTerminators`.", (0, resources_1.basename)(model.uri)),
                    primaryButton: nls.localize({ key: 'unusualLineTerminators.fix', comment: ['&& denotes a mnemonic'] }, "&&Remove Unusual Line Terminators"),
                    cancelButton: nls.localize('unusualLineTerminators.ignore', "Ignore")
                });
            }
            finally {
                this._isPresentingDialog = false;
            }
            if (!result.confirmed) {
                // this model should be ignored
                writeIgnoreState(this._codeEditorService, model, true);
                return;
            }
            model.removeUnusualLineTerminators(this._editor.getSelections());
        }
    };
    exports.UnusualLineTerminatorsDetector = UnusualLineTerminatorsDetector;
    exports.UnusualLineTerminatorsDetector = UnusualLineTerminatorsDetector = __decorate([
        __param(1, dialogs_1.IDialogService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], UnusualLineTerminatorsDetector);
    (0, editorExtensions_1.registerEditorContribution)(UnusualLineTerminatorsDetector.ID, UnusualLineTerminatorsDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW51c3VhbExpbmVUZXJtaW5hdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvdW51c3VhbExpbmVUZXJtaW5hdG9ycy9icm93c2VyL3VudXN1YWxMaW5lVGVybWluYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sNEJBQTRCLEdBQUcsOEJBQThCLENBQUM7SUFFcEUsU0FBUyxnQkFBZ0IsQ0FBQyxpQkFBcUMsRUFBRSxLQUFpQixFQUFFLEtBQWM7UUFDakcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSw0QkFBNEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsaUJBQXFDLEVBQUUsS0FBaUI7UUFDaEYsT0FBTyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVNLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVU7aUJBRXRDLE9BQUUsR0FBRywrQ0FBK0MsQUFBbEQsQ0FBbUQ7UUFLNUUsWUFDa0IsT0FBb0IsRUFDckIsY0FBK0MsRUFDM0Msa0JBQXVEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBSlMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNKLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMxQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBTHBFLHdCQUFtQixHQUFZLEtBQUssQ0FBQztZQVM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUywrQ0FBcUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsU0FBUyxDQUFD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
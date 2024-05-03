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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/async", "vs/editor/common/languages/language", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/editor/common/editorContextKeys", "vs/base/common/network", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, editorBrowser_1, nls_1, platform_1, contributions_1, editorService_1, statusbar_1, languageDetectionWorkerService_1, async_1, language_1, keybinding_1, actions_1, notification_1, contextkey_1, notebookContextKeys_1, editorContextKeys_1, network_1, configuration_1) {
    "use strict";
    var LanguageDetectionStatusContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const detectLanguageCommandId = 'editor.detectLanguage';
    let LanguageDetectionStatusContribution = class LanguageDetectionStatusContribution {
        static { LanguageDetectionStatusContribution_1 = this; }
        static { this._id = 'status.languageDetectionStatus'; }
        constructor(_languageDetectionService, _statusBarService, _configurationService, _editorService, _languageService, _keybindingService) {
            this._languageDetectionService = _languageDetectionService;
            this._statusBarService = _statusBarService;
            this._configurationService = _configurationService;
            this._editorService = _editorService;
            this._languageService = _languageService;
            this._keybindingService = _keybindingService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._delayer = new async_1.ThrottledDelayer(1000);
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _editorService.onDidActiveEditorChange(() => this._update(true), this, this._disposables);
            this._update(false);
        }
        dispose() {
            this._disposables.dispose();
            this._delayer.dispose();
            this._combinedEntry?.dispose();
            this._renderDisposables.dispose();
        }
        _update(clear) {
            if (clear) {
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            this._delayer.trigger(() => this._doUpdate());
        }
        async _doUpdate() {
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            this._renderDisposables.clear();
            // update when editor language changes
            editor?.onDidChangeModelLanguage(() => this._update(true), this, this._renderDisposables);
            editor?.onDidChangeModelContent(() => this._update(false), this, this._renderDisposables);
            const editorModel = editor?.getModel();
            const editorUri = editorModel?.uri;
            const existingId = editorModel?.getLanguageId();
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && enablementConfig?.untitledEditors;
            const disableLightbulb = !enabled || editorUri?.scheme !== network_1.Schemas.untitled || !existingId;
            if (disableLightbulb || !editorUri) {
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const lang = await this._languageDetectionService.detectLanguage(editorUri);
                const skip = { 'jsonc': 'json' };
                const existing = editorModel.getLanguageId();
                if (lang && lang !== existing && skip[existing] !== lang) {
                    const detectedName = this._languageService.getLanguageName(lang) || lang;
                    let tooltip = (0, nls_1.localize)('status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                    const keybinding = this._keybindingService.lookupKeybinding(detectLanguageCommandId);
                    const label = keybinding?.getLabel();
                    if (label) {
                        tooltip += ` (${label})`;
                    }
                    const props = {
                        name: (0, nls_1.localize)('langDetection.name', "Language Detection"),
                        ariaLabel: (0, nls_1.localize)('langDetection.aria', "Change to Detected Language: {0}", lang),
                        tooltip,
                        command: detectLanguageCommandId,
                        text: '$(lightbulb-autofix)',
                    };
                    if (!this._combinedEntry) {
                        this._combinedEntry = this._statusBarService.addEntry(props, LanguageDetectionStatusContribution_1._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */, compact: true });
                    }
                    else {
                        this._combinedEntry.update(props);
                    }
                }
                else {
                    this._combinedEntry?.dispose();
                    this._combinedEntry = undefined;
                }
            }
        }
    };
    LanguageDetectionStatusContribution = LanguageDetectionStatusContribution_1 = __decorate([
        __param(0, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, language_1.ILanguageService),
        __param(5, keybinding_1.IKeybindingService)
    ], LanguageDetectionStatusContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LanguageDetectionStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: detectLanguageCommandId,
                title: (0, nls_1.localize2)('detectlang', "Detect Language from Content"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const editor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            const notificationService = accessor.get(notification_1.INotificationService);
            const editorUri = editor?.getModel()?.uri;
            if (editorUri) {
                const lang = await languageDetectionService.detectLanguage(editorUri);
                if (lang) {
                    editor.getModel()?.setLanguage(lang, languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource);
                }
                else {
                    notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect editor language"));
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb24uY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sYW5ndWFnZURldGVjdGlvbi9icm93c2VyL2xhbmd1YWdlRGV0ZWN0aW9uLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQU0sdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFFeEQsSUFBTSxtQ0FBbUMsR0FBekMsTUFBTSxtQ0FBbUM7O2lCQUVoQixRQUFHLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO1FBTy9ELFlBQzRCLHlCQUFxRSxFQUM3RSxpQkFBcUQsRUFDakQscUJBQTZELEVBQ3BFLGNBQStDLEVBQzdDLGdCQUFtRCxFQUNqRCxrQkFBdUQ7WUFML0IsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUM1RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2hDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDbkQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzVCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDaEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQVgzRCxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTlDLGFBQVEsR0FBRyxJQUFJLHdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLHVCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBVTNELGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUYsSUFB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
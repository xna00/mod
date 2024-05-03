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
define(["require", "exports", "vs/editor/contrib/quickAccess/browser/gotoSymbolQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/browser/services/codeEditorService", "vs/editor/common/standaloneStrings", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/quickinput/common/quickInput", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatures", "vs/base/browser/ui/codicons/codiconStyles", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, gotoSymbolQuickAccess_1, platform_1, quickAccess_1, codeEditorService_1, standaloneStrings_1, event_1, editorExtensions_1, editorContextKeys_1, quickInput_1, outlineModel_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoSymbolAction = exports.StandaloneGotoSymbolQuickAccessProvider = void 0;
    let StandaloneGotoSymbolQuickAccessProvider = class StandaloneGotoSymbolQuickAccessProvider extends gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider {
        constructor(editorService, languageFeaturesService, outlineModelService) {
            super(languageFeaturesService, outlineModelService);
            this.editorService = editorService;
            this.onDidActiveTextEditorControlChange = event_1.Event.None;
        }
        get activeTextEditorControl() {
            return this.editorService.getFocusedCodeEditor() ?? undefined;
        }
    };
    exports.StandaloneGotoSymbolQuickAccessProvider = StandaloneGotoSymbolQuickAccessProvider;
    exports.StandaloneGotoSymbolQuickAccessProvider = StandaloneGotoSymbolQuickAccessProvider = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, outlineModel_1.IOutlineModelService)
    ], StandaloneGotoSymbolQuickAccessProvider);
    class GotoSymbolAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.quickOutline'; }
        constructor() {
            super({
                id: GotoSymbolAction.ID,
                label: standaloneStrings_1.QuickOutlineNLS.quickOutlineActionLabel,
                alias: 'Go to Symbol...',
                precondition: editorContextKeys_1.EditorContextKeys.hasDocumentSymbolProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: 'navigation',
                    order: 3
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX, { itemActivation: quickInput_1.ItemActivation.NONE });
        }
    }
    exports.GotoSymbolAction = GotoSymbolAction;
    (0, editorExtensions_1.registerEditorAction)(GotoSymbolAction);
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: StandaloneGotoSymbolQuickAccessProvider,
        prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
        helpEntries: [
            { description: standaloneStrings_1.QuickOutlineNLS.quickOutlineActionLabel, prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX, commandId: GotoSymbolAction.ID },
            { description: standaloneStrings_1.QuickOutlineNLS.quickOutlineByCategoryActionLabel, prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY }
        ]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUdvdG9TeW1ib2xRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9xdWlja0FjY2Vzcy9zdGFuZGFsb25lR290b1N5bWJvbFF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBd0MsU0FBUSw2REFBcUM7UUFJakcsWUFDcUIsYUFBa0QsRUFDNUMsdUJBQWlELEVBQ3JELG1CQUF5QztZQUUvRCxLQUFLLENBQUMsdUJBQXVCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUpmLGtCQUFhLEdBQWIsYUFBYSxDQUFvQjtZQUhwRCx1Q0FBa0MsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBUW5FLENBQUM7UUFFRCxJQUFjLHVCQUF1QjtZQUNwQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxTQUFTLENBQUM7UUFDL0QsQ0FBQztLQUNELENBQUE7SUFmWSwwRkFBdUM7c0RBQXZDLHVDQUF1QztRQUtqRCxXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSxtQ0FBb0IsQ0FBQTtPQVBWLHVDQUF1QyxDQWVuRDtJQUVELE1BQWEsZ0JBQWlCLFNBQVEsK0JBQVk7aUJBRWpDLE9BQUUsR0FBRyw0QkFBNEIsQ0FBQztRQUVsRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtnQkFDdkIsS0FBSyxFQUFFLG1DQUFlLENBQUMsdUJBQXVCO2dCQUM5QyxLQUFLLEVBQUUsaUJBQWlCO2dCQUN4QixZQUFZLEVBQUUscUNBQWlCLENBQUMseUJBQXlCO2dCQUN6RCxNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLEtBQUs7b0JBQy9CLE9BQU8sRUFBRSxtREFBNkIsd0JBQWU7b0JBQ3JELE1BQU0sMENBQWdDO2lCQUN0QztnQkFDRCxlQUFlLEVBQUU7b0JBQ2hCLEtBQUssRUFBRSxZQUFZO29CQUNuQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsNkRBQXFDLENBQUMsTUFBTSxFQUFFLEVBQUUsY0FBYyxFQUFFLDJCQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMxSSxDQUFDOztJQXhCRiw0Q0F5QkM7SUFFRCxJQUFBLHVDQUFvQixFQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFdkMsbUJBQVEsQ0FBQyxFQUFFLENBQXVCLHdCQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsMkJBQTJCLENBQUM7UUFDckYsSUFBSSxFQUFFLHVDQUF1QztRQUM3QyxNQUFNLEVBQUUsNkRBQXFDLENBQUMsTUFBTTtRQUNwRCxXQUFXLEVBQUU7WUFDWixFQUFFLFdBQVcsRUFBRSxtQ0FBZSxDQUFDLHVCQUF1QixFQUFFLE1BQU0sRUFBRSw2REFBcUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLEVBQUUsRUFBRTtZQUM5SSxFQUFFLFdBQVcsRUFBRSxtQ0FBZSxDQUFDLGlDQUFpQyxFQUFFLE1BQU0sRUFBRSw2REFBcUMsQ0FBQyxrQkFBa0IsRUFBRTtTQUNwSTtLQUNELENBQUMsQ0FBQyJ9
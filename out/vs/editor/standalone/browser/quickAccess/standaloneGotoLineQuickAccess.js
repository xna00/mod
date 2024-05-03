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
define(["require", "exports", "vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/browser/services/codeEditorService", "vs/editor/common/standaloneStrings", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/quickinput/common/quickInput"], function (require, exports, gotoLineQuickAccess_1, platform_1, quickAccess_1, codeEditorService_1, standaloneStrings_1, event_1, editorExtensions_1, editorContextKeys_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineAction = exports.StandaloneGotoLineQuickAccessProvider = void 0;
    let StandaloneGotoLineQuickAccessProvider = class StandaloneGotoLineQuickAccessProvider extends gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this.onDidActiveTextEditorControlChange = event_1.Event.None;
        }
        get activeTextEditorControl() {
            return this.editorService.getFocusedCodeEditor() ?? undefined;
        }
    };
    exports.StandaloneGotoLineQuickAccessProvider = StandaloneGotoLineQuickAccessProvider;
    exports.StandaloneGotoLineQuickAccessProvider = StandaloneGotoLineQuickAccessProvider = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], StandaloneGotoLineQuickAccessProvider);
    class GotoLineAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.gotoLine'; }
        constructor() {
            super({
                id: GotoLineAction.ID,
                label: standaloneStrings_1.GoToLineNLS.gotoLineActionLabel,
                alias: 'Go to Line/Column...',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 37 /* KeyCode.KeyG */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(StandaloneGotoLineQuickAccessProvider.PREFIX);
        }
    }
    exports.GotoLineAction = GotoLineAction;
    (0, editorExtensions_1.registerEditorAction)(GotoLineAction);
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: StandaloneGotoLineQuickAccessProvider,
        prefix: StandaloneGotoLineQuickAccessProvider.PREFIX,
        helpEntries: [{ description: standaloneStrings_1.GoToLineNLS.gotoLineActionLabel, commandId: GotoLineAction.ID }]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUdvdG9MaW5lUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvcXVpY2tBY2Nlc3Mvc3RhbmRhbG9uZUdvdG9MaW5lUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0scUNBQXFDLEdBQTNDLE1BQU0scUNBQXNDLFNBQVEseURBQW1DO1FBSTdGLFlBQWdDLGFBQWtEO1lBQ2pGLEtBQUssRUFBRSxDQUFDO1lBRHdDLGtCQUFhLEdBQWIsYUFBYSxDQUFvQjtZQUYvRCx1Q0FBa0MsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBSW5FLENBQUM7UUFFRCxJQUFjLHVCQUF1QjtZQUNwQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxTQUFTLENBQUM7UUFDL0QsQ0FBQztLQUNELENBQUE7SUFYWSxzRkFBcUM7b0RBQXJDLHFDQUFxQztRQUlwQyxXQUFBLHNDQUFrQixDQUFBO09BSm5CLHFDQUFxQyxDQVdqRDtJQUVELE1BQWEsY0FBZSxTQUFRLCtCQUFZO2lCQUUvQixPQUFFLEdBQUcsd0JBQXdCLENBQUM7UUFFOUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFO2dCQUNyQixLQUFLLEVBQUUsK0JBQVcsQ0FBQyxtQkFBbUI7Z0JBQ3RDLEtBQUssRUFBRSxzQkFBc0I7Z0JBQzdCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLEtBQUs7b0JBQy9CLE9BQU8sRUFBRSxpREFBNkI7b0JBQ3RDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxnREFBNkIsRUFBRTtvQkFDL0MsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRyxDQUFDOztJQXJCRix3Q0FzQkM7SUFFRCxJQUFBLHVDQUFvQixFQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRXJDLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDO1FBQ3JGLElBQUksRUFBRSxxQ0FBcUM7UUFDM0MsTUFBTSxFQUFFLHFDQUFxQyxDQUFDLE1BQU07UUFDcEQsV0FBVyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsK0JBQVcsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRSxDQUFDO0tBQzdGLENBQUMsQ0FBQyJ9
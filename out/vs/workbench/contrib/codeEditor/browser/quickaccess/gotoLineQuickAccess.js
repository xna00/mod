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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/platform/configuration/common/configuration", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, nls_1, quickInput_1, editorService_1, gotoLineQuickAccess_1, platform_1, quickAccess_1, configuration_1, actions_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineQuickAccessProvider = void 0;
    let GotoLineQuickAccessProvider = class GotoLineQuickAccessProvider extends gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider {
        constructor(editorService, editorGroupService, configurationService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench?.editor;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview
            };
        }
        get activeTextEditorControl() {
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(context, options) {
            // Check for sideBySide use
            if ((options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options.forceSideBySide) && this.editorService.activeEditor) {
                context.restoreViewState?.(); // since we open to the side, restore view state in this editor
                const editorOptions = {
                    selection: options.range,
                    pinned: options.keyMods.ctrlCmd || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                };
                this.editorGroupService.sideGroup.openEditor(this.editorService.activeEditor, editorOptions);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(context, options);
            }
        }
    };
    exports.GotoLineQuickAccessProvider = GotoLineQuickAccessProvider;
    exports.GotoLineQuickAccessProvider = GotoLineQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService)
    ], GotoLineQuickAccessProvider);
    class GotoLineAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.gotoLine'; }
        constructor() {
            super({
                id: GotoLineAction.ID,
                title: (0, nls_1.localize2)('gotoLine', 'Go to Line/Column...'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 37 /* KeyCode.KeyG */ }
                }
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(GotoLineQuickAccessProvider.PREFIX);
        }
    }
    (0, actions_1.registerAction2)(GotoLineAction);
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoLineQuickAccessProvider,
        prefix: gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider.PREFIX,
        placeholder: (0, nls_1.localize)('gotoLineQuickAccessPlaceholder', "Type the line number and optional column to go to (e.g. 42:5 for line 42 and column 5)."),
        helpEntries: [{ description: (0, nls_1.localize)('gotoLineQuickAccess', "Go to Line/Column"), commandId: GotoLineAction.ID }]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b0xpbmVRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3F1aWNrYWNjZXNzL2dvdG9MaW5lUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHlEQUFtQztRQUluRixZQUNpQixhQUE4QyxFQUN4QyxrQkFBeUQsRUFDeEQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSnlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBQ3ZDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFMakUsdUNBQWtDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQztRQVFuRyxDQUFDO1FBRUQsSUFBWSxhQUFhO1lBQ3hCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQWlDLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQztZQUUzRyxPQUFPO2dCQUNOLGdCQUFnQixFQUFFLENBQUMsWUFBWSxFQUFFLDBCQUEwQixJQUFJLENBQUMsWUFBWSxFQUFFLGFBQWE7YUFDM0YsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFjLHVCQUF1QjtZQUNwQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUM7UUFDbkQsQ0FBQztRQUVrQixZQUFZLENBQUMsT0FBc0MsRUFBRSxPQUFpRztZQUV4SywyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUM3SixPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsK0RBQStEO2dCQUU3RixNQUFNLGFBQWEsR0FBdUI7b0JBQ3pDLFNBQVMsRUFBRSxPQUFPLENBQUMsS0FBSztvQkFDeEIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCO29CQUN0RSxhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7aUJBQ3BDLENBQUM7Z0JBRUYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDOUYsQ0FBQztZQUVELGlDQUFpQztpQkFDNUIsQ0FBQztnQkFDTCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUE1Q1ksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFLckMsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHFDQUFxQixDQUFBO09BUFgsMkJBQTJCLENBNEN2QztJQUVELE1BQU0sY0FBZSxTQUFRLGlCQUFPO2lCQUVuQixPQUFFLEdBQUcsMkJBQTJCLENBQUM7UUFFakQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFO2dCQUNyQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLHNCQUFzQixDQUFDO2dCQUNwRCxFQUFFLEVBQUUsSUFBSTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLElBQUksRUFBRSxJQUFJO29CQUNWLE9BQU8sRUFBRSxpREFBNkI7b0JBQ3RDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxnREFBNkIsRUFBRTtpQkFDL0M7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RixDQUFDOztJQUdGLElBQUEseUJBQWUsRUFBQyxjQUFjLENBQUMsQ0FBQztJQUVoQyxtQkFBUSxDQUFDLEVBQUUsQ0FBdUIsd0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUMsMkJBQTJCLENBQUM7UUFDL0YsSUFBSSxFQUFFLDJCQUEyQjtRQUNqQyxNQUFNLEVBQUUseURBQW1DLENBQUMsTUFBTTtRQUNsRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUseUZBQXlGLENBQUM7UUFDbEosV0FBVyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRSxDQUFDO0tBQ2xILENBQUMsQ0FBQyJ9
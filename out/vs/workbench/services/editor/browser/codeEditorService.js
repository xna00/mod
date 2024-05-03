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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/abstractCodeEditorService", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/editorOptions"], function (require, exports, editorBrowser_1, abstractCodeEditorService_1, themeService_1, editorService_1, codeEditorService_1, extensions_1, resources_1, configuration_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeEditorService = void 0;
    let CodeEditorService = class CodeEditorService extends abstractCodeEditorService_1.AbstractCodeEditorService {
        constructor(editorService, themeService, configurationService) {
            super(themeService);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this._register(this.registerCodeEditorOpenHandler(this.doOpenCodeEditor.bind(this)));
            this._register(this.registerCodeEditorOpenHandler(this.doOpenCodeEditorFromDiff.bind(this)));
        }
        getActiveCodeEditor() {
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                return activeTextEditorControl;
            }
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                return activeTextEditorControl.getModifiedEditor();
            }
            const activeControl = this.editorService.activeEditorPane?.getControl();
            if ((0, editorBrowser_1.isCompositeEditor)(activeControl) && (0, editorBrowser_1.isCodeEditor)(activeControl.activeCodeEditor)) {
                return activeControl.activeCodeEditor;
            }
            return null;
        }
        async doOpenCodeEditorFromDiff(input, source, sideBySide) {
            // Special case: If the active editor is a diff editor and the request to open originates and
            // targets the modified side of it, we just apply the request there to prevent opening the modified
            // side as separate editor.
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if (!sideBySide && // we need the current active group to be the target
                (0, editorBrowser_1.isDiffEditor)(activeTextEditorControl) && // we only support this for active text diff editors
                input.options && // we need options to apply
                input.resource && // we need a request resource to compare with
                source === activeTextEditorControl.getModifiedEditor() && // we need the source of this request to be the modified side of the diff editor
                activeTextEditorControl.getModel() && // we need a target model to compare with
                (0, resources_1.isEqual)(input.resource, activeTextEditorControl.getModel()?.modified.uri) // we need the input resources to match with modified side
            ) {
                const targetEditor = activeTextEditorControl.getModifiedEditor();
                (0, editorOptions_1.applyTextEditorOptions)(input.options, targetEditor, 0 /* ScrollType.Smooth */);
                return targetEditor;
            }
            return null;
        }
        // Open using our normal editor service
        async doOpenCodeEditor(input, source, sideBySide) {
            // Special case: we want to detect the request to open an editor that
            // is different from the current one to decide whether the current editor
            // should be pinned or not. This ensures that the source of a navigation
            // is not being replaced by the target. An example is "Goto definition"
            // that otherwise would replace the editor everytime the user navigates.
            const enablePreviewFromCodeNavigation = this.configurationService.getValue().workbench?.editor?.enablePreviewFromCodeNavigation;
            if (!enablePreviewFromCodeNavigation && // we only need to do this if the configuration requires it
                source && // we need to know the origin of the navigation
                !input.options?.pinned && // we only need to look at preview editors that open
                !sideBySide && // we only need to care if editor opens in same group
                !(0, resources_1.isEqual)(source.getModel()?.uri, input.resource) // we only need to do this if the editor is about to change
            ) {
                for (const visiblePane of this.editorService.visibleEditorPanes) {
                    if ((0, editorBrowser_1.getCodeEditor)(visiblePane.getControl()) === source) {
                        visiblePane.group.pinEditor();
                        break;
                    }
                }
            }
            // Open as editor
            const control = await this.editorService.openEditor(input, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            if (control) {
                const widget = control.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(widget)) {
                    return widget;
                }
                if ((0, editorBrowser_1.isCompositeEditor)(widget) && (0, editorBrowser_1.isCodeEditor)(widget.activeCodeEditor)) {
                    return widget.activeCodeEditor;
                }
            }
            return null;
        }
    };
    exports.CodeEditorService = CodeEditorService;
    exports.CodeEditorService = CodeEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, themeService_1.IThemeService),
        __param(2, configuration_1.IConfigurationService)
    ], CodeEditorService);
    (0, extensions_1.registerSingleton)(codeEditorService_1.ICodeEditorService, CodeEditorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lZGl0b3IvYnJvd3Nlci9jb2RlRWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxxREFBeUI7UUFFL0QsWUFDa0MsYUFBNkIsRUFDL0MsWUFBMkIsRUFDRixvQkFBMkM7WUFFbkYsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBSmEsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRXRCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELG1CQUFtQjtZQUNsQixNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUM7WUFDM0UsSUFBSSxJQUFBLDRCQUFZLEVBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLHVCQUF1QixDQUFDO1lBQ2hDLENBQUM7WUFFRCxJQUFJLElBQUEsNEJBQVksRUFBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sdUJBQXVCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNwRCxDQUFDO1lBRUQsTUFBTSxh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
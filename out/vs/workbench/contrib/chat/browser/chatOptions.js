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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/workbench/common/views"], function (require, exports, event_1, lifecycle_1, configuration_1, themeService_1, views_1) {
    "use strict";
    var ChatEditorOptions_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditorOptions = void 0;
    let ChatEditorOptions = class ChatEditorOptions extends lifecycle_1.Disposable {
        static { ChatEditorOptions_1 = this; }
        static { this.lineHeightEm = 1.4; }
        get configuration() {
            return this._config;
        }
        static { this.relevantSettingIds = [
            'chat.editor.lineHeight',
            'chat.editor.fontSize',
            'chat.editor.fontFamily',
            'chat.editor.fontWeight',
            'chat.editor.wordWrap',
            'editor.cursorBlinking',
            'editor.fontLigatures',
            'editor.accessibilitySupport',
            'editor.bracketPairColorization.enabled',
            'editor.bracketPairColorization.independentColorPoolPerBracketType',
        ]; }
        constructor(viewId, foreground, inputEditorBackgroundColor, resultEditorBackgroundColor, configurationService, themeService, viewDescriptorService) {
            super();
            this.foreground = foreground;
            this.inputEditorBackgroundColor = inputEditorBackgroundColor;
            this.resultEditorBackgroundColor = resultEditorBackgroundColor;
            this.configurationService = configurationService;
            this.themeService = themeService;
            this.viewDescriptorService = viewDescriptorService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this.themeService.onDidColorThemeChange(e => this.update()));
            this._register(this.viewDescriptorService.onDidChangeLocation(e => {
                if (e.views.some(v => v.id === viewId)) {
                    this.update();
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (ChatEditorOptions_1.relevantSettingIds.some(id => e.affectsConfiguration(id))) {
                    this.update();
                }
            }));
            this.update();
        }
        update() {
            const editorConfig = this.configurationService.getValue('editor');
            // TODO shouldn't the setting keys be more specific?
            const chatEditorConfig = this.configurationService.getValue('chat')?.editor;
            const accessibilitySupport = this.configurationService.getValue('editor.accessibilitySupport');
            this._config = {
                foreground: this.themeService.getColorTheme().getColor(this.foreground),
                inputEditor: {
                    backgroundColor: this.themeService.getColorTheme().getColor(this.inputEditorBackgroundColor),
                    accessibilitySupport,
                },
                resultEditor: {
                    backgroundColor: this.themeService.getColorTheme().getColor(this.resultEditorBackgroundColor),
                    fontSize: chatEditorConfig.fontSize,
                    fontFamily: chatEditorConfig.fontFamily === 'default' ? editorConfig.fontFamily : chatEditorConfig.fontFamily,
                    fontWeight: chatEditorConfig.fontWeight,
                    lineHeight: chatEditorConfig.lineHeight ? chatEditorConfig.lineHeight : ChatEditorOptions_1.lineHeightEm * chatEditorConfig.fontSize,
                    bracketPairColorization: {
                        enabled: this.configurationService.getValue('editor.bracketPairColorization.enabled'),
                        independentColorPoolPerBracketType: this.configurationService.getValue('editor.bracketPairColorization.independentColorPoolPerBracketType'),
                    },
                    wordWrap: chatEditorConfig.wordWrap,
                    fontLigatures: editorConfig.fontLigatures,
                }
            };
            this._onDidChange.fire();
        }
    };
    exports.ChatEditorOptions = ChatEditorOptions;
    exports.ChatEditorOptions = ChatEditorOptions = ChatEditorOptions_1 = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, views_1.IViewDescriptorService)
    ], ChatEditorOptions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0T3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0N6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVOztpQkFDeEIsaUJBQVksR0FBRyxHQUFHLEFBQU4sQ0FBTztRQU0zQyxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7aUJBRXVCLHVCQUFrQixHQUFHO1lBQzVDLHdCQUF3QjtZQUN4QixzQkFBc0I7WUFDdEIsd0JBQXdCO1lBQ3hCLHdCQUF3QjtZQUN4QixzQkFBc0I7WUFDdEIsdUJBQXVCO1lBQ3ZCLHNCQUFzQjtZQUN0Qiw2QkFBNkI7WUFDN0Isd0NBQXdDO1lBQ3hDLG1FQUFtRTtTQUNuRSxBQVh5QyxDQVd4QztRQUVGLFlBQ0MsTUFBMEIsRUFDVCxVQUFrQixFQUNsQiwwQkFBa0MsRUFDbEMsMkJBQW1DLEVBQzdCLG9CQUE0RCxFQUNwRSxZQUE0QyxFQUNuQyxxQkFBc0Q7WUFFOUUsS0FBSyxFQUFFLENBQUM7WUFQUyxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBUTtZQUNsQyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQVE7WUFDWix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUE1QjlELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QsZ0JBQVcsR0FBRyxJ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
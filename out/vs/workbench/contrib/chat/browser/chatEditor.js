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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/memento", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/browser/actions/chatClear", "vs/workbench/contrib/chat/common/chatAgents"], function (require, exports, contextkey_1, instantiation_1, serviceCollection_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, memento_1, chatEditorInput_1, chatWidget_1, chatClear_1, chatAgents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditor = void 0;
    let ChatEditor = class ChatEditor extends editorPane_1.EditorPane {
        get scopedContextKeyService() {
            return this._scopedContextKeyService;
        }
        constructor(group, telemetryService, themeService, instantiationService, storageService, contextKeyService) {
            super(chatEditorInput_1.ChatEditorInput.EditorID, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
        }
        async clear() {
            return this.instantiationService.invokeFunction(chatClear_1.clearChatEditor);
        }
        createEditor(parent) {
            this._scopedContextKeyService = this._register(this.contextKeyService.createScoped(parent));
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
            this.widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { resource: true }, { supportsFileReferences: true }, {
                listForeground: colorRegistry_1.editorForeground,
                listBackground: colorRegistry_1.editorBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            }));
            this._register(this.widget.onDidClear(() => this.clear()));
            this.widget.render(parent);
            this.widget.setVisible(true);
        }
        focus() {
            super.focus();
            this.widget?.focusInput();
        }
        clearInput() {
            this.saveState();
            super.clearInput();
        }
        async setInput(input, options, context, token) {
            super.setInput(input, options, context, token);
            const editorModel = await input.resolve();
            if (!editorModel) {
                throw new Error(`Failed to get model for chat editor. id: ${input.sessionId}`);
            }
            if (!this.widget) {
                throw new Error('ChatEditor lifecycle issue: no editor widget');
            }
            this.updateModel(editorModel.model, options?.viewState ?? input.options.viewState);
        }
        updateModel(model, viewState) {
            this._memento = new memento_1.Memento('interactive-session-editor-' + model.providerId, this.storageService);
            this._viewState = viewState ?? this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this.widget.setModel(model, { ...this._viewState });
        }
        saveState() {
            this.widget?.saveState();
            if (this._memento && this._viewState) {
                const widgetViewState = this.widget.getViewState();
                this._viewState.inputValue = widgetViewState.inputValue;
                this._memento.saveMemento();
            }
        }
        layout(dimension, position) {
            if (this.widget) {
                this.widget.layout(dimension.height, dimension.width);
            }
        }
    };
    exports.ChatEditor = ChatEditor;
    exports.ChatEditor = ChatEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, contextkey_1.IContextKeyService)
    ], ChatEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEJ6RixJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFXLFNBQVEsdUJBQVU7UUFJekMsSUFBYSx1QkFBdUI7WUFDbkMsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUM7UUFDdEMsQ0FBQztRQUtELFlBQ0MsS0FBbUIsRUFDQSxnQkFBbUMsRUFDdkMsWUFBMkIsRUFDRixvQkFBMkMsRUFDakQsY0FBK0IsRUFDNUIsaUJBQXFDO1lBRTFFLEtBQUssQ0FBQyxpQ0FBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBSi9DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzVCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7UUFHM0UsQ0FBQztRQUVNLEtBQUssQ0FBQyxLQUFLO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBZSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVrQixZQUFZLENBQUMsTUFBbUI7WUFDbEQsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLENBQUMsK0JBQWtCLEVBQUUsSUFBSSxDQUFD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
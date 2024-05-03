var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/services/output/common/output", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/workbench/common/views", "vs/workbench/common/editor/textResourceEditorInput", "vs/platform/opener/common/opener", "vs/base/browser/dom", "vs/base/common/async", "vs/platform/files/common/files", "vs/workbench/common/contextkeys", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/browser/editor", "vs/css!./output"], function (require, exports, nls, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, contextkey_1, textResourceEditor_1, output_1, themeService_1, configuration_1, editorGroupsService_1, editorService_1, viewPane_1, keybinding_1, contextView_1, views_1, textResourceEditorInput_1, opener_1, dom_1, async_1, files_1, contextkeys_1, serviceCollection_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputViewPane = void 0;
    let OutputViewPane = class OutputViewPane extends viewPane_1.ViewPane {
        get scrollLock() { return !!this.scrollLockContextKey.get(); }
        set scrollLock(scrollLock) { this.scrollLockContextKey.set(scrollLock); }
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorPromise = null;
            this.scrollLockContextKey = output_1.CONTEXT_OUTPUT_SCROLL_LOCK.bindTo(this.contextKeyService);
            const editorInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
            this.editor = editorInstantiationService.createInstance(OutputEditor);
            this._register(this.editor.onTitleAreaUpdate(() => {
                this.updateTitle(this.editor.getTitle());
                this.updateActions();
            }));
            this._register(this.onDidChangeBodyVisibility(() => this.onDidChangeVisibility(this.isBodyVisible())));
        }
        showChannel(channel, preserveFocus) {
            if (this.channelId !== channel.id) {
                this.setInput(channel);
            }
            if (!preserveFocus) {
                this.focus();
            }
        }
        focus() {
            super.focus();
            this.editorPromise?.then(() => this.editor.focus());
        }
        renderBody(container) {
            super.renderBody(container);
            this.editor.create(container);
            container.classList.add('output-view');
            const codeEditor = this.editor.getControl();
            codeEditor.setAriaOptions({ role: 'document', activeDescendant: undefined });
            this._register(codeEditor.onDidChangeModelContent(() => {
                if (!this.scrollLock) {
                    this.editor.revealLastLine();
                }
            }));
            this._register(codeEditor.onDidChangeCursorPosition((e) => {
                if (e.reason !== 3 /* CursorChangeReason.Explicit */) {
                    return;
                }
                if (!this.configurationService.getValue('output.smartScroll.enabled')) {
                    return;
                }
                const model = codeEditor.getModel();
                if (model) {
                    const newPositionLine = e.position.lineNumber;
                    const lastLine = model.getLineCount();
                    this.scrollLock = lastLine !== newPositionLine;
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.editor.layout(new dom_1.Dimension(width, height));
        }
        onDidChangeVisibility(visible) {
            this.editor.setVisible(visible);
            if (!visible) {
                this.clearInput();
            }
        }
        setInput(channel) {
            this.channelId = channel.id;
            const input = this.createInput(channel);
            if (!this.editor.input || !input.matches(this.editor.input)) {
                this.editorPromise?.cancel();
                this.editorPromise = (0, async_1.createCancelablePromise)(token => this.editor.setInput(this.createInput(channel), { preserveFocus: true }, Object.create(null), token)
                    .then(() => this.editor));
            }
        }
        clearInput() {
            this.channelId = undefined;
            this.editor.clearInput();
            this.editorPromise = null;
        }
        createInput(channel) {
            return this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, channel.uri, nls.localize('output model title', "{0} - Output", channel.label), nls.localize('channel', "Output channel for '{0}'", channel.label), undefined, undefined);
        }
    };
    exports.OutputViewPane = OutputViewPane;
    exports.OutputViewPane = OutputViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], OutputViewPane);
    let OutputEditor = class OutputEditor extends textResourceEditor_1.AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, configurationService, textResourceConfigurationService, themeService, editorGroupService, editorService, fileService) {
            super(output_1.OUTPUT_VIEW_ID, editorGroupService.activeGroup /* TODO@bpasero this is wrong */, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService, fileService);
            this.configurationService = configurationService;
            this.resourceContext = this._register(instantiationService.createInstance(contextkeys_1.ResourceContextKey));
        }
        getId() {
            return output_1.OUTPUT_VIEW_ID;
        }
        getTitle() {
            return nls.localize('output', "Output");
        }
        getConfigurationOverrides(configuration) {
            const options = super.getConfigurationOverrides(configuration);
            options.wordWrap = 'on'; // all output editors wrap
            options.lineNumbers = 'off'; // all output editors hide line numbers
            options.glyphMargin = false;
            options.lineDecorationsWidth = 20;
            options.rulers = [];
            options.folding = false;
            options.scrollBeyondLastLine = false;
            options.renderLineHighlight = 'none';
            options.minimap = { enabled: false };
            options.renderValidationDecorations = 'editable';
            options.padding = undefined;
            options.readOnly = true;
            options.domReadOnly = true;
            options.unicodeHighlight = {
                nonBasicASCII: false,
                invisibleCharacters: false,
                ambiguousCharacters: false,
            };
            const outputConfig = this.configurationService.getValue('[Log]');
            if (outputConfig) {
                if (outputConfig['editor.minimap.enabled']) {
                    options.minimap = { enabled: true };
                }
                if ('editor.wordWrap' in outputConfig) {
                    options.wordWrap = outputConfig['editor.wordWrap'];
                }
            }
            return options;
        }
        getAriaLabel() {
            return this.input ? this.input.getAriaLabel() : nls.localize('outputViewAriaLabel', "Output panel");
        }
        computeAriaLabel() {
            return this.input ? (0, editor_1.computeEditorAriaLabel)(this.input, undefined, undefined, this.editorGroupService.count) : this.getAriaLabel();
        }
        async setInput(input, options, context, token) {
            const focus = !(options && options.preserveFocus);
            if (this.input && input.matches(this.input)) {
                return;
            }
            if (this.input) {
                // Dispose previous input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            await super.setInput(input, options, context, token);
            this.resourceContext.set(input.resource);
            if (focus) {
                this.focus();
            }
            this.revealLastLine();
        }
        clearInput() {
            if (this.input) {
                // Dispose current input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            super.clearInput();
            this.resourceContext.reset();
        }
        createEditor(parent) {
            parent.setAttribute('role', 'document');
            super.createEditor(parent);
            const scopedContextKeyService = this.scopedContextKeyService;
            if (scopedContextKeyService) {
                output_1.CONTEXT_IN_OUTPUT.bindTo(scopedContextKeyService).set(true);
            }
        }
    };
    OutputEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, editorService_1.IEditorService),
        __param(8, files_1.IFileService)
    ], OutputEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Vmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0cHV0L2Jyb3dzZXIvb3V0cHV0Vmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBcUNPLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxtQkFBUTtRQU8zQyxJQUFJLFVBQVUsS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksVUFBVSxDQUFDLFVBQW1CLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEYsWUFDQyxPQUF5QixFQUNMLGlCQUFxQyxFQUNwQyxrQkFBdUMsRUFDckMsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUNqQyxxQkFBNkMsRUFDOUMsb0JBQTJDLEVBQ2xELGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3ZCLGdCQUFtQztZQUV0RCxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQWxCcEwsa0JBQWEsR0FBMkMsSUFBSSxDQUFDO1lBbUJwRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsbUNBQTBCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRXRGLE1BQU0sMEJBQTBCLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLElBQUkscUNBQWlCLENBQUMsQ0FBQywrQkFBa0IsRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FB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
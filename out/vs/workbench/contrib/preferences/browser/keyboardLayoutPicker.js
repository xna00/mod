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
define(["require", "exports", "vs/nls", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/workbench/common/contributions", "vs/workbench/contrib/preferences/common/preferences", "vs/base/common/platform", "vs/platform/quickinput/common/quickInput", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/buffer"], function (require, exports, nls, statusbar_1, lifecycle_1, keyboardLayout_1, contributions_1, preferences_1, platform_1, quickInput_1, actions_1, configuration_1, environment_1, files_1, editorService_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutPickerContribution = void 0;
    let KeyboardLayoutPickerContribution = class KeyboardLayoutPickerContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.keyboardLayoutPicker'; }
        constructor(keyboardLayoutService, statusbarService) {
            super();
            this.keyboardLayoutService = keyboardLayoutService;
            this.statusbarService = statusbarService;
            this.pickerElement = this._register(new lifecycle_1.MutableDisposable());
            const name = nls.localize('status.workbench.keyboardLayout', "Keyboard Layout");
            const layout = this.keyboardLayoutService.getCurrentKeyboardLayout();
            if (layout) {
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                this.pickerElement.value = this.statusbarService.addEntry({
                    name,
                    text,
                    ariaLabel: text,
                    command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                }, 'status.workbench.keyboardLayout', 1 /* StatusbarAlignment.RIGHT */);
            }
            this._register(this.keyboardLayoutService.onDidChangeKeyboardLayout(() => {
                const layout = this.keyboardLayoutService.getCurrentKeyboardLayout();
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                if (this.pickerElement.value) {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value.update({
                        name,
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    });
                }
                else {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value = this.statusbarService.addEntry({
                        name,
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    }, 'status.workbench.keyboardLayout', 1 /* StatusbarAlignment.RIGHT */);
                }
            }));
        }
    };
    exports.KeyboardLayoutPickerContribution = KeyboardLayoutPickerContribution;
    exports.KeyboardLayoutPickerContribution = KeyboardLayoutPickerContribution = __decorate([
        __param(0, keyboardLayout_1.IKeyboardLayoutService),
        __param(1, statusbar_1.IStatusbarService)
    ], KeyboardLayoutPickerContribution);
    (0, contributions_1.registerWorkbenchContribution2)(KeyboardLayoutPickerContribution.ID, KeyboardLayoutPickerContribution, 1 /* WorkbenchPhase.BlockStartup */);
    const DEFAULT_CONTENT = [
        `// ${nls.localize('displayLanguage', 'Defines the keyboard layout used in VS Code in the browser environment.')}`,
        `// ${nls.localize('doc', 'Open VS Code and run "Developer: Inspect Key Mappings (JSON)" from Command Palette.')}`,
        ``,
        `// Once you have the keyboard layout info, please paste it below.`,
        '\n'
    ].join('\n');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER,
                title: nls.localize2('keyboard.chooseLayout', "Change Keyboard Layout"),
                f1: true
            });
        }
        async run(accessor) {
            const keyboardLayoutService = accessor.get(keyboardLayout_1.IKeyboardLayoutService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const layouts = keyboardLayoutService.getAllKeyboardLayouts();
            const currentLayout = keyboardLayoutService.getCurrentKeyboardLayout();
            const layoutConfig = configurationService.getValue('keyboard.layout');
            const isAutoDetect = layoutConfig === 'autodetect';
            const picks = layouts.map(layout => {
                const picked = !isAutoDetect && (0, keyboardLayout_1.areKeyboardLayoutsEqual)(currentLayout, layout);
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                return {
                    layout: layout,
                    label: [layoutInfo.label, (layout && layout.isUserKeyboardLayout) ? '(User configured layout)' : ''].join(' '),
                    id: layout.text || layout.lang || layout.layout,
                    description: layoutInfo.description + (picked ? ' (Current layout)' : ''),
                    picked: !isAutoDetect && (0, keyboardLayout_1.areKeyboardLayoutsEqual)(currentLayout, layout)
                };
            }).sort((a, b) => {
                return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
            });
            if (picks.length > 0) {
                const platform = platform_1.isMacintosh ? 'Mac' : platform_1.isWindows ? 'Win' : 'Linux';
                picks.unshift({ type: 'separator', label: nls.localize('layoutPicks', "Keyboard Layouts ({0})", platform) });
            }
            const configureKeyboardLayout = { label: nls.localize('configureKeyboardLayout', "Configure Keyboard Layout") };
            picks.unshift(configureKeyboardLayout);
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: nls.localize('autoDetect', "Auto Detect"),
                description: isAutoDetect ? `Current: ${(0, keyboardLayout_1.parseKeyboardLayoutDescription)(currentLayout).label}` : undefined,
                picked: isAutoDetect ? true : undefined
            };
            picks.unshift(autoDetectMode);
            const pick = await quickInputService.pick(picks, { placeHolder: nls.localize('pickKeyboardLayout', "Select Keyboard Layout"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === autoDetectMode) {
                // set keymap service to auto mode
                configurationService.updateValue('keyboard.layout', 'autodetect');
                return;
            }
            if (pick === configureKeyboardLayout) {
                const file = environmentService.keyboardLayoutResource;
                await fileService.stat(file).then(undefined, () => {
                    return fileService.createFile(file, buffer_1.VSBuffer.fromString(DEFAULT_CONTENT));
                }).then((stat) => {
                    if (!stat) {
                        return undefined;
                    }
                    return editorService.openEditor({
                        resource: stat.resource,
                        languageId: 'jsonc',
                        options: { pinned: true }
                    });
                }, (error) => {
                    throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", file.toString(), error));
                });
                return Promise.resolve();
            }
            configurationService.updateValue('keyboard.layout', (0, keyboardLayout_1.getKeyboardLayoutId)(pick.layout));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXRQaWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5Ym9hcmRMYXlvdXRQaWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVO2lCQUUvQyxPQUFFLEdBQUcsd0NBQXdDLEFBQTNDLENBQTRDO1FBSTlELFlBQ3lCLHFCQUE4RCxFQUNuRSxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFIaUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNsRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBSnZELGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFRakcsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRWhGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ3JFLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxVQUFVLEdBQUcsSUFBQSwrQ0FBOEIsRUFBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUU3RSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUN4RDtvQkFDQyxJQUFJO29CQUNKLElB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
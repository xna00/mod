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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/platform", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput", "vs/workbench/services/preferences/browser/keybindingsEditorModel"], function (require, exports, codicons_1, platform_1, nls, instantiation_1, iconRegistry_1, editorInput_1, keybindingsEditorModel_1) {
    "use strict";
    var KeybindingsEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorInput = void 0;
    const KeybindingsEditorIcon = (0, iconRegistry_1.registerIcon)('keybindings-editor-label-icon', codicons_1.Codicon.keyboard, nls.localize('keybindingsEditorLabelIcon', 'Icon of the keybindings editor label.'));
    let KeybindingsEditorInput = class KeybindingsEditorInput extends editorInput_1.EditorInput {
        static { KeybindingsEditorInput_1 = this; }
        static { this.ID = 'workbench.input.keybindings'; }
        constructor(instantiationService) {
            super();
            this.searchOptions = null;
            this.resource = undefined;
            this.keybindingsModel = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS);
        }
        get typeId() {
            return KeybindingsEditorInput_1.ID;
        }
        getName() {
            return nls.localize('keybindingsInputName', "Keyboard Shortcuts");
        }
        getIcon() {
            return KeybindingsEditorIcon;
        }
        async resolve() {
            return this.keybindingsModel;
        }
        matches(otherInput) {
            return otherInput instanceof KeybindingsEditorInput_1;
        }
        dispose() {
            this.keybindingsModel.dispose();
            super.dispose();
        }
    };
    exports.KeybindingsEditorInput = KeybindingsEditorInput;
    exports.KeybindingsEditorInput = KeybindingsEditorInput = KeybindingsEditorInput_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], KeybindingsEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5YmluZGluZ3NFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxNQUFNLHFCQUFxQixHQUFHLElBQUEsMkJBQVksRUFBQywrQkFBK0IsRUFBRSxrQkFBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUU1SyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHlCQUFXOztpQkFFdEMsT0FBRSxHQUFXLDZCQUE2QixBQUF4QyxDQUF5QztRQU8zRCxZQUFtQyxvQkFBMkM7WUFDN0UsS0FBSyxFQUFFLENBQUM7WUFMVCxrQkFBYSxHQUEyQyxJQUFJLENBQUM7WUFFcEQsYUFBUSxHQUFHLFNBQVMsQ0FBQztZQUs3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtDQUFzQixFQUFFLGFBQUUsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyx3QkFBc0IsQ0FBQyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVRLE9BQU87WUFDZixPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8scUJBQXFCLENBQUM7UUFDOUIsQ0FBQztRQUVRLEtBQUssQ0FBQyxPQUFPO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFFUSxPQUFPLENBQUMsVUFBNkM7WUFDN0QsT0FBTyxVQUFVLFlBQVksd0JBQXNCLENBQUM7UUFDckQsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7O0lBdkNXLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBU3JCLFdBQUEscUNBQXFCLENBQUE7T0FUdEIsc0JBQXNCLENBd0NsQyJ9
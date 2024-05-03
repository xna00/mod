/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor/editorInput", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, uri_1, editorInput_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuntimeExtensionsInput = void 0;
    const RuntimeExtensionsEditorIcon = (0, iconRegistry_1.registerIcon)('runtime-extensions-editor-label-icon', codicons_1.Codicon.extensions, nls.localize('runtimeExtensionEditorLabelIcon', 'Icon of the runtime extensions editor label.'));
    class RuntimeExtensionsInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = uri_1.URI.from({
                scheme: 'runtime-extensions',
                path: 'default'
            });
        }
        static { this.ID = 'workbench.runtimeExtensions.input'; }
        get typeId() {
            return RuntimeExtensionsInput.ID;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        static get instance() {
            if (!RuntimeExtensionsInput._instance || RuntimeExtensionsInput._instance.isDisposed()) {
                RuntimeExtensionsInput._instance = new RuntimeExtensionsInput();
            }
            return RuntimeExtensionsInput._instance;
        }
        getName() {
            return nls.localize('extensionsInputName', "Running Extensions");
        }
        getIcon() {
            return RuntimeExtensionsEditorIcon;
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return other instanceof RuntimeExtensionsInput;
        }
    }
    exports.RuntimeExtensionsInput = RuntimeExtensionsInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZUV4dGVuc2lvbnNJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9jb21tb24vcnVudGltZUV4dGVuc2lvbnNJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBTSwyQkFBMkIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsc0NBQXNDLEVBQUUsa0JBQU8sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDLENBQUM7SUFFOU0sTUFBYSxzQkFBdUIsU0FBUSx5QkFBVztRQUF2RDs7WUFxQlUsYUFBUSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQzVCLE1BQU0sRUFBRSxvQkFBb0I7Z0JBQzVCLElBQUksRUFBRSxTQUFTO2FBQ2YsQ0FBQyxDQUFDO1FBZ0JKLENBQUM7aUJBdENnQixPQUFFLEdBQUcsbUNBQW1DLEFBQXRDLENBQXVDO1FBRXpELElBQWEsTUFBTTtZQUNsQixPQUFPLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBYSxZQUFZO1lBQ3hCLE9BQU8sb0ZBQW9FLENBQUM7UUFDN0UsQ0FBQztRQUdELE1BQU0sS0FBSyxRQUFRO1lBQ2xCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hGLHNCQUFzQixDQUFDLFNBQVMsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDakUsQ0FBQztZQUVELE9BQU8sc0JBQXNCLENBQUMsU0FBUyxDQUFDO1FBQ3pDLENBQUM7UUFPUSxPQUFPO1lBQ2YsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVRLE9BQU87WUFDZixPQUFPLDJCQUEyQixDQUFDO1FBQ3BDLENBQUM7UUFFUSxPQUFPLENBQUMsS0FBd0M7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxZQUFZLHNCQUFzQixDQUFDO1FBQ2hELENBQUM7O0lBdkNGLHdEQXdDQyJ9
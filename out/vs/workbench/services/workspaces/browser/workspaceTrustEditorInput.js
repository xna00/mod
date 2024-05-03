/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput"], function (require, exports, codicons_1, network_1, uri_1, nls_1, iconRegistry_1, editorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustEditorInput = void 0;
    const WorkspaceTrustEditorIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-label-icon', codicons_1.Codicon.shield, (0, nls_1.localize)('workspaceTrustEditorLabelIcon', 'Icon of the workspace trust editor label.'));
    class WorkspaceTrustEditorInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeWorkspaceTrust,
                path: `workspaceTrustEditor`
            });
        }
        static { this.ID = 'workbench.input.workspaceTrust'; }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        get typeId() {
            return WorkspaceTrustEditorInput.ID;
        }
        matches(otherInput) {
            return super.matches(otherInput) || otherInput instanceof WorkspaceTrustEditorInput;
        }
        getName() {
            return (0, nls_1.localize)('workspaceTrustEditorInputName', "Workspace Trust");
        }
        getIcon() {
            return WorkspaceTrustEditorIcon;
        }
    }
    exports.WorkspaceTrustEditorInput = WorkspaceTrustEditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3RFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvYnJvd3Nlci93b3Jrc3BhY2VUcnVzdEVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFNLHdCQUF3QixHQUFHLElBQUEsMkJBQVksRUFBQyxtQ0FBbUMsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDLENBQUM7SUFFM0wsTUFBYSx5QkFBMEIsU0FBUSx5QkFBVztRQUExRDs7WUFXVSxhQUFRLEdBQVEsU0FBRyxDQUFDLElBQUksQ0FBQztnQkFDakMsTUFBTSxFQUFFLGlCQUFPLENBQUMsb0JBQW9CO2dCQUNwQyxJQUFJLEVBQUUsc0JBQXNCO2FBQzVCLENBQUMsQ0FBQztRQWFKLENBQUM7aUJBMUJnQixPQUFFLEdBQVcsZ0NBQWdDLEFBQTNDLENBQTRDO1FBRTlELElBQWEsWUFBWTtZQUN4QixPQUFPLG9GQUFvRSxDQUFDO1FBQzdFLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyx5QkFBeUIsQ0FBQyxFQUFFLENBQUM7UUFDckMsQ0FBQztRQU9RLE9BQU8sQ0FBQyxVQUE2QztZQUM3RCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksVUFBVSxZQUFZLHlCQUF5QixDQUFDO1FBQ3JGLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyx3QkFBd0IsQ0FBQztRQUNqQyxDQUFDOztJQTFCRiw4REEyQkMifQ==
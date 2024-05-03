/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, editorInput_1, nls_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewInput = void 0;
    const DisassemblyEditorIcon = (0, iconRegistry_1.registerIcon)('disassembly-editor-label-icon', codicons_1.Codicon.debug, (0, nls_1.localize)('disassemblyEditorLabelIcon', 'Icon of the disassembly editor label.'));
    class DisassemblyViewInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        static { this.ID = 'debug.disassemblyView.input'; }
        get typeId() {
            return DisassemblyViewInput.ID;
        }
        static get instance() {
            if (!DisassemblyViewInput._instance || DisassemblyViewInput._instance.isDisposed()) {
                DisassemblyViewInput._instance = new DisassemblyViewInput();
            }
            return DisassemblyViewInput._instance;
        }
        getName() {
            return (0, nls_1.localize)('disassemblyInputName', "Disassembly");
        }
        getIcon() {
            return DisassemblyEditorIcon;
        }
        matches(other) {
            return other instanceof DisassemblyViewInput;
        }
    }
    exports.DisassemblyViewInput = DisassemblyViewInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzYXNzZW1ibHlWaWV3SW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kaXNhc3NlbWJseVZpZXdJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsK0JBQStCLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsdUNBQXVDLENBQUMsQ0FBQyxDQUFDO0lBRTVLLE1BQWEsb0JBQXFCLFNBQVEseUJBQVc7UUFBckQ7O1lBaUJVLGFBQVEsR0FBRyxTQUFTLENBQUM7UUFjL0IsQ0FBQztpQkE3QmdCLE9BQUUsR0FBRyw2QkFBNkIsQUFBaEMsQ0FBaUM7UUFFbkQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sb0JBQW9CLENBQUMsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFHRCxNQUFNLEtBQUssUUFBUTtZQUNsQixJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxJQUFJLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNwRixvQkFBb0IsQ0FBQyxTQUFTLEdBQUcsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1lBQzdELENBQUM7WUFFRCxPQUFPLG9CQUFvQixDQUFDLFNBQVMsQ0FBQztRQUN2QyxDQUFDO1FBSVEsT0FBTztZQUNmLE9BQU8sSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVRLE9BQU87WUFDZixPQUFPLHFCQUFxQixDQUFDO1FBQzlCLENBQUM7UUFFUSxPQUFPLENBQUMsS0FBYztZQUM5QixPQUFPLEtBQUssWUFBWSxvQkFBb0IsQ0FBQztRQUM5QyxDQUFDOztJQTdCRixvREErQkMifQ==
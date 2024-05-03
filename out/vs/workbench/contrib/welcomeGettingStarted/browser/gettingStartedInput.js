/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor/editorInput", "vs/base/common/uri", "vs/base/common/network", "vs/css!./media/gettingStarted"], function (require, exports, nls_1, editorInput_1, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedInput = exports.gettingStartedInputTypeId = void 0;
    exports.gettingStartedInputTypeId = 'workbench.editors.gettingStartedInput';
    class GettingStartedInput extends editorInput_1.EditorInput {
        static { this.ID = exports.gettingStartedInputTypeId; }
        static { this.RESOURCE = uri_1.URI.from({ scheme: network_1.Schemas.walkThrough, authority: 'vscode_getting_started_page' }); }
        get typeId() {
            return GettingStartedInput.ID;
        }
        get editorId() {
            return this.typeId;
        }
        toUntyped() {
            return {
                resource: GettingStartedInput.RESOURCE,
                options: {
                    override: GettingStartedInput.ID,
                    pinned: false
                }
            };
        }
        get resource() {
            return GettingStartedInput.RESOURCE;
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof GettingStartedInput) {
                return other.selectedCategory === this.selectedCategory;
            }
            return false;
        }
        constructor(options) {
            super();
            this.selectedCategory = options.selectedCategory;
            this.selectedStep = options.selectedStep;
            this.showTelemetryNotice = !!options.showTelemetryNotice;
        }
        getName() {
            return (0, nls_1.localize)('getStarted', "Welcome");
        }
    }
    exports.GettingStartedInput = GettingStartedInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZUdldHRpbmdTdGFydGVkL2Jyb3dzZXIvZ2V0dGluZ1N0YXJ0ZWRJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVbkYsUUFBQSx5QkFBeUIsR0FBRyx1Q0FBdUMsQ0FBQztJQU1qRixNQUFhLG1CQUFvQixTQUFRLHlCQUFXO2lCQUVuQyxPQUFFLEdBQUcsaUNBQXlCLENBQUM7aUJBQy9CLGFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDLENBQUM7UUFFL0csSUFBYSxNQUFNO1lBQ2xCLE9BQU8sbUJBQW1CLENBQUMsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFUSxTQUFTO1lBQ2pCLE9BQU87Z0JBQ04sUUFBUSxFQUFFLG1CQUFtQixDQUFDLFFBQVE7Z0JBQ3RDLE9BQU8sRUFBRTtvQkFDUixRQUFRLEVBQUUsbUJBQW1CLENBQUMsRUFBRTtvQkFDaEMsTUFBTSxFQUFFLEtBQUs7aUJBQ2I7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sbUJBQW1CLENBQUMsUUFBUSxDQUFDO1FBQ3JDLENBQUM7UUFFUSxPQUFPLENBQUMsS0FBd0M7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksS0FBSyxZQUFZLG1CQUFtQixFQUFFLENBQUM7Z0JBQzFDLE9BQU8sS0FBSyxDQUFDLGdCQUFnQixLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsWUFDQyxPQUFvQztZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQzFELENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUMsQ0FBQzs7SUFqREYsa0RBc0RDIn0=
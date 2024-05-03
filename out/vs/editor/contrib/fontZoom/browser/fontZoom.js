/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorZoom", "vs/nls"], function (require, exports, editorExtensions_1, editorZoom_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditorFontZoomIn extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomIn',
                label: nls.localize('EditorFontZoomIn.label', "Increase Editor Font Size"),
                alias: 'Increase Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() + 1);
        }
    }
    class EditorFontZoomOut extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomOut',
                label: nls.localize('EditorFontZoomOut.label', "Decrease Editor Font Size"),
                alias: 'Decrease Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() - 1);
        }
    }
    class EditorFontZoomReset extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomReset',
                label: nls.localize('EditorFontZoomReset.label', "Reset Editor Font Size"),
                alias: 'Reset Editor Font Size',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(0);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomIn);
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomOut);
    (0, editorExtensions_1.registerEditorAction)(EditorFontZoomReset);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udFpvb20uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZvbnRab29tL2Jyb3dzZXIvZm9udFpvb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxnQkFBaUIsU0FBUSwrQkFBWTtRQUUxQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMEJBQTBCO2dCQUM5QixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSwyQkFBMkIsQ0FBQztnQkFDMUUsS0FBSyxFQUFFLDJCQUEyQjtnQkFDbEMsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3pELHVCQUFVLENBQUMsWUFBWSxDQUFDLHVCQUFVLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNEO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSwrQkFBWTtRQUUzQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMkJBQTJCO2dCQUMvQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSwyQkFBMkIsQ0FBQztnQkFDM0UsS0FBSyxFQUFFLDJCQUEyQjtnQkFDbEMsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3pELHVCQUFVLENBQUMsWUFBWSxDQUFDLHVCQUFVLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNEO0lBRUQsTUFBTSxtQkFBb0IsU0FBUSwrQkFBWTtRQUU3QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNkJBQTZCO2dCQUNqQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSx3QkFBd0IsQ0FBQztnQkFDMUUsS0FBSyxFQUFFLHdCQUF3QjtnQkFDL0IsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3pELHVCQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUM7S0FDRDtJQUVELElBQUEsdUNBQW9CLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN2QyxJQUFBLHVDQUFvQixFQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDeEMsSUFBQSx1Q0FBb0IsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDIn0=
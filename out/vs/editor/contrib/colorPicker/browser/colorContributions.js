/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/colorPicker/browser/colorHoverParticipant", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/hover/browser/hoverTypes"], function (require, exports, lifecycle_1, editorExtensions_1, range_1, colorDetector_1, colorHoverParticipant_1, hover_1, hoverTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorContribution = void 0;
    class ColorContribution extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.colorContribution'; }
        static { this.RECOMPUTE_TIME = 1000; } // ms
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._register(_editor.onMouseDown((e) => this.onMouseDown(e)));
        }
        dispose() {
            super.dispose();
        }
        onMouseDown(mouseEvent) {
            const colorDecoratorsActivatedOn = this._editor.getOption(148 /* EditorOption.colorDecoratorsActivatedOn */);
            if (colorDecoratorsActivatedOn !== 'click' && colorDecoratorsActivatedOn !== 'clickAndHover') {
                return;
            }
            const target = mouseEvent.target;
            if (target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return;
            }
            if (!target.detail.injectedText) {
                return;
            }
            if (target.detail.injectedText.options.attachedData !== colorDetector_1.ColorDecorationInjectedTextMarker) {
                return;
            }
            if (!target.range) {
                return;
            }
            const hoverController = this._editor.getContribution(hover_1.HoverController.ID);
            if (!hoverController) {
                return;
            }
            if (!hoverController.isColorPickerVisible) {
                const range = new range_1.Range(target.range.startLineNumber, target.range.startColumn + 1, target.range.endLineNumber, target.range.endColumn + 1);
                hoverController.showContentHover(range, 1 /* HoverStartMode.Immediate */, 0 /* HoverStartSource.Mouse */, false, true);
            }
        }
    }
    exports.ColorContribution = ColorContribution;
    (0, editorExtensions_1.registerEditorContribution)(ColorContribution.ID, ColorContribution, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    hoverTypes_1.HoverParticipantRegistry.register(colorHoverParticipant_1.ColorHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JDb250cmlidXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2xvclBpY2tlci9icm93c2VyL2NvbG9yQ29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxpQkFBa0IsU0FBUSxzQkFBVTtpQkFFekIsT0FBRSxHQUFXLGtDQUFrQyxDQUFDO2lCQUV2RCxtQkFBYyxHQUFHLElBQUksQ0FBQyxHQUFDLEtBQUs7UUFFNUMsWUFBNkIsT0FBb0I7WUFFaEQsS0FBSyxFQUFFLENBQUM7WUFGb0IsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUdoRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTyxXQUFXLENBQUMsVUFBNkI7WUFFaEQsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsbURBQXlDLENBQUM7WUFDbkcsSUFBSSwwQkFBMEIsS0FBSyxPQUFPLElBQUksMEJBQTBCLEtBQUssZUFBZSxFQUFFLENBQUM7Z0JBQzlGLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUVqQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLHlDQUFpQyxFQUFFLENBQUM7Z0JBQ2xELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxLQUFLLGlEQUFpQyxFQUFFLENBQUM7Z0JBQzNGLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBa0IsdUJBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxRixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzVJLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLG9FQUFvRCxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEcsQ0FBQztRQUNGLENBQUM7O0lBakRGLDhDQWtEQztJQUVELElBQUEsNkNBQTBCLEVBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixpRUFBeUQsQ0FBQztJQUM1SCxxQ0FBd0IsQ0FBQyxRQUFRLENBQUMsNkNBQXFCLENBQUMsQ0FBQyJ9
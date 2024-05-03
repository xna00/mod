/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stopwatch", "vs/editor/browser/editorExtensions", "vs/nls"], function (require, exports, stopwatch_1, editorExtensions_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ForceRetokenizeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.forceRetokenize',
                label: nls.localize('forceRetokenize', "Developer: Force Retokenize"),
                alias: 'Developer: Force Retokenize',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            model.tokenization.resetTokenization();
            const sw = new stopwatch_1.StopWatch();
            model.tokenization.forceTokenization(model.getLineCount());
            sw.stop();
            console.log(`tokenization took ${sw.elapsed()}`);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ForceRetokenizeAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi90b2tlbml6YXRpb24vYnJvd3Nlci90b2tlbml6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxxQkFBc0IsU0FBUSwrQkFBWTtRQUMvQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsK0JBQStCO2dCQUNuQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSw2QkFBNkIsQ0FBQztnQkFDckUsS0FBSyxFQUFFLDZCQUE2QjtnQkFDcEMsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3pELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sRUFBRSxHQUFHLElBQUkscUJBQVMsRUFBRSxDQUFDO1lBQzNCLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDM0QsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVsRCxDQUFDO0tBQ0Q7SUFFRCxJQUFBLHVDQUFvQixFQUFDLHFCQUFxQixDQUFDLENBQUMifQ==
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions"], function (require, exports, lifecycle_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuPreventer = void 0;
    /**
     * Prevents the top-level menu from showing up when doing Alt + Click in the editor
     */
    class MenuPreventer extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.menuPreventer'; }
        constructor(editor) {
            super();
            this._editor = editor;
            this._altListeningMouse = false;
            this._altMouseTriggered = false;
            // A global crossover handler to prevent menu bar from showing up
            // When <alt> is hold, we will listen to mouse events and prevent
            // the release event up <alt> if the mouse is triggered.
            this._register(this._editor.onMouseDown((e) => {
                if (this._altListeningMouse) {
                    this._altMouseTriggered = true;
                }
            }));
            this._register(this._editor.onKeyDown((e) => {
                if (e.equals(512 /* KeyMod.Alt */)) {
                    if (!this._altListeningMouse) {
                        this._altMouseTriggered = false;
                    }
                    this._altListeningMouse = true;
                }
            }));
            this._register(this._editor.onKeyUp((e) => {
                if (e.equals(512 /* KeyMod.Alt */)) {
                    if (this._altMouseTriggered) {
                        e.preventDefault();
                    }
                    this._altListeningMouse = false;
                    this._altMouseTriggered = false;
                }
            }));
        }
    }
    exports.MenuPreventer = MenuPreventer;
    (0, editorExtensions_1.registerEditorContribution)(MenuPreventer.ID, MenuPreventer, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudVByZXZlbnRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL21lbnVQcmV2ZW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHOztPQUVHO0lBQ0gsTUFBYSxhQUFjLFNBQVEsc0JBQVU7aUJBRXJCLE9BQUUsR0FBRyw4QkFBOEIsQ0FBQztRQU0zRCxZQUFZLE1BQW1CO1lBQzlCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztZQUNoQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1lBRWhDLGlFQUFpRTtZQUNqRSxpRUFBaUU7WUFDakUsd0RBQXdEO1lBRXhELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxDQUFDLE1BQU0sc0JBQVksRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7d0JBQzlCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7b0JBQ2pDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxDQUFDLE1BQU0sc0JBQVksRUFBRSxDQUFDO29CQUMxQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO3dCQUM3QixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3BCLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztvQkFDaEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDOztJQTFDRixzQ0EyQ0M7SUFFRCxJQUFBLDZDQUEwQixFQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsYUFBYSxpRUFBeUQsQ0FBQyJ9
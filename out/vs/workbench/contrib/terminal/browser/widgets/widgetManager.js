/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWidgetManager = void 0;
    class TerminalWidgetManager {
        constructor() {
            this._attached = new Map();
        }
        attachToElement(terminalWrapper) {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.classList.add('terminal-widget-container');
                terminalWrapper.appendChild(this._container);
            }
        }
        dispose() {
            if (this._container && this._container.parentElement) {
                this._container.parentElement.removeChild(this._container);
                this._container = undefined;
            }
        }
        attachWidget(widget) {
            if (!this._container) {
                return;
            }
            this._attached.get(widget.id)?.dispose();
            widget.attach(this._container);
            this._attached.set(widget.id, widget);
            return {
                dispose: () => {
                    const current = this._attached.get(widget.id);
                    if (current === widget) {
                        this._attached.delete(widget.id);
                        widget.dispose();
                    }
                }
            };
        }
    }
    exports.TerminalWidgetManager = TerminalWidgetManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci93aWRnZXRzL3dpZGdldE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEscUJBQXFCO1FBQWxDO1lBRVMsY0FBUyxHQUFpQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBa0M3RCxDQUFDO1FBaENBLGVBQWUsQ0FBQyxlQUE0QjtZQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUMzRCxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUFZLENBQUMsTUFBdUI7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0QyxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLE9BQU8sS0FBSyxNQUFNLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNqQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2xCLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFwQ0Qsc0RBb0NDIn0=
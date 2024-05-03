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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/common/contributions", "vs/base/common/platform", "vs/platform/clipboard/common/clipboardService", "vs/base/browser/mouseEvent", "vs/base/common/event", "vs/base/common/lazy"], function (require, exports, actions_1, nls_1, layoutService_1, contextView_1, lifecycle_1, dom_1, contributions_1, platform_1, clipboardService_1, mouseEvent_1, event_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextInputActionsProvider = void 0;
    let TextInputActionsProvider = class TextInputActionsProvider extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.textInputActionsProvider'; }
        constructor(layoutService, contextMenuService, clipboardService) {
            super();
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.clipboardService = clipboardService;
            this.textInputActions = new lazy_1.Lazy(() => this.createActions());
            this.registerListeners();
        }
        createActions() {
            return [
                // Undo/Redo
                new actions_1.Action('undo', (0, nls_1.localize)('undo', "Undo"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('undo')),
                new actions_1.Action('redo', (0, nls_1.localize)('redo', "Redo"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('redo')),
                new actions_1.Separator(),
                // Cut / Copy / Paste
                new actions_1.Action('editor.action.clipboardCutAction', (0, nls_1.localize)('cut', "Cut"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('cut')),
                new actions_1.Action('editor.action.clipboardCopyAction', (0, nls_1.localize)('copy', "Copy"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('copy')),
                new actions_1.Action('editor.action.clipboardPasteAction', (0, nls_1.localize)('paste', "Paste"), undefined, true, async (element) => {
                    // Native: paste is supported
                    if (platform_1.isNative) {
                        (0, dom_1.getActiveDocument)().execCommand('paste');
                    }
                    // Web: paste is not supported due to security reasons
                    else {
                        const clipboardText = await this.clipboardService.readText();
                        if (element instanceof HTMLTextAreaElement ||
                            element instanceof HTMLInputElement) {
                            const selectionStart = element.selectionStart || 0;
                            const selectionEnd = element.selectionEnd || 0;
                            element.value = `${element.value.substring(0, selectionStart)}${clipboardText}${element.value.substring(selectionEnd, element.value.length)}`;
                            element.selectionStart = selectionStart + clipboardText.length;
                            element.selectionEnd = element.selectionStart;
                            element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        }
                    }
                }),
                new actions_1.Separator(),
                // Select All
                new actions_1.Action('editor.action.selectAll', (0, nls_1.localize)('selectAll', "Select All"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('selectAll'))
            ];
        }
        registerListeners() {
            // Context menu support in input/textarea
            this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(container, 'contextmenu', e => this.onContextMenu((0, dom_1.getWindow)(container), e)));
            }, { container: this.layoutService.mainContainer, disposables: this._store }));
        }
        onContextMenu(targetWindow, e) {
            if (e.defaultPrevented) {
                return; // make sure to not show these actions by accident if component indicated to prevent
            }
            const target = e.target;
            if (!(target instanceof HTMLElement) || (target.nodeName.toLowerCase() !== 'input' && target.nodeName.toLowerCase() !== 'textarea')) {
                return; // only for inputs or textareas
            }
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => this.textInputActions.value,
                getActionsContext: () => target,
            });
        }
    };
    exports.TextInputActionsProvider = TextInputActionsProvider;
    exports.TextInputActionsProvider = TextInputActionsProvider = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, clipboardService_1.IClipboardService)
    ], TextInputActionsProvider);
    (0, contributions_1.registerWorkbenchContribution2)(TextInputActionsProvider.ID, TextInputActionsProvider, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dElucHV0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy90ZXh0SW5wdXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO2lCQUV2QyxPQUFFLEdBQUcsNENBQTRDLEFBQS9DLENBQWdEO1FBSWxFLFlBQzBCLGFBQXVELEVBQzNELGtCQUF3RCxFQUMxRCxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFKa0Msa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQzFDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUx2RCxxQkFBZ0IsR0FBRyxJQUFJLFdBQUksQ0FBWSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQVNuRixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8sYUFBYTtZQUNwQixPQUFPO2dCQUVOLFlBQVk7Z0JBQ1osSUFBSSxnQkFBTSxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLElBQUEsdUJBQWlCLEdBQUUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xILElBQUksZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHVC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
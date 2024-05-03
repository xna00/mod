/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/window/electron-sandbox/window", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/native/common/native", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/base/common/platform", "vs/base/browser/dom", "vs/platform/window/common/window", "vs/css!./media/actions"], function (require, exports, uri_1, nls_1, window_1, keybinding_1, browser_1, files_1, model_1, language_1, quickInput_1, getIconClasses_1, configuration_1, native_1, codicons_1, themables_1, workspace_1, actions_1, actionCommonCategories_1, platform_1, dom_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleWindowTabsBarHandler = exports.MergeWindowTabsHandlerHandler = exports.MoveWindowTabToNewWindowHandler = exports.ShowNextWindowTabHandler = exports.ShowPreviousWindowTabHandler = exports.NewWindowTabHandler = exports.QuickSwitchWindowAction = exports.SwitchWindowAction = exports.ZoomResetAction = exports.ZoomOutAction = exports.ZoomInAction = exports.CloseWindowAction = void 0;
    class CloseWindowAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.closeWindow'; }
        constructor() {
            super({
                id: CloseWindowAction.ID,
                title: {
                    ...(0, nls_1.localize2)('closeWindow', "Close Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miCloseWindow', comment: ['&& denotes a mnemonic'] }, "Clos&&e Window"),
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */ },
                    linux: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] },
                    win: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] }
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '6_close',
                    order: 4
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.closeWindow({ targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId });
        }
    }
    exports.CloseWindowAction = CloseWindowAction;
    class BaseZoomAction extends actions_1.Action2 {
        static { this.ZOOM_LEVEL_SETTING_KEY = 'window.zoomLevel'; }
        static { this.ZOOM_PER_WINDOW_SETTING_KEY = 'window.zoomPerWindow'; }
        constructor(desc) {
            super(desc);
        }
        async setZoomLevel(accessor, levelOrReset) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let target;
            if (configurationService.getValue(BaseZoomAction.ZOOM_PER_WINDOW_SETTING_KEY) !== false) {
                target = window_1.ApplyZoomTarget.ACTIVE_WINDOW;
            }
            else {
                target = window_1.ApplyZoomTarget.ALL_WINDOWS;
            }
            let level;
            if (typeof levelOrReset === 'number') {
                level = Math.round(levelOrReset); // prevent fractional zoom levels
            }
            else {
                // reset to 0 when we apply to all windows
                if (target === window_1.ApplyZoomTarget.ALL_WINDOWS) {
                    level = 0;
                }
                // otherwise, reset to the default zoom level
                else {
                    const defaultLevel = configurationService.getValue(BaseZoomAction.ZOOM_LEVEL_SETTING_KEY);
                    if (typeof defaultLevel === 'number') {
                        level = defaultLevel;
                    }
                    else {
                        level = 0;
                    }
                }
            }
            if (level > window_1.MAX_ZOOM_LEVEL || level < window_1.MIN_ZOOM_LEVEL) {
                return; // https://github.com/microsoft/vscode/issues/48357
            }
            if (target === window_1.ApplyZoomTarget.ALL_WINDOWS) {
                await configurationService.updateValue(BaseZoomAction.ZOOM_LEVEL_SETTING_KEY, level);
            }
            (0, window_1.applyZoom)(level, target);
        }
    }
    class ZoomInAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomIn',
                title: {
                    ...(0, nls_1.localize2)('zoomIn', "Zoom In"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomIn', comment: ['&& denotes a mnemonic'] }, "&&Zoom In"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 86 /* KeyCode.Equal */, 2048 /* KeyMod.CtrlCmd */ | 109 /* KeyCode.NumpadAdd */]
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 1
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)()) + 1);
        }
    }
    exports.ZoomInAction = ZoomInAction;
    class ZoomOutAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomOut',
                title: {
                    ...(0, nls_1.localize2)('zoomOut', "Zoom Out"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomOut', comment: ['&& denotes a mnemonic'] }, "&&Zoom Out"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */, 2048 /* KeyMod.CtrlCmd */ | 111 /* KeyCode.NumpadSubtract */],
                    linux: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 111 /* KeyCode.NumpadSubtract */]
                    }
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 2
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, (0, browser_1.getZoomLevel)((0, dom_1.getActiveWindow)()) - 1);
        }
    }
    exports.ZoomOutAction = ZoomOutAction;
    class ZoomResetAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomReset',
                title: {
                    ...(0, nls_1.localize2)('zoomReset', "Reset Zoom"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomReset', comment: ['&& denotes a mnemonic'] }, "&&Reset Zoom"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 98 /* KeyCode.Numpad0 */
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '5_zoom',
                    order: 3
                }
            });
        }
        run(accessor) {
            return super.setZoomLevel(accessor, true);
        }
    }
    exports.ZoomResetAction = ZoomResetAction;
    class BaseSwitchWindow extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.closeWindowAction = {
                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.removeClose),
                tooltip: (0, nls_1.localize)('close', "Close Window")
            };
            this.closeDirtyWindowAction = {
                iconClass: 'dirty-window ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.closeDirty),
                tooltip: (0, nls_1.localize)('close', "Close Window"),
                alwaysVisible: true
            };
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const currentWindowId = (0, dom_1.getActiveWindow)().vscodeWindowId;
            const windows = await nativeHostService.getWindows({ includeAuxiliaryWindows: true });
            const mainWindows = new Set();
            const mapMainWindowToAuxiliaryWindows = new Map();
            for (const window of windows) {
                if ((0, window_2.isOpenedAuxiliaryWindow)(window)) {
                    let auxiliaryWindows = mapMainWindowToAuxiliaryWindows.get(window.parentId);
                    if (!auxiliaryWindows) {
                        auxiliaryWindows = new Set();
                        mapMainWindowToAuxiliaryWindows.set(window.parentId, auxiliaryWindows);
                    }
                    auxiliaryWindows.add(window);
                }
                else {
                    mainWindows.add(window);
                }
            }
            const picks = [];
            for (const window of mainWindows) {
                const auxiliaryWindows = mapMainWindowToAuxiliaryWindows.get(window.id);
                if (mapMainWindowToAuxiliaryWindows.size > 0) {
                    picks.push({ type: 'separator', payload: -1, label: auxiliaryWindows ? (0, nls_1.localize)('windowGroup', "window group") : undefined });
                }
                const resource = window.filename ? uri_1.URI.file(window.filename) : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? window.workspace.uri : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? window.workspace.configPath : undefined;
                const fileKind = window.filename ? files_1.FileKind.FILE : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.FOLDER : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.ROOT_FOLDER : files_1.FileKind.FILE;
                const pick = {
                    windowId: window.id,
                    label: window.title,
                    ariaLabel: window.dirty ? (0, nls_1.localize)('windowDirtyAriaLabel', "{0}, window with unsaved changes", window.title) : window.title,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, fileKind),
                    description: (currentWindowId === window.id) ? (0, nls_1.localize)('current', "Current Window") : undefined,
                    buttons: currentWindowId !== window.id ? window.dirty ? [this.closeDirtyWindowAction] : [this.closeWindowAction] : undefined
                };
                picks.push(pick);
                if (auxiliaryWindows) {
                    for (const auxiliaryWindow of auxiliaryWindows) {
                        const pick = {
                            windowId: auxiliaryWindow.id,
                            label: auxiliaryWindow.title,
                            iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, auxiliaryWindow.filename ? uri_1.URI.file(auxiliaryWindow.filename) : undefined, files_1.FileKind.FILE),
                            description: (currentWindowId === auxiliaryWindow.id) ? (0, nls_1.localize)('current', "Current Window") : undefined,
                            buttons: [this.closeWindowAction]
                        };
                        picks.push(pick);
                    }
                }
            }
            const placeHolder = (0, nls_1.localize)('switchWindowPlaceHolder', "Select a window to switch to");
            const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.windowId === currentWindowId)[0]) + 1) % picks.length;
            const pick = await quickInputService.pick(picks, {
                contextKey: 'inWindowsPicker',
                activeItem: picks[autoFocusIndex],
                placeHolder,
                quickNavigate: this.isQuickNavigate() ? { keybindings: keybindingService.lookupKeybindings(this.desc.id) } : undefined,
                hideInput: this.isQuickNavigate(),
                onDidTriggerItemButton: async (context) => {
                    await nativeHostService.closeWindow({ targetWindowId: context.item.windowId });
                    context.removeItem();
                }
            });
            if (pick) {
                nativeHostService.focusWindow({ targetWindowId: pick.windowId });
            }
        }
    }
    class SwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.switchWindow',
                title: (0, nls_1.localize2)('switchWindow', 'Switch Window...'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 53 /* KeyCode.KeyW */ }
                }
            });
        }
        isQuickNavigate() {
            return false;
        }
    }
    exports.SwitchWindowAction = SwitchWindowAction;
    class QuickSwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.quickSwitchWindow',
                title: (0, nls_1.localize2)('quickSwitchWindow', 'Quick Switch Window...'),
                f1: false // hide quick pickers from command palette to not confuse with the other entry that shows a input field
            });
        }
        isQuickNavigate() {
            return true;
        }
    }
    exports.QuickSwitchWindowAction = QuickSwitchWindowAction;
    function canRunNativeTabsHandler(accessor) {
        if (!platform_1.isMacintosh) {
            return false;
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        return configurationService.getValue('window.nativeTabs') === true;
    }
    const NewWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).newWindowTab();
    };
    exports.NewWindowTabHandler = NewWindowTabHandler;
    const ShowPreviousWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).showPreviousWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = ShowPreviousWindowTabHandler;
    const ShowNextWindowTabHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).showNextWindowTab();
    };
    exports.ShowNextWindowTabHandler = ShowNextWindowTabHandler;
    const MoveWindowTabToNewWindowHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).moveWindowTabToNewWindow();
    };
    exports.MoveWindowTabToNewWindowHandler = MoveWindowTabToNewWindowHandler;
    const MergeWindowTabsHandlerHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).mergeAllWindowTabs();
    };
    exports.MergeWindowTabsHandlerHandler = MergeWindowTabsHandlerHandler;
    const ToggleWindowTabsBarHandler = function (accessor) {
        if (!canRunNativeTabsHandler(accessor)) {
            return;
        }
        return accessor.get(native_1.INativeHostService).toggleWindowTabsBar();
    };
    exports.ToggleWindowTabsBarHandler = ToggleWindowTabsBarHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvYWN0aW9ucy93aW5kb3dBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEcsTUFBYSxpQkFBa0IsU0FBUSxpQkFBTztpQkFFN0IsT0FBRSxHQUFHLDhCQUE4QixDQUFDO1FBRXBEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO2dCQUN4QixLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyxhQUFhLEVBQUUsY0FBYyxDQUFDO29CQUMzQyxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQztpQkFDdkc7Z0JBQ0QsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsbURBQTZCLHdCQUFlLEVBQUU7b0JBQzlELEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSwwQ0FBdUIsRUFBRSxTQUFTLEVBQUUsQ0FBQyxtREFBNkIsd0JBQWUsQ0FBQyxFQUFFO29CQUN0RyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsMENBQXVCLEVBQUUsU0FBUyxFQUFFLENBQUMsbURBQTZCLHdCQUFlLENBQUMsRUFBRTtpQkFDcEc7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7b0JBQzFCLEtBQUssRUFBRSxTQUFTO29CQUNoQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztR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
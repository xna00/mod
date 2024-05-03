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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform", "vs/base/browser/canIUse", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, dom, dropdownWithPrimaryActionViewItem_1, actions_1, contextkey_1, contextView_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, terminal_1, terminalMenus_1, terminal_2, platform_1, canIUse_1, notification_1, terminalContextMenu_1, editorService_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditor = void 0;
    let TerminalEditor = class TerminalEditor extends editorPane_1.EditorPane {
        constructor(group, telemetryService, themeService, storageService, _terminalEditorService, _terminalProfileResolverService, _terminalService, contextKeyService, menuService, _instantiationService, _contextMenuService, _notificationService, _terminalProfileService, _workbenchLayoutService) {
            super(terminal_1.terminalEditorId, group, telemetryService, themeService, storageService);
            this._terminalEditorService = _terminalEditorService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalService = _terminalService;
            this._instantiationService = _instantiationService;
            this._contextMenuService = _contextMenuService;
            this._notificationService = _notificationService;
            this._terminalProfileService = _terminalProfileService;
            this._workbenchLayoutService = _workbenchLayoutService;
            this._editorInput = undefined;
            this._cancelContextMenu = false;
            this._dropdownMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalNewDropdownContext, contextKeyService));
            this._instanceMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalInstanceContext, contextKeyService));
        }
        async setInput(newInput, options, context, token) {
            this._editorInput?.terminalInstance?.detachFromElement();
            this._editorInput = newInput;
            await super.setInput(newInput, options, context, token);
            this._editorInput.terminalInstance?.attachToElement(this._overflowGuardElement);
            if (this._lastDimension) {
                this.layout(this._lastDimension);
            }
            this._editorInput.terminalInstance?.setVisible(this.isVisible() && this._workbenchLayoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, this.window));
            if (this._editorInput.terminalInstance) {
                // since the editor does not monitor focus changes, for ex. between the terminal
                // panel and the editors, this is needed so that the active instance gets set
                // when focus changes between them.
                this._register(this._editorInput.terminalInstance.onDidFocus(() => this._setActiveInstance()));
                this._editorInput.setCopyLaunchConfig(this._editorInput.terminalInstance.shellLaunchConfig);
            }
        }
        clearInput() {
            super.clearInput();
            if (this._overflowGuardElement && this._editorInput?.terminalInstance?.domElement.parentElement === this._overflowGuardElement) {
                this._editorInput.terminalInstance?.detachFromElement();
            }
            this._editorInput = undefined;
        }
        _setActiveInstance() {
            if (!this._editorInput?.terminalInstance) {
                return;
            }
            this._terminalEditorService.setActiveInstance(this._editorInput.terminalInstance);
        }
        focus() {
            super.focus();
            this._editorInput?.terminalInstance?.focus(true);
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        createEditor(parent) {
            this._editorInstanceElement = parent;
            this._overflowGuardElement = dom.$('.terminal-overflow-guard.terminal-editor');
            this._editorInstanceElement.appendChild(this._overflowGuardElement);
            this._registerListeners();
        }
        _registerListeners() {
            if (!this._editorInstanceElement) {
                return;
            }
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'mousedown', async (event) => {
                if (this._terminalEditorService.instances.length === 0) {
                    return;
                }
                if (event.which === 2 && platform_1.isLinux) {
                    // Drop selection and focus terminal on Linux to enable middle button paste when click
                    // occurs on the selection itself.
                    const terminal = this._terminalEditorService.activeInstance;
                    terminal?.focus();
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                    if (rightClickBehavior === 'nothing') {
                        if (!event.shiftKey) {
                            this._cancelContextMenu = true;
                        }
                        return;
                    }
                    else if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        const terminal = this._terminalEditorService.activeInstance;
                        if (!terminal) {
                            return;
                        }
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            (0, terminalContextMenu_1.openContextMenu)(this.window, event, this._editorInput?.terminalInstance, this._instanceMenu, this._contextMenuService);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            if (canIUse_1.BrowserFeatures.clipboard.readText) {
                                terminal.paste();
                            }
                            else {
                                this._notificationService.info(`This browser doesn't support the clipboard.readText API needed to trigger a paste, try ${platform_1.isMacintosh ? '⌘' : 'Ctrl'}+V instead.`);
                            }
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform_1.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                    return;
                }
                else if (!this._cancelContextMenu && rightClickBehavior !== 'copyPaste' && rightClickBehavior !== 'paste') {
                    if (!this._cancelContextMenu) {
                        (0, terminalContextMenu_1.openContextMenu)(this.window, event, this._editorInput?.terminalInstance, this._instanceMenu, this._contextMenuService);
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                }
            }));
        }
        layout(dimension) {
            const instance = this._editorInput?.terminalInstance;
            if (instance) {
                instance.attachToElement(this._overflowGuardElement);
                instance.layout(dimension);
            }
            this._lastDimension = dimension;
        }
        setVisible(visible) {
            super.setVisible(visible);
            this._editorInput?.terminalInstance?.setVisible(visible && this._workbenchLayoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, this.window));
        }
        getActionViewItem(action, options) {
            switch (action.id) {
                case "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */: {
                    if (action instanceof actions_1.MenuItemAction) {
                        const location = { viewColumn: editorService_1.ACTIVE_GROUP };
                        const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(location, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
                        const button = this._instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, { hoverDelegate: options.hoverDelegate });
                        return button;
                    }
                }
            }
            return super.getActionViewItem(action, options);
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
    };
    exports.TerminalEditor = TerminalEditor;
    exports.TerminalEditor = TerminalEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, terminal_1.ITerminalEditorService),
        __param(5, terminal_2.ITerminalProfileResolverService),
        __param(6, terminal_1.ITerminalService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, actions_1.IMenuService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, notification_1.INotificationService),
        __param(12, terminal_2.ITerminalProfileService),
        __param(13, layoutService_1.IWorkbenchLayoutService)
    ], TerminalEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsdUJBQVU7UUFlN0MsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN6QixjQUErQixFQUN4QixzQkFBK0QsRUFDdEQsK0JBQWlGLEVBQ2hHLGdCQUFtRCxFQUNqRCxpQkFBcUMsRUFDM0MsV0FBeUIsRUFDaEIscUJBQTZELEVBQy9ELG1CQUF5RCxFQUN4RCxvQkFBMkQsRUFDeEQsdUJBQWlFLEVBQ2pFLHVCQUFpRTtZQUUxRixLQUFLLENBQUMsMkJBQWdCLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVh0QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ3JDLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBaUM7WUFDL0UscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUc3QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUN2Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQ2hELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUF4Qm5GLGlCQUFZLEdBQXlCLFNBQVMsQ0FBQztZQVEvQyx1QkFBa0IsR0FBWSxLQUFLLENBQUM7WUFtQjNDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENB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
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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/dialogs/common/dialogs", "vs/base/common/event"], function (require, exports, nls_1, severity_1, lifecycle_1, themeService_1, themables_1, editorInput_1, terminal_1, terminalIcon_1, instantiation_1, terminal_2, lifecycle_2, contextkey_1, configuration_1, terminalContextKey_1, dialogs_1, event_1) {
    "use strict";
    var TerminalEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorInput = void 0;
    let TerminalEditorInput = class TerminalEditorInput extends editorInput_1.EditorInput {
        static { TerminalEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.terminal'; }
        setGroup(group) {
            this._group = group;
            if (group?.scopedContextKeyService) {
                this._terminalInstance?.setParentContextKeyService(group.scopedContextKeyService);
            }
        }
        get group() {
            return this._group;
        }
        get typeId() {
            return TerminalEditorInput_1.ID;
        }
        get editorId() {
            return terminal_1.terminalEditorId;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */ | 128 /* EditorInputCapabilities.CanDropIntoEditor */ | 64 /* EditorInputCapabilities.ForceDescription */;
        }
        setTerminalInstance(instance) {
            if (this._terminalInstance) {
                throw new Error('cannot set instance that has already been set');
            }
            this._terminalInstance = instance;
            this._setupInstanceListeners();
        }
        copy() {
            const instance = this._terminalInstanceService.createInstance(this._copyLaunchConfig || {}, terminal_2.TerminalLocation.Editor);
            instance.focusWhenReady();
            this._copyLaunchConfig = undefined;
            return this._instantiationService.createInstance(TerminalEditorInput_1, instance.resource, instance);
        }
        /**
         * Sets the launch config to use for the next call to EditorInput.copy, which will be used when
         * the editor's split command is run.
         */
        setCopyLaunchConfig(launchConfig) {
            this._copyLaunchConfig = launchConfig;
        }
        /**
         * Returns the terminal instance for this input if it has not yet been detached from the input.
         */
        get terminalInstance() {
            return this._isDetached ? undefined : this._terminalInstance;
        }
        showConfirm() {
            if (this._isReverted) {
                return false;
            }
            const confirmOnKill = this._configurationService.getValue("terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */);
            if (confirmOnKill === 'editor' || confirmOnKill === 'always') {
                return this._terminalInstance?.hasChildProcesses || false;
            }
            return false;
        }
        async confirm(terminals) {
            const { confirmed } = await this._dialogService.confirm({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('confirmDirtyTerminal.message', "Do you want to terminate running processes?"),
                primaryButton: (0, nls_1.localize)({ key: 'confirmDirtyTerminal.button', comment: ['&& denotes a mnemonic'] }, "&&Terminate"),
                detail: terminals.length > 1 ?
                    terminals.map(terminal => terminal.editor.getName()).join('\n') + '\n\n' + (0, nls_1.localize)('confirmDirtyTerminals.detail', "Closing will terminate the running processes in the terminals.") :
                    (0, nls_1.localize)('confirmDirtyTerminal.detail', "Closing will terminate the running processes in this terminal.")
            });
            return confirmed ? 1 /* ConfirmResult.DONT_SAVE */ : 2 /* ConfirmResult.CANCEL */;
        }
        async revert() {
            // On revert just treat the terminal as permanently non-dirty
            this._isReverted = true;
        }
        constructor(resource, _terminalInstance, _themeService, _terminalInstanceService, _instantiationService, _configurationService, _lifecycleService, _contextKeyService, _dialogService) {
            super();
            this.resource = resource;
            this._terminalInstance = _terminalInstance;
            this._themeService = _themeService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._lifecycleService = _lifecycleService;
            this._contextKeyService = _contextKeyService;
            this._dialogService = _dialogService;
            this.closeHandler = this;
            this._isDetached = false;
            this._isShuttingDown = false;
            this._isReverted = false;
            this._onDidRequestAttach = this._register(new event_1.Emitter());
            this.onDidRequestAttach = this._onDidRequestAttach.event;
            this._terminalEditorFocusContextKey = terminalContextKey_1.TerminalContextKeys.editorFocus.bindTo(_contextKeyService);
            if (_terminalInstance) {
                this._setupInstanceListeners();
            }
        }
        _setupInstanceListeners() {
            const instance = this._terminalInstance;
            if (!instance) {
                return;
            }
            const instanceOnDidFocusListener = instance.onDidFocus(() => this._terminalEditorFocusContextKey.set(true));
            const instanceOnDidBlurListener = instance.onDidBlur(() => this._terminalEditorFocusContextKey.reset());
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (!this._isDetached && !this._isShuttingDown) {
                    // Will be ignored if triggered by onExit or onDisposed terminal events
                    // as disposed was already called
                    instance.dispose(terminal_2.TerminalExitReason.User);
                }
                (0, lifecycle_1.dispose)([instanceOnDidFocusListener, instanceOnDidBlurListener]);
            }));
            const disposeListeners = [
                instance.onExit((e) => {
                    if (!instance.waitOnExit) {
                        this.dispose();
                    }
                }),
                instance.onDisposed(() => this.dispose()),
                instance.onTitleChanged(() => this._onDidChangeLabel.fire()),
                instance.onIconChanged(() => this._onDidChangeLabel.fire()),
                instanceOnDidFocusListener,
                instanceOnDidBlurListener,
                instance.statusList.onDidChangePrimaryStatus(() => this._onDidChangeLabel.fire())
            ];
            // Don't dispose editor when instance is torn down on shutdown to avoid extra work and so
            // the editor/tabs don't disappear
            this._lifecycleService.onWillShutdown((e) => {
                this._isShuttingDown = true;
                (0, lifecycle_1.dispose)(disposeListeners);
                // Don't touch processes if the shutdown was a result of reload as they will be reattached
                const shouldPersistTerminals = this._configurationService.getValue("terminal.integrated.enablePersistentSessions" /* TerminalSettingId.EnablePersistentSessions */) && e.reason === 3 /* ShutdownReason.RELOAD */;
                if (shouldPersistTerminals) {
                    instance.detachProcessAndDispose(terminal_2.TerminalExitReason.Shutdown);
                }
                else {
                    instance.dispose(terminal_2.TerminalExitReason.Shutdown);
                }
            });
        }
        getName() {
            return this._terminalInstance?.title || this.resource.fragment;
        }
        getIcon() {
            if (!this._terminalInstance || !themables_1.ThemeIcon.isThemeIcon(this._terminalInstance.icon)) {
                return undefined;
            }
            return this._terminalInstance.icon;
        }
        getLabelExtraClasses() {
            if (!this._terminalInstance) {
                return [];
            }
            const extraClasses = ['terminal-tab', 'predefined-file-icon'];
            const colorClass = (0, terminalIcon_1.getColorClass)(this._terminalInstance);
            if (colorClass) {
                extraClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(this._terminalInstance, this._themeService.getColorTheme().type);
            if (uriClasses) {
                extraClasses.push(...uriClasses);
            }
            return extraClasses;
        }
        /**
         * Detach the instance from the input such that when the input is disposed it will not dispose
         * of the terminal instance/process.
         */
        detachInstance() {
            if (!this._isShuttingDown) {
                this._terminalInstance?.detachFromElement();
                this._terminalInstance?.setParentContextKeyService(this._contextKeyService);
                this._isDetached = true;
            }
        }
        getDescription() {
            return this._terminalInstance?.description;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: terminal_1.terminalEditorId,
                    pinned: true,
                    forceReload: true
                }
            };
        }
    };
    exports.TerminalEditorInput = TerminalEditorInput;
    exports.TerminalEditorInput = TerminalEditorInput = TerminalEditorInput_1 = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_1.ITerminalInstanceService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, dialogs_1.IDialogService)
    ], TerminalEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEseUJBQVc7O2lCQUVuQyxPQUFFLEdBQUcsNEJBQTRCLEFBQS9CLENBQWdDO1FBY2xELFFBQVEsQ0FBQyxLQUErQjtZQUN2QyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsMEJBQTBCLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbkYsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQWEsTUFBTTtZQUNsQixPQUFPLHFCQUFtQixDQUFDLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBYSxRQUFRO1lBQ3BCLE9BQU8sMkJBQWdCLENBQUM7UUFDekIsQ0FBQztRQUVELElBQWEsWUFBWTtZQUN4QixPQUFPLG9GQUFvRSxzREFBNEMsb0RBQTJDLENBQUM7UUFDcEssQ0FBQztRQUVELG1CQUFtQixDQUFDLFFBQTJCO1lBQzlDLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztZQUNsQyxJ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
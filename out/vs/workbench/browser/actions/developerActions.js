/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/browser/event", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/platform/layout/browser/layoutService", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/storage/common/storage", "vs/base/common/numbers", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/output/common/output", "vs/workbench/services/log/common/logConstants", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/editor/common/editorService", "vs/platform/product/common/product", "vs/platform/commands/common/commands", "vs/platform/environment/common/environment", "vs/css!./media/actions"], function (require, exports, nls_1, keybinding_1, event_1, color_1, event_2, lifecycle_1, dom_1, configuration_1, contextkey_1, keyboardEvent_1, async_1, layoutService_1, platform_1, actions_1, storage_1, numbers_1, configurationRegistry_1, log_1, workingCopyService_1, actionCommonCategories_1, workingCopyBackup_1, dialogs_1, output_1, logConstants_1, files_1, quickInput_1, userDataProfile_1, editorService_1, product_1, commands_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectContextKeysAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectContextKeys',
                title: (0, nls_1.localize2)('inspect context keys', 'Inspect Context Keys'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const disposables = new lifecycle_1.DisposableStore();
            const stylesheet = (0, dom_1.createStyleSheet)(undefined, undefined, disposables);
            (0, dom_1.createCSSRule)('*', 'cursor: crosshair !important;', stylesheet);
            const hoverFeedback = document.createElement('div');
            const activeDocument = (0, dom_1.getActiveDocument)();
            activeDocument.body.appendChild(hoverFeedback);
            disposables.add((0, lifecycle_1.toDisposable)(() => activeDocument.body.removeChild(hoverFeedback)));
            hoverFeedback.style.position = 'absolute';
            hoverFeedback.style.pointerEvents = 'none';
            hoverFeedback.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            hoverFeedback.style.zIndex = '1000';
            const onMouseMove = disposables.add(new event_1.DomEmitter(activeDocument, 'mousemove', true));
            disposables.add(onMouseMove.event(e => {
                const target = e.target;
                const position = (0, dom_1.getDomNodePagePosition)(target);
                hoverFeedback.style.top = `${position.top}px`;
                hoverFeedback.style.left = `${position.left}px`;
                hoverFeedback.style.width = `${position.width}px`;
                hoverFeedback.style.height = `${position.height}px`;
            }));
            const onMouseDown = disposables.add(new event_1.DomEmitter(activeDocument, 'mousedown', true));
            event_2.Event.once(onMouseDown.event)(e => { e.preventDefault(); e.stopPropagation(); }, null, disposables);
            const onMouseUp = disposables.add(new event_1.DomEmitter(activeDocument, 'mouseup', true));
            event_2.Event.once(onMouseUp.event)(e => {
                e.preventDefault();
                e.stopPropagation();
                const context = contextKeyService.getContext(e.target);
                console.log(context.collectAllValues());
                (0, lifecycle_1.dispose)(disposables);
            }, null, disposables);
        }
    }
    class ToggleScreencastModeAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleScreencastMode',
                title: (0, nls_1.localize2)('toggle screencast mode', 'Toggle Screencast Mode'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            if (ToggleScreencastModeAction.disposable) {
                ToggleScreencastModeAction.disposable.dispose();
                ToggleScreencastModeAction.disposable = undefined;
                return;
            }
            const layoutService = accessor.get(layoutService_1.ILayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const disposables = new lifecycle_1.DisposableStore();
            const container = layoutService.activeContainer;
            const mouseMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-mouse'));
            disposables.add((0, lifecycle_1.toDisposable)(() => mouseMarker.remove()));
            const keyboardMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-keyboard'));
            disposables.add((0, lifecycle_1.toDisposable)(() => keyboardMarker.remove()));
            const onMouseDown = disposables.add(new event_2.Emitter());
            const onMouseUp = disposables.add(new event_2.Emitter());
            const onMouseMove = disposables.add(new event_2.Emitter());
            function registerContainerListeners(container, disposables) {
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mousedown', true)).event(e => onMouseDown.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mouseup', true)).event(e => onMouseUp.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mousemove', true)).event(e => onMouseMove.fire(e)));
            }
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                registerContainerListeners(layoutService.getContainer(window), disposables);
            }
            disposables.add((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => registerContainerListeners(layoutService.getContainer(window), disposables)));
            disposables.add(layoutService.onDidChangeActiveContainer(() => {
                layoutService.activeContainer.appendChild(mouseMarker);
                layoutService.activeContainer.appendChild(keyboardMarker);
            }));
            const updateMouseIndicatorColor = () => {
                mouseMarker.style.borderColor = color_1.Color.fromHex(configurationService.getValue('screencastMode.mouseIndicatorColor')).toString();
            };
            let mouseIndicatorSize;
            const updateMouseIndicatorSize = () => {
                mouseIndicatorSize = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.mouseIndicatorSize') || 20, 20, 100);
                mouseMarker.style.height = `${mouseIndicatorSize}px`;
                mouseMarker.style.width = `${mouseIndicatorSize}px`;
            };
            updateMouseIndicatorColor();
            updateMouseIndicatorSize();
            disposables.add(onMouseDown.event(e => {
                mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                mouseMarker.style.display = 'block';
                mouseMarker.style.transform = `scale(${1})`;
                mouseMarker.style.transition = 'transform 0.1s';
                const mouseMoveListener = onMouseMove.event(e => {
                    mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                    mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                    mouseMarker.style.transform = `scale(${.8})`;
                });
                event_2.Event.once(onMouseUp.event)(() => {
                    mouseMarker.style.display = 'none';
                    mouseMoveListener.dispose();
                });
            }));
            const updateKeyboardFontSize = () => {
                keyboardMarker.style.fontSize = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.fontSize') || 56, 20, 100)}px`;
            };
            const updateKeyboardMarker = () => {
                keyboardMarker.style.bottom = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.verticalOffset') || 0, 0, 90)}%`;
            };
            let keyboardMarkerTimeout;
            const updateKeyboardMarkerTimeout = () => {
                keyboardMarkerTimeout = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.keyboardOverlayTimeout') || 800, 500, 5000);
            };
            updateKeyboardFontSize();
            updateKeyboardMarker();
            updateKeyboardMarkerTimeout();
            disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('screencastMode.verticalOffset')) {
                    updateKeyboardMarker();
                }
                if (e.affectsConfiguration('screencastMode.fontSize')) {
                    updateKeyboardFontSize();
                }
                if (e.affectsConfiguration('screencastMode.keyboardOverlayTimeout')) {
                    updateKeyboardMarkerTimeout();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorColor')) {
                    updateMouseIndicatorColor();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorSize')) {
                    updateMouseIndicatorSize();
                }
            }));
            const onKeyDown = disposables.add(new event_2.Emitter());
            const onCompositionStart = disposables.add(new event_2.Emitter());
            const onCompositionUpdate = disposables.add(new event_2.Emitter());
            const onCompositionEnd = disposables.add(new event_2.Emitter());
            function registerWindowListeners(window, disposables) {
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'keydown', true)).event(e => onKeyDown.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionstart', true)).event(e => onCompositionStart.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionupdate', true)).event(e => onCompositionUpdate.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionend', true)).event(e => onCompositionEnd.fire(e)));
            }
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                registerWindowListeners(window, disposables);
            }
            disposables.add((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => registerWindowListeners(window, disposables)));
            let length = 0;
            let composing = undefined;
            let imeBackSpace = false;
            const clearKeyboardScheduler = new async_1.RunOnceScheduler(() => {
                keyboardMarker.textContent = '';
                composing = undefined;
                length = 0;
            }, keyboardMarkerTimeout);
            disposables.add(onCompositionStart.event(e => {
                imeBackSpace = true;
            }));
            disposables.add(onCompositionUpdate.event(e => {
                if (e.data && imeBackSpace) {
                    if (length > 20) {
                        keyboardMarker.innerText = '';
                        length = 0;
                    }
                    composing = composing ?? (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key'));
                    composing.textContent = e.data;
                }
                else if (imeBackSpace) {
                    keyboardMarker.innerText = '';
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key', {}, `Backspace`));
                }
                clearKeyboardScheduler.schedule();
            }));
            disposables.add(onCompositionEnd.event(e => {
                composing = undefined;
                length++;
            }));
            disposables.add(onKeyDown.event(e => {
                if (e.key === 'Process' || /[\uac00-\ud787\u3131-\u314e\u314f-\u3163\u3041-\u3094\u30a1-\u30f4\u30fc\u3005\u3006\u3024\u4e00-\u9fa5]/u.test(e.key)) {
                    if (e.code === 'Backspace') {
                        imeBackSpace = true;
                    }
                    else if (!e.code.includes('Key')) {
                        composing = undefined;
                        imeBackSpace = false;
                    }
                    else {
                        imeBackSpace = true;
                    }
                    clearKeyboardScheduler.schedule();
                    return;
                }
                if (e.isComposing) {
                    return;
                }
                const options = configurationService.getValue('screencastMode.keyboardOptions');
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shortcut = keybindingService.softDispatch(event, event.target);
                // Hide the single arrow key pressed
                if (shortcut.kind === 2 /* ResultKind.KbFound */ && shortcut.commandId && !(options.showSingleEditorCursorMoves ?? true) && (['cursorLeft', 'cursorRight', 'cursorUp', 'cursorDown'].includes(shortcut.commandId))) {
                    return;
                }
                if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
                    || length > 20
                    || event.keyCode === 1 /* KeyCode.Backspace */ || event.keyCode === 9 /* KeyCode.Escape */
                    || event.keyCode === 16 /* KeyCode.UpArrow */ || event.keyCode === 18 /* KeyCode.DownArrow */
                    || event.keyCode === 15 /* KeyCode.LeftArrow */ || event.keyCode === 17 /* KeyCode.RightArrow */) {
                    keyboardMarker.innerText = '';
                    length = 0;
                }
                const keybinding = keybindingService.resolveKeyboardEvent(event);
                const commandDetails = (this._isKbFound(shortcut) && shortcut.commandId) ? this.getCommandDetails(shortcut.commandId) : undefined;
                let commandAndGroupLabel = commandDetails?.title;
                let keyLabel = keybinding.getLabel();
                if (commandDetails) {
                    if ((options.showCommandGroups ?? false) && commandDetails.category) {
                        commandAndGroupLabel = `${commandDetails.category}: ${commandAndGroupLabel} `;
                    }
                    if (this._isKbFound(shortcut) && shortcut.commandId) {
                        const keybindings = keybindingService.lookupKeybindings(shortcut.commandId)
                            .filter(k => k.getLabel()?.endsWith(keyLabel ?? ''));
                        if (keybindings.length > 0) {
                            keyLabel = keybindings[keybindings.length - 1].getLabel();
                        }
                    }
                }
                if ((options.showCommands ?? true) && commandAndGroupLabel) {
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.title', {}, `${commandAndGroupLabel} `));
                }
                if ((options.showKeys ?? true) || ((options.showKeybindings ?? true) && this._isKbFound(shortcut))) {
                    // Fix label for arrow keys
                    keyLabel = keyLabel?.replace('UpArrow', '↑')
                        ?.replace('DownArrow', '↓')
                        ?.replace('LeftArrow', '←')
                        ?.replace('RightArrow', '→');
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key', {}, keyLabel ?? ''));
                }
                length++;
                clearKeyboardScheduler.schedule();
            }));
            ToggleScreencastModeAction.disposable = disposables;
        }
        _isKbFound(resolutionResult) {
            return resolutionResult.kind === 2 /* ResultKind.KbFound */;
        }
        getCommandDetails(commandId) {
            const fromMenuRegistry = actions_1.MenuRegistry.getCommand(commandId);
            if (fromMenuRegistry) {
                return {
                    title: typeof fromMenuRegistry.title === 'string' ? fromMenuRegistry.title : fromMenuRegistry.title.value,
                    category: fromMenuRegistry.category ? (typeof fromMenuRegistry.category === 'string' ? fromMenuRegistry.category : fromMenuRegistry.category.value) : undefined
                };
            }
            const fromCommandsRegistry = commands_1.CommandsRegistry.getCommand(commandId);
            if (fromCommandsRegistry && fromCommandsRegistry.metadata?.description) {
                return { title: typeof fromCommandsRegistry.metadata.description === 'string' ? fromCommandsRegistry.metadata.description : fromCommandsRegistry.metadata.description.value };
            }
            return undefined;
        }
    }
    class LogStorageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logStorage',
                title: (0, nls_1.localize2)({ key: 'logStorage', comment: ['A developer only action to log the contents of the storage for the current window.'] }, "Log Storage Database Contents"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            storageService.log();
            dialogService.info((0, nls_1.localize)('storageLogDialogMessage', "The storage database contents have been logged to the developer tools."), (0, nls_1.localize)('storageLogDialogDetails', "Open developer tools from the menu and select the Console tab."));
        }
    }
    class LogWorkingCopiesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logWorkingCopies',
                title: (0, nls_1.localize2)({ key: 'logWorkingCopies', comment: ['A developer only action to log the working copies that exist.'] }, "Log Working Copies"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            const logService = accessor.get(log_1.ILogService);
            const outputService = accessor.get(output_1.IOutputService);
            const backups = await workingCopyBackupService.getBackups();
            const msg = [
                ``,
                `[Working Copies]`,
                ...(workingCopyService.workingCopies.length > 0) ?
                    workingCopyService.workingCopies.map(workingCopy => `${workingCopy.isDirty() ? '● ' : ''}${workingCopy.resource.toString(true)} (typeId: ${workingCopy.typeId || '<no typeId>'})`) :
                    ['<none>'],
                ``,
                `[Backups]`,
                ...(backups.length > 0) ?
                    backups.map(backup => `${backup.resource.toString(true)} (typeId: ${backup.typeId || '<no typeId>'})`) :
                    ['<none>'],
            ];
            logService.info(msg.join('\n'));
            outputService.showChannel(logConstants_1.windowLogId, true);
        }
    }
    class RemoveLargeStorageEntriesAction extends actions_1.Action2 {
        static { this.SIZE_THRESHOLD = 1024 * 16; } // 16kb
        constructor() {
            super({
                id: 'workbench.action.removeLargeStorageDatabaseEntries',
                title: (0, nls_1.localize2)('removeLargeStorageDatabaseEntries', 'Remove Large Storage Database Entries...'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const userDataProfileService = accessor.get(userDataProfile_1.IUserDataProfileService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            const items = [];
            for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                if (scope === 0 /* StorageScope.PROFILE */ && userDataProfileService.currentProfile.isDefault) {
                    continue; // avoid duplicates
                }
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    for (const key of storageService.keys(scope, target)) {
                        const value = storageService.get(key, scope);
                        if (value && (!environmentService.isBuilt /* show all keys in dev */ || value.length > RemoveLargeStorageEntriesAction.SIZE_THRESHOLD)) {
                            items.push({
                                key,
                                scope,
                                target,
                                size: value.length,
                                label: key,
                                description: files_1.ByteSize.formatSize(value.length),
                                detail: (0, nls_1.localize)('largeStorageItemDetail', "Scope: {0}, Target: {1}", scope === -1 /* StorageScope.APPLICATION */ ? (0, nls_1.localize)('global', "Global") : scope === 0 /* StorageScope.PROFILE */ ? (0, nls_1.localize)('profile', "Profile") : (0, nls_1.localize)('workspace', "Workspace"), target === 1 /* StorageTarget.MACHINE */ ? (0, nls_1.localize)('machine', "Machine") : (0, nls_1.localize)('user', "User")),
                            });
                        }
                    }
                }
            }
            items.sort((itemA, itemB) => itemB.size - itemA.size);
            const selectedItems = await new Promise(resolve => {
                const disposables = new lifecycle_1.DisposableStore();
                const picker = disposables.add(quickInputService.createQuickPick());
                picker.items = items;
                picker.canSelectMany = true;
                picker.ok = false;
                picker.customButton = true;
                picker.hideCheckAll = true;
                picker.customLabel = (0, nls_1.localize)('removeLargeStorageEntriesPickerButton', "Remove");
                picker.placeholder = (0, nls_1.localize)('removeLargeStorageEntriesPickerPlaceholder', "Select large entries to remove from storage");
                if (items.length === 0) {
                    picker.description = (0, nls_1.localize)('removeLargeStorageEntriesPickerDescriptionNoEntries', "There are no large storage entries to remove.");
                }
                picker.show();
                disposables.add(picker.onDidCustom(() => {
                    resolve(picker.selectedItems);
                    picker.hide();
                }));
                disposables.add(picker.onDidHide(() => disposables.dispose()));
            });
            if (selectedItems.length === 0) {
                return;
            }
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('removeLargeStorageEntriesConfirmRemove', "Do you want to remove the selected storage entries from the database?"),
                detail: (0, nls_1.localize)('removeLargeStorageEntriesConfirmRemoveDetail', "{0}\n\nThis action is irreversible and may result in data loss!", selectedItems.map(item => item.label).join('\n')),
                primaryButton: (0, nls_1.localize)({ key: 'removeLargeStorageEntriesButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Remove")
            });
            if (!confirmed) {
                return;
            }
            const scopesToOptimize = new Set();
            for (const item of selectedItems) {
                storageService.remove(item.key, item.scope);
                scopesToOptimize.add(item.scope);
            }
            for (const scope of scopesToOptimize) {
                await storageService.optimize(scope);
            }
        }
    }
    let tracker = undefined;
    let trackedDisposables = new Set();
    const DisposablesSnapshotStateContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', 'stopped');
    class StartTrackDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.startTrackDisposables',
                title: (0, nls_1.localize2)('startTrackDisposables', 'Start Tracking Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(DisposablesSnapshotStateContext.isEqualTo('pending').negate(), DisposablesSnapshotStateContext.isEqualTo('started').negate())
            });
        }
        run(accessor) {
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('started');
            trackedDisposables.clear();
            tracker = new lifecycle_1.DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        }
    }
    class SnapshotTrackedDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.snapshotTrackedDisposables',
                title: (0, nls_1.localize2)('snapshotTrackedDisposables', 'Snapshot Tracked Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: DisposablesSnapshotStateContext.isEqualTo('started')
            });
        }
        run(accessor) {
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('pending');
            trackedDisposables = new Set(tracker?.computeLeakingDisposables(1000)?.leaks.map(disposable => disposable.value));
        }
    }
    class StopTrackDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.stopTrackDisposables',
                title: (0, nls_1.localize2)('stopTrackDisposables', 'Stop Tracking Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: DisposablesSnapshotStateContext.isEqualTo('pending')
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('stopped');
            if (tracker) {
                const disposableLeaks = new Set();
                for (const disposable of new Set(tracker.computeLeakingDisposables(1000)?.leaks) ?? []) {
                    if (trackedDisposables.has(disposable.value)) {
                        disposableLeaks.add(disposable);
                    }
                }
                const leaks = tracker.computeLeakingDisposables(1000, Array.from(disposableLeaks));
                if (leaks) {
                    editorService.openEditor({ resource: undefined, contents: leaks.details });
                }
            }
            (0, lifecycle_1.setDisposableTracker)(null);
            tracker = undefined;
            trackedDisposables.clear();
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(InspectContextKeysAction);
    (0, actions_1.registerAction2)(ToggleScreencastModeAction);
    (0, actions_1.registerAction2)(LogStorageAction);
    (0, actions_1.registerAction2)(LogWorkingCopiesAction);
    (0, actions_1.registerAction2)(RemoveLargeStorageEntriesAction);
    if (!product_1.default.commit) {
        (0, actions_1.registerAction2)(StartTrackDisposables);
        (0, actions_1.registerAction2)(SnapshotTrackedDisposables);
        (0, actions_1.registerAction2)(StopTrackDisposables);
    }
    // --- Configuration
    // Screen Cast Mode
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'screencastMode',
        order: 9,
        title: (0, nls_1.localize)('screencastModeConfigurationTitle', "Screencast Mode"),
        type: 'object',
        properties: {
            'screencastMode.verticalOffset': {
                type: 'number',
                default: 20,
                minimum: 0,
                maximum: 90,
                description: (0, nls_1.localize)('screencastMode.location.verticalPosition', "Controls the vertical offset of the screencast mode overlay from the bottom as a percentage of the workbench height.")
            },
            'screencastMode.fontSize': {
                type: 'number',
                default: 56,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.fontSize', "Controls the font size (in pixels) of the screencast mode keyboard.")
            },
            'screencastMode.keyboardOptions': {
                type: 'object',
                description: (0, nls_1.localize)('screencastMode.keyboardOptions.description', "Options for customizing the keyboard overlay in screencast mode."),
                properties: {
                    'showKeys': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showKeys', "Show raw keys.")
                    },
                    'showKeybindings': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showKeybindings', "Show keyboard shortcuts.")
                    },
                    'showCommands': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showCommands', "Show command names.")
                    },
                    'showCommandGroups': {
                        type: 'boolean',
                        default: false,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showCommandGroups', "Show command group names, when commands are also shown.")
                    },
                    'showSingleEditorCursorMoves': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showSingleEditorCursorMoves', "Show single editor cursor move commands.")
                    }
                },
                default: {
                    'showKeys': true,
                    'showKeybindings': true,
                    'showCommands': true,
                    'showCommandGroups': false,
                    'showSingleEditorCursorMoves': true
                },
                additionalProperties: false
            },
            'screencastMode.keyboardOverlayTimeout': {
                type: 'number',
                default: 800,
                minimum: 500,
                maximum: 5000,
                description: (0, nls_1.localize)('screencastMode.keyboardOverlayTimeout', "Controls how long (in milliseconds) the keyboard overlay is shown in screencast mode.")
            },
            'screencastMode.mouseIndicatorColor': {
                type: 'string',
                format: 'color-hex',
                default: '#FF0000',
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorColor', "Controls the color in hex (#RGB, #RGBA, #RRGGBB or #RRGGBBAA) of the mouse indicator in screencast mode.")
            },
            'screencastMode.mouseIndicatorSize': {
                type: 'number',
                default: 20,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorSize', "Controls the size (in pixels) of the mouse indicator in screencast mode.")
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2ZWxvcGVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy9kZXZlbG9wZXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0NoRyxNQUFNLHdCQUF5QixTQUFRLGlCQUFPO1FBRTdDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxzQkFBc0IsRUFBRSxzQkFBc0IsQ0FBQztnQkFDaEUsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQWdCLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2RSxJQUFBLG1CQUFhLEVBQUMsR0FBRyxFQUFFLCtCQUErQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRWhFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsTUFBTSxjQUFjLEdBQUcsSUFBQSx1QkFBaUIsR0FBRSxDQUFDO1lBQzNDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9DLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwRixhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7WUFDMUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO1lBQzNDLGFBQWEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLHNCQUFzQixDQUFDO1lBQzdELGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUVwQyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxjQUFjLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBcUIsQ0FBQztnQkFDdkMsTUFBTSxRQUFRLEdBQUcsSUFBQSw0QkFBc0IsRUFBQyxNQUFNLENBQUMsQ0FBQztnQkFFaEQsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQzlDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUNoRCxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQztnQkFDbEQsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBVSxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2RixhQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFcEcsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsY0FBYyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25GLGFBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFFcEIsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFxQixDQUFZLENBQUM7Z0JBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztnQkFFeEMsSUFBQSxtQkFBTyxFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3RCLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBVUQsTUFBTSwwQkFBMkIsU0FBUSxpQkFBTztRQUkvQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsdUNBQXVDO2dCQUMzQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsd0JBQXdCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQ3BFLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixJQUFJLDBCQUEwQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMzQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hELDBCQUEwQixDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQ2xELE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFFM0QsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQztZQUVoRCxNQUFNLFdBQVcsR0FBRyxJQUFBLFlBQU0sRUFBQyxTQUFTLEVBQUUsSUFBQSxPQUFDLEVBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQzlELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFMUQsTUFBTSxjQUFjLEdBQUcsSUFBQSxZQUFNLEVBQUMsU0FBUyxFQUFFLElBQUEsT0FBQyxFQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNwRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdELE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBRS9ELFNBQVMsMEJBQTBCLENBQUMsU0FBc0IsRUFBRSxXQUE0QjtnQkFDdkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9HLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzRyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBVSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoSCxDQUFDO1lBRUQsS0FBSyxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUEsZ0JBQVUsR0FBRSxFQUFFLENBQUM7Z0JBQ3BELDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsQ0FBQztZQUVELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx5QkFBbUIsRUFBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvSSxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLEVBQUU7Z0JBQzdELGFBQWEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN2RCxhQUFhLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUU7Z0JBQ3RDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2SSxDQUFDLENBQUM7WUFFRixJQUFJLGtCQUEwQixDQUFDO1lBQy9CLE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxFQUFFO2dCQUNyQyxrQkFBa0IsR0FBRyxJQUFBLGVBQUssRUFBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMsbUNBQW1DLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUV0SCxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixJQUFJLENBQUM7Z0JBQ3JELFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsa0JBQWtCLElBQUksQ0FBQztZQUNyRCxDQUFDLENBQUM7WUFFRix5QkFBeUIsRUFBRSxDQUFDO1lBQzVCLHdCQUF3QixFQUFFLENBQUM7WUFFM0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xFLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDbkUsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUNwQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO2dCQUM1QyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztnQkFFaEQsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUMvQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ2xFLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDbkUsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxFQUFFLEdBQUcsQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsYUFBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFO29CQUNoQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7b0JBQ25DLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLHNCQUFzQixHQUFHLEdBQUcsRUFBRTtnQkFDbkMsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsR0FBRyxJQUFBLGVBQUssRUFBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMseUJBQXlCLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDL0gsQ0FBQyxDQUFDO1lBRUYsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLEVBQUU7Z0JBQ2pDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsSUFBQSxlQUFLLEVBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLCtCQUErQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQy9ILENBQUMsQ0FBQztZQUVGLElBQUkscUJBQThCLENBQUM7WUFDbkMsTUFBTSwyQkFBMkIsR0FBRyxHQUFHLEVBQUU7Z0JBQ3hDLHFCQUFxQixHQUFHLElBQUEsZUFBSyxFQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyx1Q0FBdUMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakksQ0FBQyxDQUFDO1lBRUYsc0JBQXNCLEVBQUUsQ0FBQztZQUN6QixvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLDJCQUEyQixFQUFFLENBQUM7WUFFOUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsK0JBQStCLENBQUMsRUFBRSxDQUFDO29CQUM3RCxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4QixDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQztvQkFDdkQsc0JBQXNCLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFFRCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3JFLDJCQUEyQixFQUFFLENBQUM7Z0JBQy9CLENBQUM7Z0JBRUQsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsb0NBQW9DLENBQUMsRUFBRSxDQUFDO29CQUNsRSx5QkFBeUIsRUFBRSxDQUFDO2dCQUM3QixDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQztvQkFDakUsd0JBQXdCLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFpQixDQUFDLENBQUM7WUFDaEUsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFvQixDQUFDLENBQUM7WUFDNUUsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFvQixDQUFDLENBQUM7WUFDN0UsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFvQixDQUFDLENBQUM7WUFFMUUsU0FBUyx1QkFBdUIsQ0FBQyxNQUFjLEVBQUUsV0FBNEI7Z0JBQzVFLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBVSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFILFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGtCQUFVLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUgsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZILENBQUM7WUFFRCxLQUFLLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLElBQUksSUFBQSxnQkFBVSxHQUFFLEVBQUUsQ0FBQztnQkFDcEQsdUJBQXVCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEseUJBQW1CLEVBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVoSCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixJQUFJLFNBQVMsR0FBd0IsU0FBUyxDQUFDO1lBQy9DLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztZQUV6QixNQUFNLHNCQUFzQixHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUN4RCxjQUFjLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDaEMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFDdEIsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNaLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBRTFCLFdBQVcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM1QyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0MsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDO29CQUM1QixJQUFJLE1BQU0sR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFDakIsY0FBYyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7d0JBQzlCLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ1osQ0FBQztvQkFDRCxTQUFTLEdBQUcsU0FBUyxJQUFJLElBQUEsWUFBTSxFQUFDLGNBQWMsRUFBRSxJQUFBLE9BQUMsRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxTQUFTLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLENBQUM7cUJBQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDekIsY0FBYyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7b0JBQzlCLElBQUEsWUFBTSxFQUFDLGNBQWMsRUFBRSxJQUFBLE9BQUMsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELENBQUM7Z0JBQ0Qsc0JBQXNCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLFdBQVcsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMxQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUN0QixNQUFNLEVBQUUsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25DLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxTQUFTLElBQUksMkdBQTJHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwSixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7d0JBQzVCLFlBQVksR0FBRyxJQUFJLENBQUM7b0JBQ3JCLENBQUM7eUJBQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLFNBQVMsR0FBRyxTQUFTLENBQUM7d0JBQ3RCLFlBQVksR0FBRyxLQUFLLENBQUM7b0JBQ3RCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxZQUFZLEdBQUcsSUFBSSxDQUFDO29CQUNyQixDQUFDO29CQUNELHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNsQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ25CLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQTZCLGdDQUFnQyxDQUFDLENBQUM7Z0JBQzVHLE1BQU0sS0FBSyxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVyRSxvQ0FBb0M7Z0JBQ3BDLElBQUksUUFBUSxDQUFDLElBQUksK0JBQXVCLElBQUksUUFBUSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLDJCQUEyQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQ25ILENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUNwRixDQUFDO29CQUNGLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUNDLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxRQUFRO3VCQUM3RCxNQUFNLEdBQUcsRUFBRTt1QkFDWCxLQUFLLENBQUMsT0FBTyw4QkFBc0IsSUFBSSxLQUFLLENBQUMsT0FBTywyQkFBbUI7dUJBQ3ZFLEtBQUssQ0FBQyxPQUFPLDZCQUFvQixJQUFJLEtBQUssQ0FBQyxPQUFPLCtCQUFzQjt1QkFDeEUsS0FBSyxDQUFDLE9BQU8sK0JBQXNCLElBQUksS0FBSyxDQUFDLE9BQU8sZ0NBQXVCLEVBQzdFLENBQUM7b0JBQ0YsY0FBYyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ1osQ0FBQztnQkFFRCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakUsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUVsSSxJQUFJLG9CQUFvQixHQUFHLGNBQWMsRUFBRSxLQUFLLENBQUM7Z0JBQ2pELElBQUksUUFBUSxHQUE4QixVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRWhFLElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNyRSxvQkFBb0IsR0FBRyxHQUFHLGNBQWMsQ0FBQyxRQUFRLEtBQUssb0JBQW9CLEdBQUcsQ0FBQztvQkFDL0UsQ0FBQztvQkFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNyRCxNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDOzZCQUN6RSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUV0RCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQzVCLFFBQVEsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDM0QsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLElBQUksb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUQsSUFBQSxZQUFNLEVBQUMsY0FBYyxFQUFFLElBQUEsT0FBQyxFQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsR0FBRyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDekUsQ0FBQztnQkFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDcEcsMkJBQTJCO29CQUMzQixRQUFRLEdBQUcsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO3dCQUMzQyxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDO3dCQUMzQixFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDO3dCQUMzQixFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBRTlCLElBQUEsWUFBTSxFQUFDLGNBQWMsRUFBRSxJQUFBLE9BQUMsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO2dCQUVELE1BQU0sRUFBRSxDQUFDO2dCQUNULHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwwQkFBMEIsQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDO1FBQ3JELENBQUM7UUFFTyxVQUFVLENBQUMsZ0JBQWtDO1lBQ3BELE9BQU8sZ0JBQWdCLENBQUMsSUFBSSwrQkFBdUIsQ0FBQztRQUNyRCxDQUFDO1FBRU8saUJBQWlCLENBQUMsU0FBaUI7WUFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxzQkFBWSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU1RCxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLE9BQU87b0JBQ04sS0FBSyxFQUFFLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsS0FBSztvQkFDekcsUUFBUSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLGdCQUFnQixDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2lCQUMvSixDQUFDO1lBQ0gsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsMkJBQWdCLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXBFLElBQUksb0JBQW9CLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDO2dCQUN4RSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDL0ssQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQUVELE1BQU0sZ0JBQWlCLFNBQVEsaUJBQU87UUFFckM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDZCQUE2QjtnQkFDakMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxvRkFBb0YsQ0FBQyxFQUFFLEVBQUUsK0JBQStCLENBQUM7Z0JBQ3pLLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQUVuRCxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFckIsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSx3RUFBd0UsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLGdFQUFnRSxDQUFDLENBQUMsQ0FBQztRQUMxTyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLHNCQUF1QixTQUFRLGlCQUFPO1FBRTNDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtQ0FBbUM7Z0JBQ3ZDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsQ0FBQywrREFBK0QsQ0FBQyxFQUFFLEVBQUUsb0JBQW9CLENBQUM7Z0JBQy9JLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixDQUFDLENBQUM7WUFDN0QsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDZDQUF5QixDQUFDLENBQUM7WUFDekUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7WUFDN0MsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7WUFFbkQsTUFBTSxPQUFPLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUU1RCxNQUFNLEdBQUcsR0FBRztnQkFDWCxFQUFFO2dCQUNGLGtCQUFrQjtnQkFDbEIsR0FBRyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakQsa0JBQWtCLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxXQUFXLENBQUMsTUFBTSxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDcEwsQ0FBQyxRQUFRLENBQUM7Z0JBQ1gsRUFBRTtnQkFDRixXQUFXO2dCQUNYLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLE1BQU0sQ0FBQyxNQUFNLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN4RyxDQUFDLFFBQVEsQ0FBQzthQUNYLENBQUM7WUFFRixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVoQyxhQUFhLENBQUMsV0FBVyxDQUFDLDBCQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUMsQ0FBQztLQUNEO0lBRUQsTUFBTSwrQkFBZ0MsU0FBUSxpQkFBTztpQkFFckMsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUMsT0FBTztRQUVsRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsb0RBQW9EO2dCQUN4RCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsbUNBQW1DLEVBQUUsMENBQTBDLENBQUM7Z0JBQ2pHLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDckQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxzQkFBc0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlDQUF1QixDQUFDLENBQUM7WUFDckUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlDQUFtQixDQUFDLENBQUM7WUFTN0QsTUFBTSxLQUFLLEdBQW1CLEVBQUUsQ0FBQztZQUVqQyxLQUFLLE1BQU0sS0FBSyxJQUFJLGlHQUF3RSxFQUFFLENBQUM7Z0JBQzlGLElBQUksS0FBSyxpQ0FBeUIsSUFBSSxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3ZGLFNBQVMsQ0FBQyxtQkFBbUI7Z0JBQzlCLENBQUM7Z0JBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSwyREFBMkMsRUFBRSxDQUFDO29CQUNsRSxLQUFLLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ3RELE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUM3QyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLDBCQUEwQixJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsK0JBQStCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQzs0QkFDeEksS0FBSyxDQUFDLElBQUksQ0FBQztnQ0FDVixHQUFHO2dDQUNILEtBQUs7Z0NBQ0wsTUFBTTtnQ0FDTixJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU07Z0NBQ2xCLEtBQUssRUFBRSxHQUFHO2dDQUNWLFdBQVcsRUFBRSxnQkFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO2dDQUM5QyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUseUJBQXlCLEVBQUUsS0FBSyxzQ0FBNkIsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLGlDQUF5QixDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRSxNQUFNLGtDQUEwQixDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzs2QkFDN1UsQ0FBQyxDQUFDO3dCQUNKLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV0RCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksT0FBTyxDQUEwQixPQUFPLENBQUMsRUFBRTtnQkFDMUUsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7Z0JBRTFDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFnQixDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixNQUFNLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztnQkFDM0IsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyx1Q0FBdUMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDakYsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyw0Q0FBNEMsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDO2dCQUUzSCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMscURBQXFELEVBQUUsK0NBQStDLENBQUMsQ0FBQztnQkFDdkksQ0FBQztnQkFFRCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRWQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtvQkFDdkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sYUFBYSxDQUFDLE9BQU8sQ0FBQztnQkFDakQsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLHdDQUF3QyxFQUFFLHVFQUF1RSxDQUFDO2dCQUNwSSxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsaUVBQWlFLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JMLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxzQ0FBc0MsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDO2FBQ3hILENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFnQixDQUFDO1lBQ2pELEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ2xDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELEtBQUssTUFBTSxLQUFLLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDRixDQUFDOztJQUdGLElBQUksT0FBTyxHQUFrQyxTQUFTLENBQUM7SUFDdkQsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO0lBRWhELE1BQU0sK0JBQStCLEdBQUcsSUFBSSwwQkFBYSxDQUFvQyxvQkFBb0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUU5SCxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1FBRTFDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx3Q0FBd0M7Z0JBQzVDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyx1QkFBdUIsRUFBRSw0QkFBNEIsQ0FBQztnQkFDdkUsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSwrQkFBK0IsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDOUosQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLCtCQUErQixHQUFHLCtCQUErQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNqSCwrQkFBK0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFL0Msa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFM0IsT0FBTyxHQUFHLElBQUksNkJBQWlCLEVBQUUsQ0FBQztZQUNsQyxJQUFBLGdDQUFvQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLENBQUM7S0FDRDtJQUVELE1BQU0sMEJBQTJCLFNBQVEsaUJBQU87UUFFL0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDZDQUE2QztnQkFDakQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLDhCQUE4QixDQUFDO2dCQUM5RSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUsK0JBQStCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQzthQUNsRSxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0sK0JBQStCLEdBQUcsK0JBQStCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ2pILCtCQUErQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUUvQyxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25ILENBQUM7S0FDRDtJQUVELE1BQU0sb0JBQXFCLFNBQVEsaUJBQU87UUFFekM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVDQUF1QztnQkFDM0MsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLHNCQUFzQixFQUFFLDJCQUEyQixDQUFDO2dCQUNyRSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTtnQkFDUixZQUFZLEVBQUUsK0JBQStCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQzthQUNsRSxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sK0JBQStCLEdBQUcsK0JBQStCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ2pILCtCQUErQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUUvQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO2dCQUVsRCxLQUFLLE1BQU0sVUFBVSxJQUFJLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDeEYsSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzlDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2pDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDbkYsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQzVFLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBQSxnQ0FBb0IsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixPQUFPLEdBQUcsU0FBUyxDQUFDO1lBQ3BCLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLENBQUM7S0FDRDtJQUVELDJCQUEyQjtJQUMzQixJQUFBLHlCQUFlLEVBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUMxQyxJQUFBLHlCQUFlLEVBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUM1QyxJQUFBLHlCQUFlLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNsQyxJQUFBLHlCQUFlLEVBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUN4QyxJQUFBLHlCQUFlLEVBQUMsK0JBQStCLENBQUMsQ0FBQztJQUNqRCxJQUFJLENBQUMsaUJBQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyQixJQUFBLHlCQUFlLEVBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN2QyxJQUFBLHlCQUFlLEVBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUM1QyxJQUFBLHlCQUFlLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsb0JBQW9CO0lBRXBCLG1CQUFtQjtJQUNuQixNQUFNLHFCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6RyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQztRQUMzQyxFQUFFLEVBQUUsZ0JBQWdCO1FBQ3BCLEtBQUssRUFBRSxDQUFDO1FBQ1IsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLGlCQUFpQixDQUFDO1FBQ3RFLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1gsK0JBQStCLEVBQUU7Z0JBQ2hDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxFQUFFO2dCQUNYLE9BQU8sRUFBRSxDQUFDO2dCQUNWLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxzSEFBc0gsQ0FBQzthQUN6TDtZQUNELHlCQUF5QixFQUFFO2dCQUMxQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxPQUFPLEVBQUUsRUFBRTtnQkFDWCxPQUFPLEVBQUUsR0FBRztnQkFDWixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUscUVBQXFFLENBQUM7YUFDdkg7WUFDRCxnQ0FBZ0MsRUFBRTtnQkFDakMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDRDQUE0QyxFQUFFLGtFQUFrRSxDQUFDO2dCQUN2SSxVQUFVLEVBQUU7b0JBQ1gsVUFBVSxFQUFFO3dCQUNYLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSxnQkFBZ0IsQ0FBQztxQkFDbEY7b0JBQ0QsaUJBQWlCLEVBQUU7d0JBQ2xCLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnREFBZ0QsRUFBRSwwQkFBMEIsQ0FBQztxQkFDbkc7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSxxQkFBcUIsQ0FBQztxQkFDM0Y7b0JBQ0QsbUJBQW1CLEVBQUU7d0JBQ3BCLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRSxLQUFLO3dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxrREFBa0QsRUFBRSx5REFBeUQsQ0FBQztxQkFDcEk7b0JBQ0QsNkJBQTZCLEVBQUU7d0JBQzlCLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRSxJQUFJO3dCQUNiLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0REFBNEQsRUFBRSwwQ0FBMEMsQ0FBQztxQkFDL0g7aUJBQ0Q7Z0JBQ0QsT0FBTyxFQUFFO29CQUNSLFVBQVUsRUFBRSxJQUFJO29CQUNoQixpQkFBaUIsRUFBRSxJQUFJO29CQUN2QixjQUFjLEVBQUUsSUFBSTtvQkFDcEIsbUJBQW1CLEVBQUUsS0FBSztvQkFDMUIsNkJBQTZCLEVBQUUsSUFBSTtpQkFDbkM7Z0JBQ0Qsb0JBQW9CLEVBQUUsS0FBSzthQUMzQjtZQUNELHVDQUF1QyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsR0FBRztnQkFDWixPQUFPLEVBQUUsR0FBRztnQkFDWixPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUNBQXVDLEVBQUUsdUZBQXVGLENBQUM7YUFDdko7WUFDRCxvQ0FBb0MsRUFBRTtnQkFDckMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLE9BQU8sRUFBRSxTQUFTO2dCQUNsQixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsMEdBQTBHLENBQUM7YUFDdks7WUFDRCxtQ0FBbUMsRUFBRTtnQkFDcEMsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLEdBQUc7Z0JBQ1osV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG1DQUFtQyxFQUFFLDBFQUEwRSxDQUFDO2FBQ3RJO1NBQ0Q7S0FDRCxDQUFDLENBQUMifQ==
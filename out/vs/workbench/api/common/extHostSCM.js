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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/async", "./extHost.protocol", "vs/base/common/arrays", "vs/base/common/comparers", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions", "vs/base/common/themables", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/services/extensions/common/extensions", "vs/base/common/network", "vs/base/common/platform"], function (require, exports, uri_1, event_1, decorators_1, lifecycle_1, async_1, extHost_protocol_1, arrays_1, comparers_1, log_1, extensions_1, themables_1, extHostTypeConverters_1, extensions_2, network_1, platform_1) {
    "use strict";
    var ExtHostSCM_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSCM = exports.ExtHostSCMInputBox = void 0;
    function isUri(thing) {
        return thing instanceof uri_1.URI;
    }
    function uriEquals(a, b) {
        if (a.scheme === network_1.Schemas.file && b.scheme === network_1.Schemas.file && platform_1.isLinux) {
            return a.toString() === b.toString();
        }
        return a.toString().toLowerCase() === b.toString().toLowerCase();
    }
    function getIconResource(decorations) {
        if (!decorations) {
            return undefined;
        }
        else if (typeof decorations.iconPath === 'string') {
            return uri_1.URI.file(decorations.iconPath);
        }
        else if (uri_1.URI.isUri(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else if (themables_1.ThemeIcon.isThemeIcon(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else {
            return undefined;
        }
    }
    function getHistoryItemIconDto(historyItem) {
        if (!historyItem.icon) {
            return undefined;
        }
        else if (uri_1.URI.isUri(historyItem.icon)) {
            return historyItem.icon;
        }
        else if (themables_1.ThemeIcon.isThemeIcon(historyItem.icon)) {
            return historyItem.icon;
        }
        else {
            const icon = historyItem.icon;
            return { light: icon.light, dark: icon.dark };
        }
    }
    function compareResourceThemableDecorations(a, b) {
        if (!a.iconPath && !b.iconPath) {
            return 0;
        }
        else if (!a.iconPath) {
            return -1;
        }
        else if (!b.iconPath) {
            return 1;
        }
        const aPath = typeof a.iconPath === 'string' ? a.iconPath : uri_1.URI.isUri(a.iconPath) ? a.iconPath.fsPath : a.iconPath.id;
        const bPath = typeof b.iconPath === 'string' ? b.iconPath : uri_1.URI.isUri(b.iconPath) ? b.iconPath.fsPath : b.iconPath.id;
        return (0, comparers_1.comparePaths)(aPath, bPath);
    }
    function compareResourceStatesDecorations(a, b) {
        let result = 0;
        if (a.strikeThrough !== b.strikeThrough) {
            return a.strikeThrough ? 1 : -1;
        }
        if (a.faded !== b.faded) {
            return a.faded ? 1 : -1;
        }
        if (a.tooltip !== b.tooltip) {
            return (a.tooltip || '').localeCompare(b.tooltip || '');
        }
        result = compareResourceThemableDecorations(a, b);
        if (result !== 0) {
            return result;
        }
        if (a.light && b.light) {
            result = compareResourceThemableDecorations(a.light, b.light);
        }
        else if (a.light) {
            return 1;
        }
        else if (b.light) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.dark && b.dark) {
            result = compareResourceThemableDecorations(a.dark, b.dark);
        }
        else if (a.dark) {
            return 1;
        }
        else if (b.dark) {
            return -1;
        }
        return result;
    }
    function compareCommands(a, b) {
        if (a.command !== b.command) {
            return a.command < b.command ? -1 : 1;
        }
        if (a.title !== b.title) {
            return a.title < b.title ? -1 : 1;
        }
        if (a.tooltip !== b.tooltip) {
            if (a.tooltip !== undefined && b.tooltip !== undefined) {
                return a.tooltip < b.tooltip ? -1 : 1;
            }
            else if (a.tooltip !== undefined) {
                return 1;
            }
            else if (b.tooltip !== undefined) {
                return -1;
            }
        }
        if (a.arguments === b.arguments) {
            return 0;
        }
        else if (!a.arguments) {
            return -1;
        }
        else if (!b.arguments) {
            return 1;
        }
        else if (a.arguments.length !== b.arguments.length) {
            return a.arguments.length - b.arguments.length;
        }
        for (let i = 0; i < a.arguments.length; i++) {
            const aArg = a.arguments[i];
            const bArg = b.arguments[i];
            if (aArg === bArg) {
                continue;
            }
            if (isUri(aArg) && isUri(bArg) && uriEquals(aArg, bArg)) {
                continue;
            }
            return aArg < bArg ? -1 : 1;
        }
        return 0;
    }
    function compareResourceStates(a, b) {
        let result = (0, comparers_1.comparePaths)(a.resourceUri.fsPath, b.resourceUri.fsPath, true);
        if (result !== 0) {
            return result;
        }
        if (a.command && b.command) {
            result = compareCommands(a.command, b.command);
        }
        else if (a.command) {
            return 1;
        }
        else if (b.command) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.decorations && b.decorations) {
            result = compareResourceStatesDecorations(a.decorations, b.decorations);
        }
        else if (a.decorations) {
            return 1;
        }
        else if (b.decorations) {
            return -1;
        }
        if (a.multiFileDiffEditorModifiedUri && b.multiFileDiffEditorModifiedUri) {
            result = (0, comparers_1.comparePaths)(a.multiFileDiffEditorModifiedUri.fsPath, b.multiFileDiffEditorModifiedUri.fsPath, true);
        }
        else if (a.multiFileDiffEditorModifiedUri) {
            return 1;
        }
        else if (b.multiFileDiffEditorModifiedUri) {
            return -1;
        }
        if (a.multiDiffEditorOriginalUri && b.multiDiffEditorOriginalUri) {
            result = (0, comparers_1.comparePaths)(a.multiDiffEditorOriginalUri.fsPath, b.multiDiffEditorOriginalUri.fsPath, true);
        }
        else if (a.multiDiffEditorOriginalUri) {
            return 1;
        }
        else if (b.multiDiffEditorOriginalUri) {
            return -1;
        }
        return result;
    }
    function compareArgs(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function commandEquals(a, b) {
        return a.command === b.command
            && a.title === b.title
            && a.tooltip === b.tooltip
            && (a.arguments && b.arguments ? compareArgs(a.arguments, b.arguments) : a.arguments === b.arguments);
    }
    function commandListEquals(a, b) {
        return (0, arrays_1.equals)(a, b, commandEquals);
    }
    class ExtHostSCMInputBox {
        #proxy;
        #extHostDocuments;
        get value() {
            return this._value;
        }
        set value(value) {
            value = value ?? '';
            this.#proxy.$setInputBoxValue(this._sourceControlHandle, value);
            this.updateValue(value);
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this.#proxy.$setInputBoxPlaceholder(this._sourceControlHandle, placeholder);
            this._placeholder = placeholder;
        }
        get validateInput() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            return this._validateInput;
        }
        set validateInput(fn) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            if (fn && typeof fn !== 'function') {
                throw new Error(`[${this._extension.identifier.value}]: Invalid SCM input box validation function`);
            }
            this._validateInput = fn;
            this.#proxy.$setValidationProviderIsEnabled(this._sourceControlHandle, !!fn);
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            enabled = !!enabled;
            if (this._enabled === enabled) {
                return;
            }
            this._enabled = enabled;
            this.#proxy.$setInputBoxEnablement(this._sourceControlHandle, enabled);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            visible = !!visible;
            if (this._visible === visible) {
                return;
            }
            this._visible = visible;
            this.#proxy.$setInputBoxVisibility(this._sourceControlHandle, visible);
        }
        get document() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmTextDocument');
            return this.#extHostDocuments.getDocument(this._documentUri);
        }
        constructor(_extension, _extHostDocuments, proxy, _sourceControlHandle, _documentUri) {
            this._extension = _extension;
            this._sourceControlHandle = _sourceControlHandle;
            this._documentUri = _documentUri;
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this._placeholder = '';
            this._enabled = true;
            this._visible = true;
            this.#extHostDocuments = _extHostDocuments;
            this.#proxy = proxy;
        }
        showValidationMessage(message, type) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            this.#proxy.$showValidationMessage(this._sourceControlHandle, message, type);
        }
        $onInputBoxValueChange(value) {
            this.updateValue(value);
        }
        updateValue(value) {
            this._value = value;
            this._onDidChange.fire(value);
        }
    }
    exports.ExtHostSCMInputBox = ExtHostSCMInputBox;
    class ExtHostSourceControlResourceGroup {
        static { this._handlePool = 0; }
        get disposed() { return this._disposed; }
        get id() { return this._id; }
        get label() { return this._label; }
        set label(label) {
            this._label = label;
            this._proxy.$updateGroupLabel(this._sourceControlHandle, this.handle, label);
        }
        get hideWhenEmpty() { return this._hideWhenEmpty; }
        set hideWhenEmpty(hideWhenEmpty) {
            this._hideWhenEmpty = hideWhenEmpty;
            this._proxy.$updateGroup(this._sourceControlHandle, this.handle, this.features);
        }
        get features() {
            return {
                hideWhenEmpty: this.hideWhenEmpty
            };
        }
        get resourceStates() { return [...this._resourceStates]; }
        set resourceStates(resources) {
            this._resourceStates = [...resources];
            this._onDidUpdateResourceStates.fire();
        }
        constructor(_proxy, _commands, _sourceControlHandle, _id, _label, multiDiffEditorEnableViewChanges, _extension) {
            this._proxy = _proxy;
            this._commands = _commands;
            this._sourceControlHandle = _sourceControlHandle;
            this._id = _id;
            this._label = _label;
            this.multiDiffEditorEnableViewChanges = multiDiffEditorEnableViewChanges;
            this._extension = _extension;
            this._resourceHandlePool = 0;
            this._resourceStates = [];
            this._resourceStatesMap = new Map();
            this._resourceStatesCommandsMap = new Map();
            this._resourceStatesDisposablesMap = new Map();
            this._onDidUpdateResourceStates = new event_1.Emitter();
            this.onDidUpdateResourceStates = this._onDidUpdateResourceStates.event;
            this._disposed = false;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._handlesSnapshot = [];
            this._resourceSnapshot = [];
            this._hideWhenEmpty = undefined;
            this.handle = ExtHostSourceControlResourceGroup._handlePool++;
        }
        getResourceState(handle) {
            return this._resourceStatesMap.get(handle);
        }
        $executeResourceCommand(handle, preserveFocus) {
            const command = this._resourceStatesCommandsMap.get(handle);
            if (!command) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => this._commands.executeCommand(command.command, ...(command.arguments || []), preserveFocus));
        }
        _takeResourceStateSnapshot() {
            const snapshot = [...this._resourceStates].sort(compareResourceStates);
            const diffs = (0, arrays_1.sortedDiff)(this._resourceSnapshot, snapshot, compareResourceStates);
            const splices = diffs.map(diff => {
                const toInsert = diff.toInsert.map(r => {
                    const handle = this._resourceHandlePool++;
                    this._resourceStatesMap.set(handle, r);
                    const sourceUri = r.resourceUri;
                    let command;
                    if (r.command) {
                        if (r.command.command === 'vscode.open' || r.command.command === 'vscode.diff' || r.command.command === 'vscode.changes') {
                            const disposables = new lifecycle_1.DisposableStore();
                            command = this._commands.converter.toInternal(r.command, disposables);
                            this._resourceStatesDisposablesMap.set(handle, disposables);
                        }
                        else {
                            this._resourceStatesCommandsMap.set(handle, r.command);
                        }
                    }
                    const hasScmMultiDiffEditorProposalEnabled = (0, extensions_2.isProposedApiEnabled)(this._extension, 'scmMultiDiffEditor');
                    const multiFileDiffEditorOriginalUri = hasScmMultiDiffEditorProposalEnabled ? r.multiDiffEditorOriginalUri : undefined;
                    const multiFileDiffEditorModifiedUri = hasScmMultiDiffEditorProposalEnabled ? r.multiFileDiffEditorModifiedUri : undefined;
                    const icon = getIconResource(r.decorations);
                    const lightIcon = r.decorations && getIconResource(r.decorations.light) || icon;
                    const darkIcon = r.decorations && getIconResource(r.decorations.dark) || icon;
                    const icons = [lightIcon, darkIcon];
                    const tooltip = (r.decorations && r.decorations.tooltip) || '';
                    const strikeThrough = r.decorations && !!r.decorations.strikeThrough;
                    const faded = r.decorations && !!r.decorations.faded;
                    const contextValue = r.contextValue || '';
                    const rawResource = [handle, sourceUri, icons, tooltip, strikeThrough, faded, contextValue, command, multiFileDiffEditorOriginalUri, multiFileDiffEditorModifiedUri];
                    return { rawResource, handle };
                });
                return { start: diff.start, deleteCount: diff.deleteCount, toInsert };
            });
            const rawResourceSplices = splices
                .map(({ start, deleteCount, toInsert }) => [start, deleteCount, toInsert.map(i => i.rawResource)]);
            const reverseSplices = splices.reverse();
            for (const { start, deleteCount, toInsert } of reverseSplices) {
                const handles = toInsert.map(i => i.handle);
                const handlesToDelete = this._handlesSnapshot.splice(start, deleteCount, ...handles);
                for (const handle of handlesToDelete) {
                    this._resourceStatesMap.delete(handle);
                    this._resourceStatesCommandsMap.delete(handle);
                    this._resourceStatesDisposablesMap.get(handle)?.dispose();
                    this._resourceStatesDisposablesMap.delete(handle);
                }
            }
            this._resourceSnapshot = snapshot;
            return rawResourceSplices;
        }
        dispose() {
            this._disposed = true;
            this._onDidDispose.fire();
        }
    }
    class ExtHostSourceControl {
        static { this._handlePool = 0; }
        #proxy;
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get rootUri() {
            return this._rootUri;
        }
        get inputBox() { return this._inputBox; }
        get count() {
            return this._count;
        }
        set count(count) {
            if (this._count === count) {
                return;
            }
            this._count = count;
            this.#proxy.$updateSourceControl(this.handle, { count });
        }
        get quickDiffProvider() {
            return this._quickDiffProvider;
        }
        set quickDiffProvider(quickDiffProvider) {
            this._quickDiffProvider = quickDiffProvider;
            let quickDiffLabel = undefined;
            if ((0, extensions_2.isProposedApiEnabled)(this._extension, 'quickDiffProvider')) {
                quickDiffLabel = quickDiffProvider?.label;
            }
            this.#proxy.$updateSourceControl(this.handle, { hasQuickDiffProvider: !!quickDiffProvider, quickDiffLabel });
        }
        get historyProvider() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmHistoryProvider');
            return this._historyProvider;
        }
        set historyProvider(historyProvider) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmHistoryProvider');
            this._historyProvider = historyProvider;
            this._historyProviderDisposable.value = new lifecycle_1.DisposableStore();
            this.#proxy.$updateSourceControl(this.handle, { hasHistoryProvider: !!historyProvider });
            if (historyProvider) {
                this._historyProviderDisposable.value.add(historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                    this._historyProviderCurrentHistoryItemGroup = historyProvider?.currentHistoryItemGroup;
                    this.#proxy.$onDidChangeHistoryProviderCurrentHistoryItemGroup(this.handle, this._historyProviderCurrentHistoryItemGroup);
                }));
            }
        }
        get commitTemplate() {
            return this._commitTemplate;
        }
        set commitTemplate(commitTemplate) {
            if (commitTemplate === this._commitTemplate) {
                return;
            }
            this._commitTemplate = commitTemplate;
            this.#proxy.$updateSourceControl(this.handle, { commitTemplate });
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        set acceptInputCommand(acceptInputCommand) {
            this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            this._acceptInputCommand = acceptInputCommand;
            const internal = this._commands.converter.toInternal(acceptInputCommand, this._acceptInputDisposables.value);
            this.#proxy.$updateSourceControl(this.handle, { acceptInputCommand: internal });
        }
        get actionButton() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            return this._actionButton;
        }
        set actionButton(actionButton) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            this._actionButtonDisposables.value = new lifecycle_1.DisposableStore();
            this._actionButton = actionButton;
            const internal = actionButton !== undefined ?
                {
                    command: this._commands.converter.toInternal(actionButton.command, this._actionButtonDisposables.value),
                    secondaryCommands: actionButton.secondaryCommands?.map(commandGroup => {
                        return commandGroup.map(command => this._commands.converter.toInternal(command, this._actionButtonDisposables.value));
                    }),
                    description: actionButton.description,
                    enabled: actionButton.enabled
                } : undefined;
            this.#proxy.$updateSourceControl(this.handle, { actionButton: internal ?? null });
        }
        get statusBarCommands() {
            return this._statusBarCommands;
        }
        set statusBarCommands(statusBarCommands) {
            if (this._statusBarCommands && statusBarCommands && commandListEquals(this._statusBarCommands, statusBarCommands)) {
                return;
            }
            this._statusBarDisposables.value = new lifecycle_1.DisposableStore();
            this._statusBarCommands = statusBarCommands;
            const internal = (statusBarCommands || []).map(c => this._commands.converter.toInternal(c, this._statusBarDisposables.value));
            this.#proxy.$updateSourceControl(this.handle, { statusBarCommands: internal });
        }
        get selected() {
            return this._selected;
        }
        constructor(_extension, _extHostDocuments, proxy, _commands, _id, _label, _rootUri) {
            this._extension = _extension;
            this._commands = _commands;
            this._id = _id;
            this._label = _label;
            this._rootUri = _rootUri;
            this._groups = new Map();
            this._count = undefined;
            this._quickDiffProvider = undefined;
            this._historyProviderDisposable = new lifecycle_1.MutableDisposable();
            this._commitTemplate = undefined;
            this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
            this._acceptInputCommand = undefined;
            this._actionButtonDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarCommands = undefined;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.handle = ExtHostSourceControl._handlePool++;
            this.createdResourceGroups = new Map();
            this.updatedResourceGroups = new Set();
            this.#proxy = proxy;
            const inputBoxDocumentUri = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeSourceControl,
                path: `${_id}/scm${this.handle}/input`,
                query: _rootUri ? `rootUri=${encodeURIComponent(_rootUri.toString())}` : undefined
            });
            this._inputBox = new ExtHostSCMInputBox(_extension, _extHostDocuments, this.#proxy, this.handle, inputBoxDocumentUri);
            this.#proxy.$registerSourceControl(this.handle, _id, _label, _rootUri, inputBoxDocumentUri);
        }
        createResourceGroup(id, label, options) {
            const multiDiffEditorEnableViewChanges = (0, extensions_2.isProposedApiEnabled)(this._extension, 'scmMultiDiffEditor') && options?.multiDiffEditorEnableViewChanges === true;
            const group = new ExtHostSourceControlResourceGroup(this.#proxy, this._commands, this.handle, id, label, multiDiffEditorEnableViewChanges, this._extension);
            const disposable = event_1.Event.once(group.onDidDispose)(() => this.createdResourceGroups.delete(group));
            this.createdResourceGroups.set(group, disposable);
            this.eventuallyAddResourceGroups();
            return group;
        }
        eventuallyAddResourceGroups() {
            const groups = [];
            const splices = [];
            for (const [group, disposable] of this.createdResourceGroups) {
                disposable.dispose();
                const updateListener = group.onDidUpdateResourceStates(() => {
                    this.updatedResourceGroups.add(group);
                    this.eventuallyUpdateResourceStates();
                });
                event_1.Event.once(group.onDidDispose)(() => {
                    this.updatedResourceGroups.delete(group);
                    updateListener.dispose();
                    this._groups.delete(group.handle);
                    this.#proxy.$unregisterGroup(this.handle, group.handle);
                });
                groups.push([group.handle, group.id, group.label, group.features, group.multiDiffEditorEnableViewChanges]);
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length > 0) {
                    splices.push([group.handle, snapshot]);
                }
                this._groups.set(group.handle, group);
            }
            this.#proxy.$registerGroups(this.handle, groups, splices);
            this.createdResourceGroups.clear();
        }
        eventuallyUpdateResourceStates() {
            const splices = [];
            this.updatedResourceGroups.forEach(group => {
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length === 0) {
                    return;
                }
                splices.push([group.handle, snapshot]);
            });
            if (splices.length > 0) {
                this.#proxy.$spliceResourceStates(this.handle, splices);
            }
            this.updatedResourceGroups.clear();
        }
        getResourceGroup(handle) {
            return this._groups.get(handle);
        }
        setSelectionState(selected) {
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this._acceptInputDisposables.dispose();
            this._actionButtonDisposables.dispose();
            this._statusBarDisposables.dispose();
            this._groups.forEach(group => group.dispose());
            this.#proxy.$unregisterSourceControl(this.handle);
        }
    }
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyAddResourceGroups", null);
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyUpdateResourceStates", null);
    let ExtHostSCM = class ExtHostSCM {
        static { ExtHostSCM_1 = this; }
        static { this._handlePool = 0; }
        get onDidChangeActiveProvider() { return this._onDidChangeActiveProvider.event; }
        constructor(mainContext, _commands, _extHostDocuments, logService) {
            this._commands = _commands;
            this._extHostDocuments = _extHostDocuments;
            this.logService = logService;
            this._sourceControls = new Map();
            this._sourceControlsByExtension = new extensions_1.ExtensionIdentifierMap();
            this._onDidChangeActiveProvider = new event_1.Emitter();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSCM);
            this._telemetry = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            _commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 3 /* MarshalledId.ScmResource */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        const group = sourceControl.getResourceGroup(arg.groupHandle);
                        if (!group) {
                            return arg;
                        }
                        return group.getResourceState(arg.handle);
                    }
                    else if (arg && arg.$mid === 4 /* MarshalledId.ScmResourceGroup */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl.getResourceGroup(arg.groupHandle);
                    }
                    else if (arg && arg.$mid === 5 /* MarshalledId.ScmProvider */) {
                        const sourceControl = this._sourceControls.get(arg.handle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl;
                    }
                    return arg;
                }
            });
        }
        createSourceControl(extension, id, label, rootUri) {
            this.logService.trace('ExtHostSCM#createSourceControl', extension.identifier.value, id, label, rootUri);
            this._telemetry.$publicLog2('api/scm/createSourceControl', {
                extensionId: extension.identifier.value,
            });
            const handle = ExtHostSCM_1._handlePool++;
            const sourceControl = new ExtHostSourceControl(extension, this._extHostDocuments, this._proxy, this._commands, id, label, rootUri);
            this._sourceControls.set(handle, sourceControl);
            const sourceControls = this._sourceControlsByExtension.get(extension.identifier) || [];
            sourceControls.push(sourceControl);
            this._sourceControlsByExtension.set(extension.identifier, sourceControls);
            return sourceControl;
        }
        // Deprecated
        getLastInputBox(extension) {
            this.logService.trace('ExtHostSCM#getLastInputBox', extension.identifier.value);
            const sourceControls = this._sourceControlsByExtension.get(extension.identifier);
            const sourceControl = sourceControls && sourceControls[sourceControls.length - 1];
            return sourceControl && sourceControl.inputBox;
        }
        $provideOriginalResource(sourceControlHandle, uriComponents, token) {
            const uri = uri_1.URI.revive(uriComponents);
            this.logService.trace('ExtHostSCM#$provideOriginalResource', sourceControlHandle, uri.toString());
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl || !sourceControl.quickDiffProvider || !sourceControl.quickDiffProvider.provideOriginalResource) {
                return Promise.resolve(null);
            }
            return (0, async_1.asPromise)(() => sourceControl.quickDiffProvider.provideOriginalResource(uri, token))
                .then(r => r || null);
        }
        $onInputBoxValueChange(sourceControlHandle, value) {
            this.logService.trace('ExtHostSCM#$onInputBoxValueChange', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            sourceControl.inputBox.$onInputBoxValueChange(value);
            return Promise.resolve(undefined);
        }
        $executeResourceCommand(sourceControlHandle, groupHandle, handle, preserveFocus) {
            this.logService.trace('ExtHostSCM#$executeResourceCommand', sourceControlHandle, groupHandle, handle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            const group = sourceControl.getResourceGroup(groupHandle);
            if (!group) {
                return Promise.resolve(undefined);
            }
            return group.$executeResourceCommand(handle, preserveFocus);
        }
        $validateInput(sourceControlHandle, value, cursorPosition) {
            this.logService.trace('ExtHostSCM#$validateInput', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            if (!sourceControl.inputBox.validateInput) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => sourceControl.inputBox.validateInput(value, cursorPosition)).then(result => {
                if (!result) {
                    return Promise.resolve(undefined);
                }
                const message = extHostTypeConverters_1.MarkdownString.fromStrict(result.message);
                if (!message) {
                    return Promise.resolve(undefined);
                }
                return Promise.resolve([message, result.type]);
            });
        }
        $setSelectedSourceControl(selectedSourceControlHandle) {
            this.logService.trace('ExtHostSCM#$setSelectedSourceControl', selectedSourceControlHandle);
            if (selectedSourceControlHandle !== undefined) {
                this._sourceControls.get(selectedSourceControlHandle)?.setSelectionState(true);
            }
            if (this._selectedSourceControlHandle !== undefined) {
                this._sourceControls.get(this._selectedSourceControlHandle)?.setSelectionState(false);
            }
            this._selectedSourceControlHandle = selectedSourceControlHandle;
            return Promise.resolve(undefined);
        }
        async $resolveHistoryItemGroupCommonAncestor(sourceControlHandle, historyItemGroupId1, historyItemGroupId2, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            return await historyProvider?.resolveHistoryItemGroupCommonAncestor(historyItemGroupId1, historyItemGroupId2, token) ?? undefined;
        }
        async $provideHistoryItems(sourceControlHandle, historyItemGroupId, options, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            const historyItems = await historyProvider?.provideHistoryItems(historyItemGroupId, options, token);
            return historyItems?.map(item => ({ ...item, icon: getHistoryItemIconDto(item) })) ?? undefined;
        }
        async $provideHistoryItemSummary(sourceControlHandle, historyItemId, historyItemParentId, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            if (typeof historyProvider?.provideHistoryItemSummary !== 'function') {
                return undefined;
            }
            const historyItem = await historyProvider.provideHistoryItemSummary(historyItemId, historyItemParentId, token);
            return historyItem ? { ...historyItem, icon: getHistoryItemIconDto(historyItem) } : undefined;
        }
        async $provideHistoryItemChanges(sourceControlHandle, historyItemId, historyItemParentId, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            return await historyProvider?.provideHistoryItemChanges(historyItemId, historyItemParentId, token) ?? undefined;
        }
    };
    exports.ExtHostSCM = ExtHostSCM;
    exports.ExtHostSCM = ExtHostSCM = ExtHostSCM_1 = __decorate([
        __param(3, log_1.ILogService)
    ], ExtHostSCM);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNDTS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFNDTS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyxTQUFTLEtBQUssQ0FBQyxLQUFVO1FBQ3hCLE9BQU8sS0FBSyxZQUFZLFNBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsQ0FBYSxFQUFFLENBQWE7UUFDOUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksa0JBQU8sRUFBRSxDQUFDO1lBQ3ZFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2xFLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxXQUE2RDtRQUNyRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbEIsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQzthQUFNLElBQUksT0FBTyxXQUFXLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3JELE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsQ0FBQzthQUFNLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUM1QyxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDN0IsQ0FBQzthQUFNLElBQUkscUJBQVMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDeEQsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDO1FBQzdCLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLHFCQUFxQixDQUFDLFdBQTRDO1FBQzFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkIsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQzthQUFNLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN4QyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUM7UUFDekIsQ0FBQzthQUFNLElBQUkscUJBQVMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDcEQsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBQ3pCLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQWlDLENBQUM7WUFDM0QsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0MsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLGtDQUFrQyxDQUFDLENBQWtELEVBQUUsQ0FBa0Q7UUFDakosSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO2FBQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQzthQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsUUFBNkIsQ0FBQyxFQUFFLENBQUM7UUFDNUksTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsUUFBNkIsQ0FBQyxFQUFFLENBQUM7UUFDNUksT0FBTyxJQUFBLHdCQUFZLEVBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxTQUFTLGdDQUFnQyxDQUFDLENBQTBDLEVBQUUsQ0FBMEM7UUFDL0gsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRWYsSUFBSSxDQUFDLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFRCxNQUFNLEdBQUcsa0NBQWtDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWxELElBQUksTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEIsTUFBTSxHQUFHLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9ELENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdEIsTUFBTSxHQUFHLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdELENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsZUFBZSxDQUFDLENBQWlCLEVBQUUsQ0FBaUI7UUFDNUQsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QixPQUFPLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QixPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQzthQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDekIsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQzthQUFNLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN0RCxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1FBQ2hELENBQUM7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUIsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ25CLFNBQVM7WUFDVixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDekQsU0FBUztZQUNWLENBQUM7WUFFRCxPQUFPLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUMsQ0FBb0MsRUFBRSxDQUFvQztRQUN4RyxJQUFJLE1BQU0sR0FBRyxJQUFBLHdCQUFZLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUUsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDbEIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixNQUFNLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEMsTUFBTSxHQUFHLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLDhCQUE4QixJQUFJLENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQzFFLE1BQU0sR0FBRyxJQUFBLHdCQUFZLEVBQUMsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsOEJBQThCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9HLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQzthQUFNLElBQUksQ0FBQyxDQUFDLDhCQUE4QixFQUFFLENBQUM7WUFDN0MsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsQ0FBQywwQkFBMEIsSUFBSSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNsRSxNQUFNLEdBQUcsSUFBQSx3QkFBWSxFQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2RyxDQUFDO2FBQU0sSUFBSSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUN6QyxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7YUFBTSxJQUFJLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsQ0FBUSxFQUFFLENBQVE7UUFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLENBQWlCLEVBQUUsQ0FBaUI7UUFDMUQsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPO2VBQzFCLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLEtBQUs7ZUFDbkIsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUMsT0FBTztlQUN2QixDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4RyxDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxDQUE0QixFQUFFLENBQTRCO1FBQ3BGLE9BQU8sSUFBQSxlQUFNLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBTUQsTUFBYSxrQkFBa0I7UUFFOUIsTUFBTSxDQUFxQjtRQUMzQixpQkFBaUIsQ0FBbUI7UUFJcEMsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxLQUFhO1lBQ3RCLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUlELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDaEMsQ0FBQztRQUlELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxXQUFXLENBQUMsV0FBbUI7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDakMsQ0FBQztRQUlELElBQUksYUFBYTtZQUNoQixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFMUQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLGFBQWEsQ0FBQyxFQUE4QjtZQUMvQyxJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFMUQsSUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLDhDQUE4QyxDQUFDLENBQUM7WUFDckcsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBSUQsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFnQjtZQUMzQixPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUVwQixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUlELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBZ0I7WUFDM0IsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFFcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUMvQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUU1RCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxZQUFvQixVQUFpQyxFQUFFLGlCQUFtQyxFQUFFLEtBQXlCLEVBQVUsb0JBQTRCLEVBQVUsWUFBaUI7WUFBbEssZUFBVSxHQUFWLFVBQVUsQ0FBdUI7WUFBMEUseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFRO1lBQVUsaUJBQVksR0FBWixZQUFZLENBQUs7WUF4RjlLLFdBQU0sR0FBVyxFQUFFLENBQUM7WUFZWCxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFNOUMsaUJBQVksR0FBVyxFQUFFLENBQUM7WUE4QjFCLGFBQVEsR0FBWSxJQUFJLENBQUM7WUFpQnpCLGFBQVEsR0FBWSxJQUFJLENBQUM7WUF3QmhDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztZQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNyQixDQUFDO1FBRUQscUJBQXFCLENBQUMsT0FBdUMsRUFBRSxJQUFnRDtZQUM5RyxJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFMUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxFQUFFLElBQVcsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxLQUFhO1lBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVPLFdBQVcsQ0FBQyxLQUFhO1lBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7S0FDRDtJQWhIRCxnREFnSEM7SUFFRCxNQUFNLGlDQUFpQztpQkFFdkIsZ0JBQVcsR0FBVyxDQUFDLEFBQVosQ0FBYTtRQVl2QyxJQUFJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBT2xELElBQUksRUFBRSxLQUFhLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFckMsSUFBSSxLQUFLLEtBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMzQyxJQUFJLEtBQUssQ0FBQyxLQUFhO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUdELElBQUksYUFBYSxLQUEwQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLElBQUksYUFBYSxDQUFDLGFBQWtDO1lBQ25ELElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTztnQkFDTixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7YUFDakMsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLGNBQWMsS0FBMEMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvRixJQUFJLGNBQWMsQ0FBQyxTQUE4QztZQUNoRSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEMsQ0FBQztRQUlELFlBQ1MsTUFBMEIsRUFDMUIsU0FBMEIsRUFDMUIsb0JBQTRCLEVBQzVCLEdBQVcsRUFDWCxNQUFjLEVBQ04sZ0NBQXlDLEVBQ3hDLFVBQWlDO1lBTjFDLFdBQU0sR0FBTixNQUFNLENBQW9CO1lBQzFCLGNBQVMsR0FBVCxTQUFTLENBQWlCO1lBQzFCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBUTtZQUM1QixRQUFHLEdBQUgsR0FBRyxDQUFRO1lBQ1gsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNOLHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBUztZQUN4QyxlQUFVLEdBQVYsVUFBVSxDQUF1QjtZQXREM0Msd0JBQW1CLEdBQVcsQ0FBQyxDQUFDO1lBQ2hDLG9CQUFlLEdBQXdDLEVBQUUsQ0FBQztZQUUxRCx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBMEQsQ0FBQztZQUN2RiwrQkFBMEIsR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztZQUM1RSxrQ0FBNkIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztZQUVuRSwrQkFBMEIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3pELDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFFbkUsY0FBUyxHQUFHLEtBQUssQ0FBQztZQUVULGtCQUFhLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUM1QyxpQkFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRXpDLHFCQUFnQixHQUFhLEVBQUUsQ0FBQztZQUNoQyxzQkFBaUIsR0FBd0MsRUFBRSxDQUFDO1lBVTVELG1CQUFjLEdBQXdCLFNBQVMsQ0FBQztZQW1CL0MsV0FBTSxHQUFHLGlDQUFpQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBVTlELENBQUM7UUFFTCxnQkFBZ0IsQ0FBQyxNQUFjO1lBQzlCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsdUJBQXVCLENBQUMsTUFBYyxFQUFFLGFBQXNCO1lBQzdELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFNUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsT0FBTyxJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3JILENBQUM7UUFFRCwwQkFBMEI7WUFDekIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN2RSxNQUFNLEtBQUssR0FBRyxJQUFBLG1CQUFVLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBRWxGLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQTJELElBQUksQ0FBQyxFQUFFO2dCQUMxRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUV2QyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUVoQyxJQUFJLE9BQWdDLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEtBQUssYUFBYSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUFLLGFBQWEsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxnQkFBZ0IsRUFBRSxDQUFDOzRCQUMxSCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQzs0QkFDMUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDOzRCQUN0RSxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQzt3QkFDN0QsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDeEQsQ0FBQztvQkFDRixDQUFDO29CQUVELE1BQU0sb0NBQW9DLEdBQUcsSUFBQSxpQ0FBb0IsRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUM7b0JBQ3pHLE1BQU0sOEJBQThCLEdBQUcsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUN2SCxNQUFNLDhCQUE4QixHQUFHLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFFM0gsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDNUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUM7b0JBQ2hGLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxXQUFXLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO29CQUM5RSxNQUFNLEtBQUssR0FBc0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBRXZELE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDL0QsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7b0JBQ3JFLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO29CQUNyRCxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztvQkFFMUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDhCQUE4QixFQUFFLDhCQUE4QixDQUFtQixDQUFDO29CQUV2TCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFFSCxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFDdkUsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLGtCQUFrQixHQUFHLE9BQU87aUJBQ2hDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQXlCLENBQUMsQ0FBQztZQUU1SCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFekMsS0FBSyxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUM7Z0JBRXJGLEtBQUssTUFBTSxNQUFNLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQy9DLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQzFELElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25ELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztZQUNsQyxPQUFPLGtCQUFrQixDQUFDO1FBQzNCLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixDQUFDOztJQUdGLE1BQU0sb0JBQW9CO2lCQUVWLGdCQUFXLEdBQVcsQ0FBQyxBQUFaLENBQWE7UUFFdkMsTUFBTSxDQUFxQjtRQUkzQixJQUFJLEVBQUU7WUFDTCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFHRCxJQUFJLFFBQVEsS0FBeUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUk3RCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLEtBQXlCO1lBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFJRCxJQUFJLGlCQUFpQjtZQUNwQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBSSxpQkFBaUIsQ0FBQyxpQkFBdUQ7WUFDNUUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1lBQzVDLElBQUksY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUMvQixJQUFJLElBQUEsaUNBQW9CLEVBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hFLGNBQWMsR0FBRyxpQkFBaUIsRUFBRSxLQUFLLENBQUM7WUFDM0MsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQzlHLENBQUM7UUFNRCxJQUFJLGVBQWU7WUFDbEIsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDL0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVELElBQUksZUFBZSxDQUFDLGVBQWdFO1lBQ25GLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7WUFDeEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUU5RCxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUV6RixJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsa0NBQWtDLENBQUMsR0FBRyxFQUFFO29CQUNqRyxJQUFJLENBQUMsdUNBQXVDLEdBQUcsZUFBZSxFQUFFLHVCQUF1QixDQUFDO29CQUN4RixJQUFJLENBQUMsTUFBTSxDQUFDLGtEQUFrRCxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7Z0JBQzNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUlELElBQUksY0FBYztZQUNqQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksY0FBYyxDQUFDLGNBQWtDO1lBQ3BELElBQUksY0FBYyxLQUFLLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0MsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFLRCxJQUFJLGtCQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBSSxrQkFBa0IsQ0FBQyxrQkFBOEM7WUFDcEUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUzRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7WUFFOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3RyxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFJRCxJQUFJLFlBQVk7WUFDZixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM1RCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUNELElBQUksWUFBWSxDQUFDLFlBQTBEO1lBQzFFLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFNUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFFbEMsTUFBTSxRQUFRLEdBQUcsWUFBWSxLQUFLLFNBQVMsQ0FBQyxDQUFDO2dCQUM1QztvQkFDQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztvQkFDdkcsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTt3QkFDckUsT0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBTSxDQUFDLENBQUMsQ0FBQztvQkFDeEgsQ0FBQyxDQUFDO29CQUNGLFdBQVcsRUFBRSxZQUFZLENBQUMsV0FBVztvQkFDckMsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPO2lCQUM3QixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsUUFBUSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQU1ELElBQUksaUJBQWlCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJLGlCQUFpQixDQUFDLGlCQUErQztZQUNwRSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDO2dCQUNuSCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFekQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1lBRTVDLE1BQU0sUUFBUSxHQUFHLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBTSxDQUFDLENBQWtCLENBQUM7WUFDaEosSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBSUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFPRCxZQUNrQixVQUFpQyxFQUNsRCxpQkFBbUMsRUFDbkMsS0FBeUIsRUFDakIsU0FBMEIsRUFDMUIsR0FBVyxFQUNYLE1BQWMsRUFDZCxRQUFxQjtZQU5aLGVBQVUsR0FBVixVQUFVLENBQXVCO1lBRzFDLGNBQVMsR0FBVCxTQUFTLENBQWlCO1lBQzFCLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFDWCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQXRLdEIsWUFBTyxHQUF3RCxJQUFJLEdBQUcsRUFBa0QsQ0FBQztZQWlCekgsV0FBTSxHQUF1QixTQUFTLENBQUM7WUFldkMsdUJBQWtCLEdBQXlDLFNBQVMsQ0FBQztZQWdCckUsK0JBQTBCLEdBQUcsSUFBSSw2QkFBaUIsRUFBbUIsQ0FBQztZQXdCdEUsb0JBQWUsR0FBdUIsU0FBUyxDQUFDO1lBZWhELDRCQUF1QixHQUFHLElBQUksNkJBQWlCLEVBQW1CLENBQUM7WUFDbkUsd0JBQW1CLEdBQStCLFNBQVMsQ0FBQztZQWU1RCw2QkFBd0IsR0FBRyxJQUFJLDZCQUFpQixFQUFtQixDQUFDO1lBeUJwRSwwQkFBcUIsR0FBRyxJQUFJLDZCQUFpQixFQUFtQixDQUFDO1lBQ2pFLHVCQUFrQixHQUFpQyxTQUFTLENBQUM7WUFtQjdELGNBQVMsR0FBWSxLQUFLLENBQUM7WUFNbEIsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQVcsQ0FBQztZQUN2RCx5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRXpELFdBQU0sR0FBVyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQXVCcEQsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQWtELENBQUM7WUFDbEYsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7WUFiNUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFcEIsTUFBTSxtQkFBbUIsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNwQyxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxtQkFBbUI7Z0JBQ25DLElBQUksRUFBRSxHQUFHLEdBQUcsT0FBTyxJQUFJLENBQUMsTUFBTSxRQUFRO2dCQUN0QyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDbEYsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUN0SCxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBS0QsbUJBQW1CLENBQUMsRUFBVSxFQUFFLEtBQWEsRUFBRSxPQUF3RDtZQUN0RyxNQUFNLGdDQUFnQyxHQUFHLElBQUEsaUNBQW9CLEVBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxJQUFJLE9BQU8sRUFBRSxnQ0FBZ0MsS0FBSyxJQUFJLENBQUM7WUFDM0osTUFBTSxLQUFLLEdBQUcsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM1SixNQUFNLFVBQVUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbEcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFDbkMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBR0QsMkJBQTJCO1lBQzFCLE1BQU0sTUFBTSxHQUEySCxFQUFFLENBQUM7WUFDMUksTUFBTSxPQUFPLEdBQTRCLEVBQUUsQ0FBQztZQUU1QyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzlELFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFckIsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRTtvQkFDM0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3ZDLENBQUMsQ0FBQyxDQUFDO2dCQUVILGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsRUFBRTtvQkFDbkMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDekMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pELENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7Z0JBRTNHLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUVwRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFHRCw4QkFBOEI7WUFDN0IsTUFBTSxPQUFPLEdBQTRCLEVBQUUsQ0FBQztZQUU1QyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMxQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFFcEQsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMzQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN4QyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELGdCQUFnQixDQUFDLE1BQW1CO1lBQ25DLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELGlCQUFpQixDQUFDLFFBQWlCO1lBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVyQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUM7O0lBdkVEO1FBREMsSUFBQSxxQkFBUSxFQUFDLEdBQUcsQ0FBQzsyRUFpQ2I7SUFHRDtRQURDLElBQUEscUJBQVEsRUFBQyxHQUFHLENBQUM7OEVBbUJiO0lBcUJLLElBQU0sVUFBVSxHQUFoQixNQUFNLFVBQVU7O2lCQUVQLGdCQUFXLEdBQVcsQ0FBQyxBQUFaLENBQWE7UUFRdkMsSUFBSSx5QkFBeUIsS0FBa0MsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUk5RyxZQUNDLFdBQXlCLEVBQ2pCLFNBQTBCLEVBQzFCLGlCQUFtQyxFQUM5QixVQUF3QztZQUY3QyxjQUFTLEdBQVQsU0FBUyxDQUFpQjtZQUMxQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1lBQ2IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVo5QyxvQkFBZSxHQUE4QyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztZQUM3RywrQkFBMEIsR0FBbUQsSUFBSSxtQ0FBc0IsRUFBMEIsQ0FBQztZQUV6SCwrQkFBMEIsR0FBRyxJQUFJLGVBQU8sRUFBd0IsQ0FBQztZQVdqRixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXhFLFNBQVMsQ0FBQyx5QkFBeUIsQ0FBQztnQkFDbkMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO3dCQUNsRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt3QkFFeEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzRCQUNwQixPQUFPLEdBQUcsQ0FBQzt3QkFDWixDQUFDO3dCQUVELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBRTlELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDWixPQUFPLEdBQUcsQ0FBQzt3QkFDWixDQUFDO3dCQUVELE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDM0MsQ0FBQzt5QkFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSwwQ0FBa0MsRUFBRSxDQUFDO3dCQUM5RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt3QkFFeEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzRCQUNwQixPQUFPLEdBQUcsQ0FBQzt3QkFDWixDQUFDO3dCQUVELE9BQU8sYUFBYSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDeEQsQ0FBQzt5QkFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO3dCQUN6RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBRTNELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFDcEIsT0FBTyxHQUFHLENBQUM7d0JBQ1osQ0FBQzt3QkFFRCxPQUFPLGFBQWEsQ0FBQztvQkFDdEIsQ0FBQztvQkFFRCxPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELG1CQUFtQixDQUFDLFNBQWdDLEVBQUUsRUFBVSxFQUFFLEtBQWEsRUFBRSxPQUErQjtZQUMvRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBUXhHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFnQiw2QkFBNkIsRUFBRTtnQkFDekUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSzthQUN2QyxDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxZQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDeEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ25JLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVoRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkYsY0FBYyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFMUUsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztRQUVELGFBQWE7UUFDYixlQUFlLENBQUMsU0FBZ0M7WUFDL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVoRixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNqRixNQUFNLGFBQWEsR0FBRyxjQUFjLElBQUksY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEYsT0FBTyxhQUFhLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQztRQUNoRCxDQUFDO1FBRUQsd0JBQXdCLENBQUMsbUJBQTJCLEVBQUUsYUFBNEIsRUFBRSxLQUF3QjtZQUMzRyxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRWxHLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFcEUsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNwSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELE9BQU8sSUFBQSxpQkFBUyxFQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxpQkFBa0IsQ0FBQyx1QkFBd0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQzNGLElBQUksQ0FBdUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELHNCQUFzQixDQUFDLG1CQUEyQixFQUFFLEtBQWE7WUFDaEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUVoRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXBFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxhQUFhLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsdUJBQXVCLENBQUMsbUJBQTJCLEVBQUUsV0FBbUIsRUFBRSxNQUFjLEVBQUUsYUFBc0I7WUFDL0csSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXRHLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFcEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUxRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELGNBQWMsQ0FBQyxtQkFBMkIsRUFBRSxLQUFhLEVBQUUsY0FBc0I7WUFDaEYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV4RSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXBFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPLElBQUEsaUJBQVMsRUFBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsc0NBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2dCQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBcUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQseUJBQXlCLENBQUMsMkJBQStDO1lBQ3hFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFFM0YsSUFBSSwyQkFBMkIsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsNEJBQTRCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZGLENBQUM7WUFFRCxJQUFJLENBQUMsNEJBQTRCLEdBQUcsMkJBQTJCLENBQUM7WUFDaEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLENBQUMsc0NBQXNDLENBQUMsbUJBQTJCLEVBQUUsbUJBQTJCLEVBQUUsbUJBQXVDLEVBQUUsS0FBd0I7WUFDdkssTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsRUFBRSxlQUFlLENBQUM7WUFDdkYsT0FBTyxNQUFNLGVBQWUsRUFBRSxxQ0FBcUMsQ0FBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDbkksQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBMkIsRUFBRSxrQkFBMEIsRUFBRSxPQUFZLEVBQUUsS0FBd0I7WUFDekgsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsRUFBRSxlQUFlLENBQUM7WUFDdkYsTUFBTSxZQUFZLEdBQUcsTUFBTSxlQUFlLEVBQUUsbUJBQW1CLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXBHLE9BQU8sWUFBWSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDO1FBQ2pHLENBQUM7UUFFRCxLQUFLLENBQUMsMEJBQTBCLENBQUMsbUJBQTJCLEVBQUUsYUFBcUIsRUFBRSxtQkFBdUMsRUFBRSxLQUF3QjtZQUNySixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLGVBQWUsQ0FBQztZQUN2RixJQUFJLE9BQU8sZUFBZSxFQUFFLHlCQUF5QixLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUN0RSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFlLENBQUMseUJBQXlCLENBQUMsYUFBYSxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9HLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsV0FBVyxFQUFFLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDL0YsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxtQkFBMkIsRUFBRSxhQUFxQixFQUFFLG1CQUF1QyxFQUFFLEtBQXdCO1lBQ3JKLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsZUFBZSxDQUFDO1lBQ3ZGLE9BQU8sTUFBTSxlQUFlLEVBQUUseUJBQXlCLENBQUMsYUFBYSxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUNqSCxDQUFDOztJQS9NVyxnQ0FBVTt5QkFBVixVQUFVO1FBa0JwQixXQUFBLGlCQUFXLENBQUE7T0FsQkQsVUFBVSxDQWdOdEIifQ==
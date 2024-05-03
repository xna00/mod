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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "./scm", "vs/platform/log/common/log", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/base/common/history", "vs/base/common/map", "vs/base/common/uri", "vs/base/common/iterator", "vs/platform/workspace/common/workspace"], function (require, exports, lifecycle_1, event_1, scm_1, log_1, contextkey_1, storage_1, history_1, map_1, uri_1, iterator_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMService = void 0;
    class SCMInput {
        get value() {
            return this._value;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this._onDidChangePlaceholder.fire(placeholder);
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            this._enabled = enabled;
            this._onDidChangeEnablement.fire(enabled);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            this._visible = visible;
            this._onDidChangeVisibility.fire(visible);
        }
        get actionButton() {
            return this._actionButton;
        }
        set actionButton(actionButton) {
            this._actionButton = actionButton;
            this._onDidChangeActionButton.fire();
        }
        setFocus() {
            this._onDidChangeFocus.fire();
        }
        showValidationMessage(message, type) {
            this._onDidChangeValidationMessage.fire({ message: message, type: type });
        }
        get validateInput() {
            return this._validateInput;
        }
        set validateInput(validateInput) {
            this._validateInput = validateInput;
            this._onDidChangeValidateInput.fire();
        }
        constructor(repository, history) {
            this.repository = repository;
            this.history = history;
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._placeholder = '';
            this._onDidChangePlaceholder = new event_1.Emitter();
            this.onDidChangePlaceholder = this._onDidChangePlaceholder.event;
            this._enabled = true;
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._visible = true;
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActionButton = new event_1.Emitter();
            this.onDidChangeActionButton = this._onDidChangeActionButton.event;
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeValidationMessage = new event_1.Emitter();
            this.onDidChangeValidationMessage = this._onDidChangeValidationMessage.event;
            this._validateInput = () => Promise.resolve(undefined);
            this._onDidChangeValidateInput = new event_1.Emitter();
            this.onDidChangeValidateInput = this._onDidChangeValidateInput.event;
            this.didChangeHistory = false;
            if (this.repository.provider.rootUri) {
                this.historyNavigator = history.getHistory(this.repository.provider.label, this.repository.provider.rootUri);
                this.history.onWillSaveHistory(event => {
                    if (this.historyNavigator.isAtEnd()) {
                        this.saveValue();
                    }
                    if (this.didChangeHistory) {
                        event.historyDidIndeedChange();
                    }
                    this.didChangeHistory = false;
                });
            }
            else { // in memory only
                this.historyNavigator = new history_1.HistoryNavigator2([''], 100);
            }
            this._value = this.historyNavigator.current();
        }
        setValue(value, transient, reason) {
            if (value === this._value) {
                return;
            }
            if (!transient) {
                this.historyNavigator.add(this._value);
                this.historyNavigator.add(value);
                this.didChangeHistory = true;
            }
            this._value = value;
            this._onDidChange.fire({ value, reason });
        }
        showNextHistoryValue() {
            if (this.historyNavigator.isAtEnd()) {
                return;
            }
            else if (!this.historyNavigator.has(this.value)) {
                this.saveValue();
                this.historyNavigator.resetCursor();
            }
            const value = this.historyNavigator.next();
            this.setValue(value, true, scm_1.SCMInputChangeReason.HistoryNext);
        }
        showPreviousHistoryValue() {
            if (this.historyNavigator.isAtEnd()) {
                this.saveValue();
            }
            else if (!this.historyNavigator.has(this._value)) {
                this.saveValue();
                this.historyNavigator.resetCursor();
            }
            const value = this.historyNavigator.previous();
            this.setValue(value, true, scm_1.SCMInputChangeReason.HistoryPrevious);
        }
        saveValue() {
            const oldValue = this.historyNavigator.replaceLast(this._value);
            this.didChangeHistory = this.didChangeHistory || (oldValue !== this._value);
        }
    }
    class SCMRepository {
        get selected() {
            return this._selected;
        }
        constructor(id, provider, disposable, inputHistory) {
            this.id = id;
            this.provider = provider;
            this.disposable = disposable;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.input = new SCMInput(this, inputHistory);
        }
        setSelected(selected) {
            if (this._selected === selected) {
                return;
            }
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this.disposable.dispose();
            this.provider.dispose();
        }
    }
    class WillSaveHistoryEvent {
        constructor() {
            this._didChangeHistory = false;
        }
        get didChangeHistory() { return this._didChangeHistory; }
        historyDidIndeedChange() { this._didChangeHistory = true; }
    }
    let SCMInputHistory = class SCMInputHistory {
        constructor(storageService, workspaceContextService) {
            this.storageService = storageService;
            this.workspaceContextService = workspaceContextService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.histories = new Map();
            this._onWillSaveHistory = this.disposables.add(new event_1.Emitter());
            this.onWillSaveHistory = this._onWillSaveHistory.event;
            this.histories = new Map();
            const entries = this.storageService.getObject('scm.history', 1 /* StorageScope.WORKSPACE */, []);
            for (const [providerLabel, rootUri, history] of entries) {
                let providerHistories = this.histories.get(providerLabel);
                if (!providerHistories) {
                    providerHistories = new map_1.ResourceMap();
                    this.histories.set(providerLabel, providerHistories);
                }
                providerHistories.set(rootUri, new history_1.HistoryNavigator2(history, 100));
            }
            if (this.migrateStorage()) {
                this.saveToStorage();
            }
            this.disposables.add(this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, 'scm.history', this.disposables)(e => {
                if (e.external && e.key === 'scm.history') {
                    const raw = this.storageService.getObject('scm.history', 1 /* StorageScope.WORKSPACE */, []);
                    for (const [providerLabel, uri, rawHistory] of raw) {
                        const history = this.getHistory(providerLabel, uri);
                        for (const value of iterator_1.Iterable.reverse(rawHistory)) {
                            history.prepend(value);
                        }
                    }
                }
            }));
            this.disposables.add(this.storageService.onWillSaveState(_ => {
                const event = new WillSaveHistoryEvent();
                this._onWillSaveHistory.fire(event);
                if (event.didChangeHistory) {
                    this.saveToStorage();
                }
            }));
        }
        saveToStorage() {
            const raw = [];
            for (const [providerLabel, providerHistories] of this.histories) {
                for (const [rootUri, history] of providerHistories) {
                    if (!(history.size === 1 && history.current() === '')) {
                        raw.push([providerLabel, rootUri, [...history]]);
                    }
                }
            }
            this.storageService.store('scm.history', raw, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        getHistory(providerLabel, rootUri) {
            let providerHistories = this.histories.get(providerLabel);
            if (!providerHistories) {
                providerHistories = new map_1.ResourceMap();
                this.histories.set(providerLabel, providerHistories);
            }
            let history = providerHistories.get(rootUri);
            if (!history) {
                history = new history_1.HistoryNavigator2([''], 100);
                providerHistories.set(rootUri, history);
            }
            return history;
        }
        // Migrates from Application scope storage to Workspace scope.
        // TODO@joaomoreno: Change from January 2024 onwards such that the only code is to remove all `scm/input:` storage keys
        migrateStorage() {
            let didSomethingChange = false;
            const machineKeys = iterator_1.Iterable.filter(this.storageService.keys(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */), key => key.startsWith('scm/input:'));
            for (const key of machineKeys) {
                try {
                    const legacyHistory = JSON.parse(this.storageService.get(key, -1 /* StorageScope.APPLICATION */, ''));
                    const match = /^scm\/input:([^:]+):(.+)$/.exec(key);
                    if (!match || !Array.isArray(legacyHistory?.history) || !Number.isInteger(legacyHistory?.timestamp)) {
                        this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                        continue;
                    }
                    const [, providerLabel, rootPath] = match;
                    const rootUri = uri_1.URI.file(rootPath);
                    if (this.workspaceContextService.getWorkspaceFolder(rootUri)) {
                        const history = this.getHistory(providerLabel, rootUri);
                        for (const entry of iterator_1.Iterable.reverse(legacyHistory.history)) {
                            history.prepend(entry);
                        }
                        didSomethingChange = true;
                        this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                    }
                }
                catch {
                    this.storageService.remove(key, -1 /* StorageScope.APPLICATION */);
                }
            }
            return didSomethingChange;
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    SCMInputHistory = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], SCMInputHistory);
    let SCMService = class SCMService {
        get repositories() { return this._repositories.values(); }
        get repositoryCount() { return this._repositories.size; }
        constructor(logService, workspaceContextService, contextKeyService, storageService) {
            this.logService = logService;
            this._repositories = new Map(); // used in tests
            this._onDidAddProvider = new event_1.Emitter();
            this.onDidAddRepository = this._onDidAddProvider.event;
            this._onDidRemoveProvider = new event_1.Emitter();
            this.onDidRemoveRepository = this._onDidRemoveProvider.event;
            this.inputHistory = new SCMInputHistory(storageService, workspaceContextService);
            this.providerCount = contextKeyService.createKey('scm.providerCount', 0);
        }
        registerSCMProvider(provider) {
            this.logService.trace('SCMService#registerSCMProvider');
            if (this._repositories.has(provider.id)) {
                throw new Error(`SCM Provider ${provider.id} already exists.`);
            }
            const disposable = (0, lifecycle_1.toDisposable)(() => {
                this._repositories.delete(provider.id);
                this._onDidRemoveProvider.fire(repository);
                this.providerCount.set(this._repositories.size);
            });
            const repository = new SCMRepository(provider.id, provider, disposable, this.inputHistory);
            this._repositories.set(provider.id, repository);
            this._onDidAddProvider.fire(repository);
            this.providerCount.set(this._repositories.size);
            return repository;
        }
        getRepository(id) {
            return this._repositories.get(id);
        }
    };
    exports.SCMService = SCMService;
    exports.SCMService = SCMService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, storage_1.IStorageService)
    ], SCMService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2NtL2NvbW1vbi9zY21TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWVoRyxNQUFNLFFBQVE7UUFJYixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQU9ELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxXQUFXLENBQUMsV0FBbUI7WUFDbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBT0QsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFnQjtZQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFPRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLE9BQWdCO1lBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQU1ELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFB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
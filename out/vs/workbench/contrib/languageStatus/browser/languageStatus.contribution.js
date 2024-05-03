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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/themables", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/linkedText", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/base/common/htmlContent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/platform/storage/common/storage", "vs/base/common/arrays", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/hover/browser/hover", "vs/css!./media/languageStatus"], function (require, exports, dom, iconLabels_1, lifecycle_1, severity_1, editorBrowser_1, nls_1, platform_1, themables_1, contributions_1, editorService_1, languageStatusService_1, statusbar_1, linkedText_1, link_1, opener_1, htmlContent_1, actionbar_1, actions_1, codicons_1, storage_1, arrays_1, uri_1, actions_2, instantiation_1, actionCommonCategories_1, editorGroupsService_1, serviceCollection_1, hover_1) {
    "use strict";
    var LanguageStatus_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageStatusViewModel {
        constructor(combined, dedicated) {
            this.combined = combined;
            this.dedicated = dedicated;
        }
        isEqual(other) {
            return (0, arrays_1.equals)(this.combined, other.combined) && (0, arrays_1.equals)(this.dedicated, other.dedicated);
        }
    }
    let StoredCounter = class StoredCounter {
        constructor(_storageService, _key) {
            this._storageService = _storageService;
            this._key = _key;
        }
        get value() {
            return this._storageService.getNumber(this._key, 0 /* StorageScope.PROFILE */, 0);
        }
        increment() {
            const n = this.value + 1;
            this._storageService.store(this._key, n, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return n;
        }
    };
    StoredCounter = __decorate([
        __param(0, storage_1.IStorageService)
    ], StoredCounter);
    let LanguageStatusContribution = class LanguageStatusContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, editorGroupService, editorService) {
            super();
            // --- main language status
            const mainInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_1.IEditorService, editorService.createScoped('main', this._store)]));
            this._register(mainInstantiationService.createInstance(LanguageStatus));
            // --- auxiliary language status
            this._register(editorGroupService.onDidCreateAuxiliaryEditorPart(({ instantiationService, disposables }) => {
                disposables.add(instantiationService.createInstance(LanguageStatus));
            }));
        }
    };
    LanguageStatusContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService)
    ], LanguageStatusContribution);
    let LanguageStatus = class LanguageStatus {
        static { LanguageStatus_1 = this; }
        static { this._id = 'status.languageStatus'; }
        static { this._keyDedicatedItems = 'languageStatus.dedicated'; }
        constructor(_languageStatusService, _statusBarService, _editorService, _openerService, _storageService) {
            this._languageStatusService = _languageStatusService;
            this._statusBarService = _statusBarService;
            this._editorService = _editorService;
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._dedicated = new Set();
            this._dedicatedEntries = new Map();
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, LanguageStatus_1._keyDedicatedItems, this._disposables)(this._handleStorageChange, this, this._disposables);
            this._restoreState();
            this._interactionCounter = new StoredCounter(_storageService, 'languageStatus.interactCount');
            _languageStatusService.onDidChange(this._update, this, this._disposables);
            _editorService.onDidActiveEditorChange(this._update, this, this._disposables);
            this._update();
            _statusBarService.onDidChangeEntryVisibility(e => {
                if (!e.visible && this._dedicated.has(e.id)) {
                    this._dedicated.delete(e.id);
                    this._update();
                    this._storeState();
                }
            }, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
            this._combinedEntry?.dispose();
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._renderDisposables.dispose();
        }
        // --- persisting dedicated items
        _handleStorageChange() {
            this._restoreState();
            this._update();
        }
        _restoreState() {
            const raw = this._storageService.get(LanguageStatus_1._keyDedicatedItems, 0 /* StorageScope.PROFILE */, '[]');
            try {
                const ids = JSON.parse(raw);
                this._dedicated = new Set(ids);
            }
            catch {
                this._dedicated.clear();
            }
        }
        _storeState() {
            if (this._dedicated.size === 0) {
                this._storageService.remove(LanguageStatus_1._keyDedicatedItems, 0 /* StorageScope.PROFILE */);
            }
            else {
                const raw = JSON.stringify(Array.from(this._dedicated.keys()));
                this._storageService.store(LanguageStatus_1._keyDedicatedItems, raw, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
        }
        // --- language status model and UI
        _createViewModel(editor) {
            if (!editor?.hasModel()) {
                return new LanguageStatusViewModel([], []);
            }
            const all = this._languageStatusService.getLanguageStatus(editor.getModel());
            const combined = [];
            const dedicated = [];
            for (const item of all) {
                if (this._dedicated.has(item.id)) {
                    dedicated.push(item);
                }
                combined.push(item);
            }
            return new LanguageStatusViewModel(combined, dedicated);
        }
        _update() {
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            const model = this._createViewModel(editor);
            if (this._model?.isEqual(model)) {
                return;
            }
            this._renderDisposables.clear();
            this._model = model;
            // update when editor language changes
            editor?.onDidChangeModelLanguage(this._update, this, this._renderDisposables);
            // combined status bar item is a single item which hover shows
            // each status item
            if (model.combined.length === 0) {
                // nothing
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const [first] = model.combined;
                const showSeverity = first.severity >= severity_1.default.Warning;
                const text = LanguageStatus_1._severityToComboCodicon(first.severity);
                let isOneBusy = false;
                const ariaLabels = [];
                const element = document.createElement('div');
                for (const status of model.combined) {
                    const isPinned = model.dedicated.includes(status);
                    element.appendChild(this._renderStatus(status, showSeverity, isPinned, this._renderDisposables));
                    ariaLabels.push(LanguageStatus_1._accessibilityInformation(status).label);
                    isOneBusy = isOneBusy || (!isPinned && status.busy); // unpinned items contribute to the busy-indicator of the composite status item
                }
                const props = {
                    name: (0, nls_1.localize)('langStatus.name', "Editor Language Status"),
                    ariaLabel: (0, nls_1.localize)('langStatus.aria', "Editor Language Status: {0}", ariaLabels.join(', next: ')),
                    tooltip: element,
                    command: statusbar_1.ShowTooltipCommand,
                    text: isOneBusy ? `${text}\u00A0\u00A0$(sync~spin)` : text,
                };
                if (!this._combinedEntry) {
                    this._combinedEntry = this._statusBarService.addEntry(props, LanguageStatus_1._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 0 /* StatusbarAlignment.LEFT */, compact: true });
                }
                else {
                    this._combinedEntry.update(props);
                }
                // animate the status bar icon whenever language status changes, repeat animation
                // when severity is warning or error, don't show animation when showing progress/busy
                const userHasInteractedWithStatus = this._interactionCounter.value >= 3;
                const targetWindow = dom.getWindow(editor?.getContainerDomNode());
                const node = targetWindow.document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus A>SPAN.codicon');
                const container = targetWindow.document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus');
                if (node instanceof HTMLElement && container) {
                    const _wiggle = 'wiggle';
                    const _flash = 'flash';
                    if (!isOneBusy) {
                        // wiggle icon when severe or "new"
                        node.classList.toggle(_wiggle, showSeverity || !userHasInteractedWithStatus);
                        this._renderDisposables.add(dom.addDisposableListener(node, 'animationend', _e => node.classList.remove(_wiggle)));
                        // flash background when severe
                        container.classList.toggle(_flash, showSeverity);
                        this._renderDisposables.add(dom.addDisposableListener(container, 'animationend', _e => container.classList.remove(_flash)));
                    }
                    else {
                        node.classList.remove(_wiggle);
                        container.classList.remove(_flash);
                    }
                }
                // track when the hover shows (this is automagic and DOM mutation spying is needed...)
                //  use that as signal that the user has interacted/learned language status items work
                if (!userHasInteractedWithStatus) {
                    const hoverTarget = targetWindow.document.querySelector('.monaco-workbench .context-view');
                    if (hoverTarget instanceof HTMLElement) {
                        const observer = new MutationObserver(() => {
                            if (targetWindow.document.contains(element)) {
                                this._interactionCounter.increment();
                                observer.disconnect();
                            }
                        });
                        observer.observe(hoverTarget, { childList: true, subtree: true });
                        this._renderDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
                    }
                }
            }
            // dedicated status bar items are shows as-is in the status bar
            const newDedicatedEntries = new Map();
            for (const status of model.dedicated) {
                const props = LanguageStatus_1._asStatusbarEntry(status);
                let entry = this._dedicatedEntries.get(status.id);
                if (!entry) {
                    entry = this._statusBarService.addEntry(props, status.id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */ });
                }
                else {
                    entry.update(props);
                    this._dedicatedEntries.delete(status.id);
                }
                newDedicatedEntries.set(status.id, entry);
            }
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._dedicatedEntries = newDedicatedEntries;
        }
        _renderStatus(status, showSeverity, isPinned, store) {
            const parent = document.createElement('div');
            parent.classList.add('hover-language-status');
            const severity = document.createElement('div');
            severity.classList.add('severity', `sev${status.severity}`);
            severity.classList.toggle('show', showSeverity);
            const severityText = LanguageStatus_1._severityToSingleCodicon(status.severity);
            dom.append(severity, ...(0, iconLabels_1.renderLabelWithIcons)(severityText));
            parent.appendChild(severity);
            const element = document.createElement('div');
            element.classList.add('element');
            parent.appendChild(element);
            const left = document.createElement('div');
            left.classList.add('left');
            element.appendChild(left);
            const label = document.createElement('span');
            label.classList.add('label');
            const labelValue = typeof status.label === 'string' ? status.label : status.label.value;
            dom.append(label, ...(0, iconLabels_1.renderLabelWithIcons)(status.busy ? `$(sync~spin)\u00A0\u00A0${labelValue}` : labelValue));
            left.appendChild(label);
            const detail = document.createElement('span');
            detail.classList.add('detail');
            this._renderTextPlus(detail, status.detail, store);
            left.appendChild(detail);
            const right = document.createElement('div');
            right.classList.add('right');
            element.appendChild(right);
            // -- command (if available)
            const { command } = status;
            if (command) {
                store.add(new link_1.Link(right, {
                    label: command.title,
                    title: command.tooltip,
                    href: uri_1.URI.from({
                        scheme: 'command', path: command.id, query: command.arguments && JSON.stringify(command.arguments)
                    }).toString()
                }, { hoverDelegate: hover_1.nativeHoverDelegate }, this._openerService));
            }
            // -- pin
            const actionBar = new actionbar_1.ActionBar(right, { hoverDelegate: hover_1.nativeHoverDelegate });
            store.add(actionBar);
            let action;
            if (!isPinned) {
                action = new actions_1.Action('pin', (0, nls_1.localize)('pin', "Add to Status Bar"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pin), true, () => {
                    this._dedicated.add(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, true);
                    this._update();
                    this._storeState();
                });
            }
            else {
                action = new actions_1.Action('unpin', (0, nls_1.localize)('unpin', "Remove from Status Bar"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned), true, () => {
                    this._dedicated.delete(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, false);
                    this._update();
                    this._storeState();
                });
            }
            actionBar.push(action, { icon: true, label: false });
            store.add(action);
            return parent;
        }
        static _severityToComboCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(bracket-error)';
                case severity_1.default.Warning: return '$(bracket-dot)';
                default: return '$(bracket)';
            }
        }
        static _severityToSingleCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(error)';
                case severity_1.default.Warning: return '$(info)';
                default: return '$(check)';
            }
        }
        _renderTextPlus(target, text, store) {
            for (const node of (0, linkedText_1.parseLinkedText)(text).nodes) {
                if (typeof node === 'string') {
                    const parts = (0, iconLabels_1.renderLabelWithIcons)(node);
                    dom.append(target, ...parts);
                }
                else {
                    store.add(new link_1.Link(target, node, undefined, this._openerService));
                }
            }
        }
        static _accessibilityInformation(status) {
            if (status.accessibilityInfo) {
                return status.accessibilityInfo;
            }
            const textValue = typeof status.label === 'string' ? status.label : status.label.value;
            if (status.detail) {
                return { label: (0, nls_1.localize)('aria.1', '{0}, {1}', textValue, status.detail) };
            }
            else {
                return { label: (0, nls_1.localize)('aria.2', '{0}', textValue) };
            }
        }
        // ---
        static _asStatusbarEntry(item) {
            let kind;
            if (item.severity === severity_1.default.Warning) {
                kind = 'warning';
            }
            else if (item.severity === severity_1.default.Error) {
                kind = 'error';
            }
            const textValue = typeof item.label === 'string' ? item.label : item.label.shortValue;
            return {
                name: (0, nls_1.localize)('name.pattern', '{0} (Language Status)', item.name),
                text: item.busy ? `${textValue}\u00A0\u00A0$(sync~spin)` : textValue,
                ariaLabel: LanguageStatus_1._accessibilityInformation(item).label,
                role: item.accessibilityInfo?.role,
                tooltip: item.command?.tooltip || new htmlContent_1.MarkdownString(item.detail, { isTrusted: true, supportThemeIcons: true }),
                kind,
                command: item.command
            };
        }
    };
    LanguageStatus = LanguageStatus_1 = __decorate([
        __param(0, languageStatusService_1.ILanguageStatusService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, editorService_1.IEditorService),
        __param(3, opener_1.IOpenerService),
        __param(4, storage_1.IStorageService)
    ], LanguageStatus);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LanguageStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.inlayHints.Reset',
                title: (0, nls_1.localize2)('reset', "Reset Language Status Interaction Counter"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove('languageStatus.interactCount', 0 /* StorageScope.PROFILE */);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTdGF0dXMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sYW5ndWFnZVN0YXR1cy9icm93c2VyL2xhbmd1YWdlU3RhdHVzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQ2hHLE1BQU0sdUJBQXVCO1FBRTVCLFlBQ1UsUUFBb0MsRUFDcEMsU0FBcUM7WUFEckMsYUFBUSxHQUFSLFFBQVEsQ0FBNEI7WUFDcEMsY0FBUyxHQUFULFNBQVMsQ0FBNEI7UUFDM0MsQ0FBQztRQUVMLE9BQU8sQ0FBQyxLQUE4QjtZQUNyQyxPQUFPLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7S0FDRDtJQUVELElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7UUFFbEIsWUFBOEMsZUFBZ0MsRUFBbUIsSUFBWTtZQUEvRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFBbUIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFJLENBQUM7UUFFbEgsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQ0FBd0IsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELFNBQVM7WUFDUixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsOERBQThD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
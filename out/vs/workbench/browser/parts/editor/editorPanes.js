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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/browser/parts/editor/editor", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/editor/common/editor", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/platform/log/common/log", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, event_1, severity_1, lifecycle_1, editor_1, dom_1, platform_1, layoutService_1, instantiation_1, progress_1, editor_2, types_1, workspaceTrust_1, editorPlaceholder_1, editor_3, errors_1, errorMessage_1, log_1, dialogs_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPanes = void 0;
    let EditorPanes = class EditorPanes extends lifecycle_1.Disposable {
        //#endregion
        get minimumWidth() { return this._activeEditorPane?.minimumWidth ?? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get minimumHeight() { return this._activeEditorPane?.minimumHeight ?? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumWidth() { return this._activeEditorPane?.maximumWidth ?? editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get maximumHeight() { return this._activeEditorPane?.maximumHeight ?? editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get activeEditorPane() { return this._activeEditorPane; }
        constructor(editorGroupParent, editorPanesParent, groupView, layoutService, instantiationService, editorProgressService, workspaceTrustService, logService, dialogService, hostService) {
            super();
            this.editorGroupParent = editorGroupParent;
            this.editorPanesParent = editorPanesParent;
            this.groupView = groupView;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.editorProgressService = editorProgressService;
            this.workspaceTrustService = workspaceTrustService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.hostService = hostService;
            //#region Events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidChangeSizeConstraints = this._register(new event_1.Emitter());
            this.onDidChangeSizeConstraints = this._onDidChangeSizeConstraints.event;
            this._activeEditorPane = null;
            this.editorPanes = [];
            this.activeEditorPaneDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorOperation = this._register(new progress_1.LongRunningOperation(this.editorProgressService));
            this.editorPanesRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.workspaceTrustService.onDidChangeTrust(() => this.onDidChangeWorkspaceTrust()));
        }
        onDidChangeWorkspaceTrust() {
            // If the active editor pane requires workspace trust
            // we need to re-open it anytime trust changes to
            // account for it.
            // For that we explicitly call into the group-view
            // to handle errors properly.
            const editor = this._activeEditorPane?.input;
            const options = this._activeEditorPane?.options;
            if (editor?.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                this.groupView.openEditor(editor, options);
            }
        }
        async openEditor(editor, options, internalOptions, context = Object.create(null)) {
            try {
                return await this.doOpenEditor(this.getEditorPaneDescriptor(editor), editor, options, internalOptions, context);
            }
            catch (error) {
                // First check if caller instructed us to ignore error handling
                if (options?.ignoreError) {
                    return { error };
                }
                // In case of an error when opening an editor, we still want to show
                // an editor in the desired location to preserve the user intent and
                // view state (e.g. when restoring).
                //
                // For that reason we have place holder editors that can convey a
                // message with actions the user can click on.
                return this.doShowError(error, editor, options, internalOptions, context);
            }
        }
        async doShowError(error, editor, options, internalOptions, context) {
            // Always log the error to figure out what is going on
            this.logService.error(error);
            // Show as modal dialog when explicit user action unless disabled
            let errorHandled = false;
            if (options?.source === editor_3.EditorOpenSource.USER && (!(0, editor_1.isEditorOpenError)(error) || error.allowDialog)) {
                errorHandled = await this.doShowErrorDialog(error, editor);
            }
            // Return early if the user dealt with the error already
            if (errorHandled) {
                return { error };
            }
            // Show as editor placeholder: pass over the error to display
            const editorPlaceholderOptions = { ...options };
            if (!(0, errors_1.isCancellationError)(error)) {
                editorPlaceholderOptions.error = error;
            }
            return {
                ...(await this.doOpenEditor(editorPlaceholder_1.ErrorPlaceholderEditor.DESCRIPTOR, editor, editorPlaceholderOptions, internalOptions, context)),
                error
            };
        }
        async doShowErrorDialog(error, editor) {
            let severity = severity_1.default.Error;
            let message = undefined;
            let detail = (0, errorMessage_1.toErrorMessage)(error);
            let errorActions = undefined;
            if ((0, editor_1.isEditorOpenError)(error)) {
                errorActions = error.actions;
                severity = error.forceSeverity ?? severity_1.default.Error;
                if (error.forceMessage) {
                    message = error.message;
                    detail = undefined;
                }
            }
            if (!message) {
                message = (0, nls_1.localize)('editorOpenErrorDialog', "Unable to open '{0}'", editor.getName());
            }
            const buttons = [];
            if (errorActions && errorActions.length > 0) {
                for (const errorAction of errorActions) {
                    buttons.push({
                        label: errorAction.label,
                        run: () => errorAction
                    });
                }
            }
            else {
                buttons.push({
                    label: (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                    run: () => undefined
                });
            }
            let cancelButton = undefined;
            if (buttons.length === 1) {
                cancelButton = {
                    run: () => {
                        errorHandled = true; // treat cancel as handled and do not show placeholder
                        return undefined;
                    }
                };
            }
            let errorHandled = false; // by default, show placeholder
            const { result } = await this.dialogService.prompt({
                type: severity,
                message,
                detail,
                buttons,
                cancelButton
            });
            if (result) {
                const errorActionResult = result.run();
                if (errorActionResult instanceof Promise) {
                    errorActionResult.catch(error => this.dialogService.error((0, errorMessage_1.toErrorMessage)(error)));
                }
                errorHandled = true; // treat custom error action as handled and do not show placeholder
            }
            return errorHandled;
        }
        async doOpenEditor(descriptor, editor, options, internalOptions, context = Object.create(null)) {
            // Editor pane
            const pane = this.doShowEditorPane(descriptor);
            // Remember current active element for deciding to restore focus later
            const activeElement = (0, dom_1.getActiveElement)();
            // Apply input to pane
            const { changed, cancelled } = await this.doSetInput(pane, editor, options, context);
            // Make sure to pass focus to the pane or otherwise
            // make sure that the pane window is visible unless
            // this has been explicitly disabled.
            if (!cancelled) {
                const focus = !options || !options.preserveFocus;
                if (focus && this.shouldRestoreFocus(activeElement)) {
                    pane.focus();
                }
                else if (!internalOptions?.preserveWindowOrder) {
                    this.hostService.moveTop((0, dom_1.getWindowById)(this.groupView.windowId, true).window);
                }
            }
            return { pane, changed, cancelled };
        }
        shouldRestoreFocus(expectedActiveElement) {
            if (!this.layoutService.isRestored()) {
                return true; // restore focus if we are not restored yet on startup
            }
            if (!expectedActiveElement) {
                return true; // restore focus if nothing was focused
            }
            const activeElement = (0, dom_1.getActiveElement)();
            if (!activeElement || activeElement === expectedActiveElement.ownerDocument.body) {
                return true; // restore focus if nothing is focused currently
            }
            const same = expectedActiveElement === activeElement;
            if (same) {
                return true; // restore focus if same element is still active
            }
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                // This is to avoid regressions from not restoring focus as we used to:
                // Only allow a different input element (or textarea) to remain focused
                // but not other elements that do not accept text input.
                return true;
            }
            if ((0, dom_1.isAncestor)(activeElement, this.editorGroupParent)) {
                return true; // restore focus if active element is still inside our editor group
            }
            return false; // do not restore focus
        }
        getEditorPaneDescriptor(editor) {
            if (editor.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */) && !this.workspaceTrustService.isWorkspaceTrusted()) {
                // Workspace trust: if an editor signals it needs workspace trust
                // but the current workspace is untrusted, we fallback to a generic
                // editor descriptor to indicate this an do NOT load the registered
                // editor.
                return editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.DESCRIPTOR;
            }
            return (0, types_1.assertIsDefined)(this.editorPanesRegistry.getEditorPane(editor));
        }
        doShowEditorPane(descriptor) {
            // Return early if the currently active editor pane can handle the input
            if (this._activeEditorPane && descriptor.describes(this._activeEditorPane)) {
                return this._activeEditorPane;
            }
            // Hide active one first
            this.doHideActiveEditorPane();
            // Create editor pane
            const editorPane = this.doCreateEditorPane(descriptor);
            // Set editor as active
            this.doSetActiveEditorPane(editorPane);
            // Show editor
            const container = (0, types_1.assertIsDefined)(editorPane.getContainer());
            this.editorPanesParent.appendChild(container);
            (0, dom_1.show)(container);
            // Indicate to editor that it is now visible
            editorPane.setVisible(true);
            // Layout
            if (this.pagePosition) {
                editorPane.layout(new dom_1.Dimension(this.pagePosition.width, this.pagePosition.height), { top: this.pagePosition.top, left: this.pagePosition.left });
            }
            // Boundary sashes
            if (this.boundarySashes) {
                editorPane.setBoundarySashes(this.boundarySashes);
            }
            return editorPane;
        }
        doCreateEditorPane(descriptor) {
            // Instantiate editor
            const editorPane = this.doInstantiateEditorPane(descriptor);
            // Create editor container as needed
            if (!editorPane.getContainer()) {
                const editorPaneContainer = document.createElement('div');
                editorPaneContainer.classList.add('editor-instance');
                // It is cruicial to append the container to its parent before
                // passing on to the create() method of the pane so that the
                // right `window` can be determined in floating window cases.
                this.editorPanesParent.appendChild(editorPaneContainer);
                editorPane.create(editorPaneContainer);
            }
            return editorPane;
        }
        doInstantiateEditorPane(descriptor) {
            // Return early if already instantiated
            const existingEditorPane = this.editorPanes.find(editorPane => descriptor.describes(editorPane));
            if (existingEditorPane) {
                return existingEditorPane;
            }
            // Otherwise instantiate new
            const editorPane = this._register(descriptor.instantiate(this.instantiationService, this.groupView));
            this.editorPanes.push(editorPane);
            return editorPane;
        }
        doSetActiveEditorPane(editorPane) {
            this._activeEditorPane = editorPane;
            // Clear out previous active editor pane listeners
            this.activeEditorPaneDisposables.clear();
            // Listen to editor pane changes
            if (editorPane) {
                this.activeEditorPaneDisposables.add(editorPane.onDidChangeSizeConstraints(e => this._onDidChangeSizeConstraints.fire(e)));
                this.activeEditorPaneDisposables.add(editorPane.onDidFocus(() => this._onDidFocus.fire()));
            }
            // Indicate that size constraints could have changed due to new editor
            this._onDidChangeSizeConstraints.fire(undefined);
        }
        async doSetInput(editorPane, editor, options, context) {
            // If the input did not change, return early and only
            // apply the options unless the options instruct us to
            // force open it even if it is the same
            const inputMatches = editorPane.input?.matches(editor);
            if (inputMatches && !options?.forceReload) {
                editorPane.setOptions(options);
                return { changed: false, cancelled: false };
            }
            // Start a new editor input operation to report progress
            // and to support cancellation. Any new operation that is
            // started will cancel the previous one.
            const operation = this.editorOperation.start(this.layoutService.isRestored() ? 800 : 3200);
            let cancelled = false;
            try {
                // Clear the current input before setting new input
                // This ensures that a slow loading input will not
                // be visible for the duration of the new input to
                // load (https://github.com/microsoft/vscode/issues/34697)
                editorPane.clearInput();
                // Set the input to the editor pane
                await editorPane.setInput(editor, options, context, operation.token);
                if (!operation.isCurrent()) {
                    cancelled = true;
                }
            }
            catch (error) {
                if (!operation.isCurrent()) {
                    cancelled = true;
                }
                else {
                    throw error;
                }
            }
            finally {
                operation.stop();
            }
            return { changed: !inputMatches, cancelled };
        }
        doHideActiveEditorPane() {
            if (!this._activeEditorPane) {
                return;
            }
            // Stop any running operation
            this.editorOperation.stop();
            // Indicate to editor pane before removing the editor from
            // the DOM to give a chance to persist certain state that
            // might depend on still being the active DOM element.
            this.safeRun(() => this._activeEditorPane?.clearInput());
            this.safeRun(() => this._activeEditorPane?.setVisible(false));
            // Remove editor pane from parent
            const editorPaneContainer = this._activeEditorPane.getContainer();
            if (editorPaneContainer) {
                this.editorPanesParent.removeChild(editorPaneContainer);
                (0, dom_1.hide)(editorPaneContainer);
            }
            // Clear active editor pane
            this.doSetActiveEditorPane(null);
        }
        closeEditor(editor) {
            if (this._activeEditorPane?.input && editor.matches(this._activeEditorPane.input)) {
                this.doHideActiveEditorPane();
            }
        }
        setVisible(visible) {
            this.safeRun(() => this._activeEditorPane?.setVisible(visible));
        }
        layout(pagePosition) {
            this.pagePosition = pagePosition;
            this.safeRun(() => this._activeEditorPane?.layout(new dom_1.Dimension(pagePosition.width, pagePosition.height), pagePosition));
        }
        setBoundarySashes(sashes) {
            this.boundarySashes = sashes;
            this.safeRun(() => this._activeEditorPane?.setBoundarySashes(sashes));
        }
        safeRun(fn) {
            // We delegate many calls to the active editor pane which
            // can be any kind of editor. We must ensure that our calls
            // do not throw, for example in `layout()` because that can
            // mess with the grid layout.
            try {
                fn();
            }
            catch (error) {
                this.logService.error(error);
            }
        }
    };
    exports.EditorPanes = EditorPanes;
    exports.EditorPanes = EditorPanes = __decorate([
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, progress_1.IEditorProgressService),
        __param(6, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(7, log_1.ILogService),
        __param(8, dialogs_1.IDialogService),
        __param(9, host_1.IHostService)
    ], EditorPanes);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JQYW5lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4RHpGLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxzQkFBVTtRQVUxQyxZQUFZO1FBRVosSUFBSSxZQUFZLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxJQUFJLHNDQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDMUcsSUFBSSxhQUFhLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxJQUFJLHNDQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0csSUFBSSxZQUFZLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxJQUFJLHNDQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDMUcsSUFBSSxhQUFhLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxJQUFJLHNDQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFHN0csSUFBSSxnQkFBZ0IsS0FBZ0MsT0FBTyxJQUFJLENBQUMsaUJBQThDLENBQUMsQ0FBQyxDQUFDO1FBVWpILFlBQ2tCLGlCQUE4QixFQUM5QixpQkFBOEIsRUFDOUIsU0FBMkIsRUFDbkIsYUFBdUQsRUFDekQsb0JBQTRELEVBQzNELHFCQUE4RCxFQUNwRCxxQkFBd0UsRUFDN0YsVUFBd0MsRUFDckMsYUFBOEMsRUFDaEQsV0FBMEM7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFYUyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWE7WUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFhO1lBQzlCLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQ0Ysa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQ3hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDMUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQWtDO1lBQzVFLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBcEN6RCxnQkFBZ0I7WUFFQyxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzFELGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUVyQyxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpRCxDQUFDLENBQUM7WUFDMUcsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQVNyRSxzQkFBaUIsR0FBc0IsSUFBSSxDQUFDO1lBR25DLGdCQUFXLEdBQWlCLEVBQUUsQ0FBQztZQUUvQixnQ0FBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFHcEUsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksK0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUN2Rix3QkFBbUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFnQnBHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFTyx5QkFBeUI7WUFFaEMscURBQXFEO1lBQ3JELGlEQUFpRDtZQUNqRCxrQkFBa0I7WUFDbEIsa0RBQWtEO1lBQ2xELDZCQUE2QjtZQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDO1lBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUM7WUFDaEQsSUFBSSxNQUFNLEVBQUUsYUFBYSxnREFBdUMsRUFBRSxDQUFDO2dCQUNsRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQW1CLEVBQUUsT0FBbUMsRUFBRSxlQUF1RCxFQUFFLFVBQThCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3BMLElBQUksQ0FBQztnQkFDSixPQUFPLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakgsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBRWhCLCtEQUErRDtnQkFDL0QsSUFBSSxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUM7b0JBQzFCLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxvRUFBb0U7Z0JBQ3BFLG9FQUFvRTtnQkFDcEUsb0NBQW9DO2dCQUNwQyxFQUFFO2dCQUNGLGlFQUFpRTtnQkFDakUsOENBQThDO2dCQUU5QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFZLEVBQUUsTUFBbUIsRUFBRSxPQUFtQyxFQUFFLGVBQXVELEVBQUUsT0FBNEI7WUFFdEwsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTdCLGlFQUFpRTtZQUNqRSxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxPQUFPLEVBQUUsTUFBTSxLQUFLLHlCQUFnQixDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBQSwwQkFBaUIsRUFBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDbkcsWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBRUQsd0RBQXdEO1lBQ3hELElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUNsQixDQUFDO1lBRUQsNkRBQTZEO1lBQzdELE1BQU0sd0JBQXdCLEdBQW1DLEVBQUUsR0FBRyxPQUFPLEVBQUUsQ0FBQztZQUNoRixJQUFJLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqQyx3QkFBd0IsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxPQUFPO2dCQUNOLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsMENBQXNCLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSx3QkFBd0IsRUFBRSxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzNILEtBQUs7YUFDTCxDQUFDO1FBQ0gsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsTUFBbUI7WUFDaEUsSUFBSSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxLQUFLLENBQUM7WUFDOUIsSUFBSSxPQUFPLEdBQXVCLFNBQVMsQ0FBQztZQUM1QyxJQUFJLE1BQU0sR0FBdUIsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELElBQUksWUFBWSxHQUFtQyxTQUFTLENBQUM7WUFFN0QsSUFBSSxJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUM3QixRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsSUFBSSxrQkFBUSxDQUFDLEtBQUssQ0FBQztnQkFDakQsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO29CQUN4QixNQUFNLEdBQUcsU0FBUyxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDdkYsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUF5QyxFQUFFLENBQUM7WUFDekQsSUFBSSxZQUFZLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxDQUFDLElBQUksQ0FBQzt3QkFDWixLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUs7d0JBQ3hCLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXO3FCQUN0QixDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNaLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztvQkFDMUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVM7aUJBQ3BCLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLFlBQVksR0FBK0MsU0FBUyxDQUFDO1lBQ3pFLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsWUFBWSxHQUFHO29CQUNkLEdBQUcsRUFBRSxHQUFHLEVBQUU7d0JBQ1QsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLHNEQUFzRDt3QkFFM0UsT0FBTyxTQUFTLENBQUM7b0JBQ2xCLENBQUM7aUJBQ0QsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBRSwrQkFBK0I7WUFFMUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7Z0JBQ2xELElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU87Z0JBQ1AsTUFBTTtnQkFDTixPQUFPO2dCQUNQLFlBQVk7YUFDWixDQUFDLENBQUM7WUFFSCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLGlCQUFpQixZQUFZLE9BQU8sRUFBRSxDQUFDO29CQUMxQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO2dCQUVELFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxtRUFBbUU7WUFDekYsQ0FBQztZQUVELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWSxDQUFDLFVBQWlDLEVBQUUsTUFBbUIsRUFBRSxPQUFtQyxFQUFFLGVBQXVELEVBQUUsVUFBOEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFFak8sY0FBYztZQUNkLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUvQyxzRUFBc0U7WUFDdEUsTUFBTSxhQUFhLEdBQUcsSUFBQSxzQkFBZ0IsR0FBRSxDQUFDO1lBRXpDLHNCQUFzQjtZQUN0QixNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVyRixtREFBbUQ7WUFDbkQsbURBQW1EO1lBQ25ELHFDQUFxQztZQUNyQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztnQkFDakQsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQ3JELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZCxDQUFDO3FCQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBQSxtQkFBYSxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvRSxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDO1FBQ3JDLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxxQkFBcUM7WUFDL0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxzREFBc0Q7WUFDcEUsQ0FBQztZQUVELElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM1QixPQUFPLElBQUksQ0FBQyxDQUFDLHVDQUF1QztZQUNyRCxDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBQSxzQkFBZ0IsR0FBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxhQUFhLElBQUksYUFBYSxLQUFLLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEYsT0FBTyxJQUFJLENBQUMsQ0FBQyxnREFBZ0Q7WUFDOUQsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLHFCQUFxQixLQUFLLGFBQWEsQ0FBQztZQUNyRCxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLE9BQU8sSUFBSSxDQUFDLENBQUMsZ0RBQWdEO1lBQzlELENBQUM7WUFFRCxJQUFJLGFBQWEsQ0FBQyxPQUFPLEtBQUssT0FBTyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBRS9FLHVFQUF1RTtnQkFDdkUsdUVBQXVFO2dCQUN2RSx3REFBd0Q7Z0JBRXhELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBQSxnQkFBVSxFQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxPQUFPLElBQUksQ0FBQyxDQUFDLG1FQUFtRTtZQUNqRixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsQ0FBQyx1QkFBdUI7UUFDdEMsQ0FBQztRQUVPLHVCQUF1QixDQUFDLE1BQW1CO1lBQ2xELElBQUksTUFBTSxDQUFDLGFBQWEsZ0RBQXVDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUNySCxpRUFBaUU7Z0JBQ2pFLG1FQUFtRTtnQkFDbkUsbUVBQW1FO2dCQUNuRSxVQUFVO2dCQUNWLE9BQU8sMkRBQXVDLENBQUMsVUFBVSxDQUFDO1lBQzNELENBQUM7WUFFRCxPQUFPLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFVBQWlDO1lBRXpELHdFQUF3RTtZQUN4RSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7Z0JBQzVFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQy9CLENBQUM7WUFFRCx3QkFBd0I7WUFDeEIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFFOUIscUJBQXFCO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV2RCx1QkFBdUI7WUFDdkIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXZDLGNBQWM7WUFDZCxNQUFNLFNBQVMsR0FBRyxJQUFBLHVCQUFlLEVBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QyxJQUFBLFVBQUksRUFBQyxTQUFTLENBQUMsQ0FBQztZQUVoQiw0Q0FBNEM7WUFDNUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU1QixTQUFTO1lBQ1QsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxlQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25KLENBQUM7WUFFRCxrQkFBa0I7WUFDbEIsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3pCLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxVQUFpQztZQUUzRCxxQkFBcUI7WUFDckIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTVELG9DQUFvQztZQUNwQyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUQsbUJBQW1CLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUVyRCw4REFBOEQ7Z0JBQzlELDREQUE0RDtnQkFDNUQsNkRBQTZEO2dCQUM3RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBRXhELFVBQVUsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVPLHVCQUF1QixDQUFDLFVBQWlDO1lBRWhFLHVDQUF1QztZQUN2QyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxrQkFBa0IsQ0FBQztZQUMzQixDQUFDO1lBRUQsNEJBQTRCO1lBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFbEMsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztRQUVPLHFCQUFxQixDQUFDLFVBQTZCO1lBQzFELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7WUFFcEMsa0RBQWtEO1lBQ2xELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUV6QyxnQ0FBZ0M7WUFDaEMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0gsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCxzRUFBc0U7WUFDdEUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFzQixFQUFFLE1BQW1CLEVBQUUsT0FBbUMsRUFBRSxPQUEyQjtZQUVySSxxREFBcUQ7WUFDckQsc0RBQXNEO1lBQ3RELHVDQUF1QztZQUN2QyxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2RCxJQUFJLFlBQVksSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQztnQkFDM0MsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFL0IsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQzdDLENBQUM7WUFFRCx3REFBd0Q7WUFDeEQseURBQXlEO1lBQ3pELHdDQUF3QztZQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTNGLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUM7Z0JBRUosbURBQW1EO2dCQUNuRCxrREFBa0Q7Z0JBQ2xELGtEQUFrRDtnQkFDbEQsMERBQTBEO2dCQUMxRCxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRXhCLG1DQUFtQztnQkFDbkMsTUFBTSxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFckUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO29CQUM1QixTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztvQkFDNUIsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDbEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sS0FBSyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxDQUFDO1FBQzlDLENBQUM7UUFFTyxzQkFBc0I7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELDZCQUE2QjtZQUM3QixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRTVCLDBEQUEwRDtZQUMxRCx5REFBeUQ7WUFDekQsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFOUQsaUNBQWlDO1lBQ2pDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xFLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN4RCxJQUFBLFVBQUksRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCwyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxXQUFXLENBQUMsTUFBbUI7WUFDOUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25GLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRUQsVUFBVSxDQUFDLE9BQWdCO1lBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxNQUFNLENBQUMsWUFBa0M7WUFDeEMsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7WUFFakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLElBQUksZUFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDMUgsQ0FBQztRQUVELGlCQUFpQixDQUFDLE1BQXVCO1lBQ3hDLElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDO1lBRTdCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVPLE9BQU8sQ0FBQyxFQUFjO1lBRTdCLHlEQUF5RDtZQUN6RCwyREFBMkQ7WUFDM0QsMkRBQTJEO1lBQzNELDZCQUE2QjtZQUU3QixJQUFJLENBQUM7Z0JBQ0osRUFBRSxFQUFFLENBQUM7WUFDTixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBOWJZLGtDQUFXOzBCQUFYLFdBQVc7UUFnQ3JCLFdBQUEsdUNBQXVCLENBQUE7UUFDdkIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlDQUFzQixDQUFBO1FBQ3RCLFdBQUEsaURBQWdDLENBQUE7UUFDaEMsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQkFBWSxDQUFBO09BdENGLFdBQVcsQ0E4YnZCIn0=
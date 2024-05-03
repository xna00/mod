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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/contrib/find/browser/findModel", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindReplaceWidget", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, DOM, aria_1, lazy_1, lifecycle_1, strings, findModel_1, findState_1, findWidget_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, findModel_2, notebookFindReplaceWidget_1, notebookBrowser_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindContrib = void 0;
    const FIND_HIDE_TRANSITION = 'find-hide-transition';
    const FIND_SHOW_TRANSITION = 'find-show-transition';
    let MAX_MATCHES_COUNT_WIDTH = 69;
    const PROGRESS_BAR_DELAY = 200; // show progress for at least 200ms
    let NotebookFindContrib = class NotebookFindContrib extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.find'; }
        constructor(notebookEditor, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.widget = new lazy_1.Lazy(() => this._register(this.instantiationService.createInstance(NotebookFindWidget, this.notebookEditor)));
        }
        show(initialInput, options) {
            return this.widget.value.show(initialInput, options);
        }
        hide() {
            this.widget.rawValue?.hide();
        }
        replace(searchString) {
            return this.widget.value.replace(searchString);
        }
    };
    exports.NotebookFindContrib = NotebookFindContrib;
    exports.NotebookFindContrib = NotebookFindContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], NotebookFindContrib);
    let NotebookFindWidget = class NotebookFindWidget extends notebookFindReplaceWidget_1.SimpleFindReplaceWidget {
        constructor(_notebookEditor, contextViewService, contextKeyService, configurationService, contextMenuService, menuService, instantiationService) {
            super(contextViewService, contextKeyService, configurationService, contextMenuService, instantiationService, new findState_1.FindReplaceState(), _notebookEditor);
            this._showTimeout = null;
            this._hideTimeout = null;
            this._findModel = new findModel_2.FindModel(this._notebookEditor, this._state, this._configurationService);
            DOM.append(this._notebookEditor.getDomNode(), this.getDomNode());
            this._findWidgetFocused = notebookContextKeys_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(this._findInput.onKeyDown((e) => this._onFindInputKeyDown(e)));
            this._register(this._replaceInput.onKeyDown((e) => this._onReplaceInputKeyDown(e)));
            this._register(this._state.onFindReplaceStateChange((e) => {
                this.onInputChanged();
                if (e.isSearching) {
                    if (this._state.isSearching) {
                        this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
                    }
                    else {
                        this._progressBar.stop().hide();
                    }
                }
                if (this._findModel.currentMatch >= 0) {
                    const currentMatch = this._findModel.getCurrentMatch();
                    this._replaceBtn.setEnabled(currentMatch.isModelMatch);
                }
                const matches = this._findModel.findMatches;
                this._replaceAllBtn.setEnabled(matches.length > 0 && matches.find(match => match.webviewMatches.length > 0) === undefined);
                if (e.filters) {
                    this._findInput.updateFilterState(this._state.filters?.isModified() ?? false);
                }
            }));
            this._register(DOM.addDisposableListener(this.getDomNode(), DOM.EventType.FOCUS, e => {
                this._previousFocusElement = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : undefined;
            }, true));
        }
        _onFindInputKeyDown(e) {
            if (e.equals(3 /* KeyCode.Enter */)) {
                this.find(false);
                e.preventDefault();
                return;
            }
            else if (e.equals(1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */)) {
                this.find(true);
                e.preventDefault();
                return;
            }
        }
        _onReplaceInputKeyDown(e) {
            if (e.equals(3 /* KeyCode.Enter */)) {
                this.replaceOne();
                e.preventDefault();
                return;
            }
        }
        onInputChanged() {
            this._state.change({ searchString: this.inputValue }, false);
            // this._findModel.research();
            const findMatches = this._findModel.findMatches;
            if (findMatches && findMatches.length) {
                return true;
            }
            return false;
        }
        findIndex(index) {
            this._findModel.find({ index });
        }
        find(previous) {
            this._findModel.find({ previous });
        }
        replaceOne() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            if (!this._findModel.findMatches.length) {
                return;
            }
            this._findModel.ensureFindMatches();
            if (this._findModel.currentMatch < 0) {
                this._findModel.find({ previous: false });
            }
            const currentMatch = this._findModel.getCurrentMatch();
            const cell = currentMatch.cell;
            if (currentMatch.isModelMatch) {
                const match = currentMatch.match;
                this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
                const replacePattern = this.replacePattern;
                const replaceString = replacePattern.buildReplaceString(match.matches, this._state.preserveCase);
                const viewModel = this._notebookEditor.getViewModel();
                viewModel.replaceOne(cell, match.range, replaceString).then(() => {
                    this._progressBar.stop();
                });
            }
            else {
                // this should not work
                console.error('Replace does not work for output match');
            }
        }
        replaceAll() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
            const replacePattern = this.replacePattern;
            const cellFindMatches = this._findModel.findMatches;
            const replaceStrings = [];
            cellFindMatches.forEach(cellFindMatch => {
                cellFindMatch.contentMatches.forEach(match => {
                    const matches = match.matches;
                    replaceStrings.push(replacePattern.buildReplaceString(matches, this._state.preserveCase));
                });
            });
            const viewModel = this._notebookEditor.getViewModel();
            viewModel.replaceAll(this._findModel.findMatches, replaceStrings).then(() => {
                this._progressBar.stop();
            });
        }
        findFirst() { }
        onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        onFocusTrackerBlur() {
            this._previousFocusElement = undefined;
            this._findWidgetFocused.reset();
        }
        onReplaceInputFocusTrackerFocus() {
            // throw new Error('Method not implemented.');
        }
        onReplaceInputFocusTrackerBlur() {
            // throw new Error('Method not implemented.');
        }
        onFindInputFocusTrackerFocus() { }
        onFindInputFocusTrackerBlur() { }
        async show(initialInput, options) {
            const searchStringUpdate = this._state.searchString !== initialInput;
            super.show(initialInput, options);
            this._state.change({ searchString: initialInput ?? this._state.searchString, isRevealed: true }, false);
            if (typeof options?.matchIndex === 'number') {
                if (!this._findModel.findMatches.length) {
                    await this._findModel.research();
                }
                this.findIndex(options.matchIndex);
            }
            else {
                this._findInput.select();
            }
            if (!searchStringUpdate && options?.searchStringSeededFrom) {
                this._findModel.refreshCurrentMatch(options.searchStringSeededFrom);
            }
            if (this._showTimeout === null) {
                if (this._hideTimeout !== null) {
                    DOM.getWindow(this.getDomNode()).clearTimeout(this._hideTimeout);
                    this._hideTimeout = null;
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_SHOW_TRANSITION);
                this._showTimeout = DOM.getWindow(this.getDomNode()).setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                    this._showTimeout = null;
                }, 200);
            }
            else {
                // no op
            }
        }
        replace(initialFindInput, initialReplaceInput) {
            super.showWithReplace(initialFindInput, initialReplaceInput);
            this._state.change({ searchString: initialFindInput ?? '', replaceString: initialReplaceInput ?? '', isRevealed: true }, false);
            this._replaceInput.select();
            if (this._showTimeout === null) {
                if (this._hideTimeout !== null) {
                    DOM.getWindow(this.getDomNode()).clearTimeout(this._hideTimeout);
                    this._hideTimeout = null;
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_SHOW_TRANSITION);
                this._showTimeout = DOM.getWindow(this.getDomNode()).setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                    this._showTimeout = null;
                }, 200);
            }
            else {
                // no op
            }
        }
        hide() {
            super.hide();
            this._state.change({ isRevealed: false }, false);
            this._findModel.clear();
            this._notebookEditor.findStop();
            this._progressBar.stop();
            if (this._hideTimeout === null) {
                if (this._showTimeout !== null) {
                    DOM.getWindow(this.getDomNode()).clearTimeout(this._showTimeout);
                    this._showTimeout = null;
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_HIDE_TRANSITION);
                this._hideTimeout = DOM.getWindow(this.getDomNode()).setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }, 200);
            }
            else {
                // no op
            }
            if (this._previousFocusElement && this._previousFocusElement.offsetParent) {
                this._previousFocusElement.focus();
                this._previousFocusElement = undefined;
            }
            if (this._notebookEditor.hasModel()) {
                for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                    const cell = this._notebookEditor.cellAt(i);
                    if (cell.getEditState() === notebookBrowser_1.CellEditState.Editing && cell.editStateSource === 'find') {
                        cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'closeFind');
                    }
                }
            }
        }
        _updateMatchesCount() {
            if (!this._findModel || !this._findModel.findMatches) {
                return;
            }
            this._matchesCount.style.width = MAX_MATCHES_COUNT_WIDTH + 'px';
            this._matchesCount.title = '';
            // remove previous content
            if (this._matchesCount.firstChild) {
                this._matchesCount.removeChild(this._matchesCount.firstChild);
            }
            let label;
            if (this._state.matchesCount > 0) {
                let matchesCount = String(this._state.matchesCount);
                if (this._state.matchesCount >= findModel_1.MATCHES_LIMIT) {
                    matchesCount += '+';
                }
                const matchesPosition = this._findModel.currentMatch < 0 ? '?' : String((this._findModel.currentMatch + 1));
                label = strings.format(findWidget_1.NLS_MATCHES_LOCATION, matchesPosition, matchesCount);
            }
            else {
                label = findWidget_1.NLS_NO_RESULTS;
            }
            this._matchesCount.appendChild(document.createTextNode(label));
            (0, aria_1.alert)(this._getAriaLabel(label, this._state.currentMatch, this._state.searchString));
            MAX_MATCHES_COUNT_WIDTH = Math.max(MAX_MATCHES_COUNT_WIDTH, this._matchesCount.clientWidth);
        }
        _getAriaLabel(label, currentMatch, searchString) {
            if (label === findWidget_1.NLS_NO_RESULTS) {
                return searchString === ''
                    ? (0, nls_1.localize)('ariaSearchNoResultEmpty', "{0} found", label)
                    : (0, nls_1.localize)('ariaSearchNoResult', "{0} found for '{1}'", label, searchString);
            }
            // TODO@rebornix, aria for `cell ${index}, line {line}`
            return (0, nls_1.localize)('ariaSearchNoResultWithLineNumNoCurrentMatch', "{0} found for '{1}'", label, searchString);
        }
        dispose() {
            this._notebookEditor?.removeClassName(FIND_SHOW_TRANSITION);
            this._notebookEditor?.removeClassName(FIND_HIDE_TRANSITION);
            this._findModel.dispose();
            super.dispose();
        }
    };
    NotebookFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, actions_1.IMenuService),
        __param(6, instantiation_1.IInstantiationService)
    ], NotebookFindWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tGaW5kV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZmluZC9ub3RlYm9va0ZpbmRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxNQUFNLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDO0lBQ3BELE1BQU0sb0JBQW9CLEdBQUcsc0JBQXNCLENBQUM7SUFDcEQsSUFBSSx1QkFBdUIsR0FBRyxFQUFFLENBQUM7SUFDakMsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxtQ0FBbUM7SUFXNUQsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtpQkFFbEMsT0FBRSxHQUFXLHlCQUF5QixBQUFwQyxDQUFxQztRQUl2RCxZQUNrQixjQUErQixFQUNSLG9CQUEyQztZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUhTLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNSLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFJbkYsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqSSxDQUFDO1FBRUQsSUFBSSxDQUFDLFlBQXFCLEVBQUUsT0FBd0M7WUFDbkUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxD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
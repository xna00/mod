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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/iterator", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/base/common/themables", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, dom, actionbar_1, actionViewItems_1, dropdownActionViewItem_1, actions_1, async_1, event_1, iterator_1, nls_1, contextView_1, instantiation_1, themables_1, suggestEnabledInput_1, icons_1, storedValue_1, testExplorerFilterState_1, testService_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingExplorerFilter = void 0;
    const testFilterDescriptions = {
        ["@failed" /* TestFilterTerm.Failed */]: (0, nls_1.localize)('testing.filters.showOnlyFailed', "Show Only Failed Tests"),
        ["@executed" /* TestFilterTerm.Executed */]: (0, nls_1.localize)('testing.filters.showOnlyExecuted', "Show Only Executed Tests"),
        ["@doc" /* TestFilterTerm.CurrentDoc */]: (0, nls_1.localize)('testing.filters.currentFile', "Show in Active File Only"),
        ["@hidden" /* TestFilterTerm.Hidden */]: (0, nls_1.localize)('testing.filters.showExcludedTests', "Show Hidden Tests"),
    };
    let TestingExplorerFilter = class TestingExplorerFilter extends actionViewItems_1.BaseActionViewItem {
        constructor(action, options, state, instantiationService, testService) {
            super(null, action, options);
            this.state = state;
            this.instantiationService = instantiationService;
            this.testService = testService;
            this.focusEmitter = this._register(new event_1.Emitter());
            this.onDidFocus = this.focusEmitter.event;
            this.history = this._register(this.instantiationService.createInstance(storedValue_1.StoredValue, {
                key: 'testing.filterHistory2',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */
            }));
            this.filtersAction = new actions_1.Action('markersFiltersAction', (0, nls_1.localize)('testing.filters.menu', "More Filters..."), 'testing-filter-button ' + themables_1.ThemeIcon.asClassName(icons_1.testingFilterIcon));
            this.updateFilterActiveState();
            this._register(testService.excluded.onTestExclusionsChanged(this.updateFilterActiveState, this));
        }
        /**
         * @override
         */
        render(container) {
            container.classList.add('testing-filter-action-item');
            const updateDelayer = this._register(new async_1.Delayer(400));
            const wrapper = this.wrapper = dom.$('.testing-filter-wrapper');
            container.appendChild(wrapper);
            let history = this.history.get({ lastValue: '', values: [] });
            if (history instanceof Array) {
                history = { lastValue: '', values: history };
            }
            if (history.lastValue) {
                this.state.setText(history.lastValue);
            }
            const input = this.input = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.ContextScopedSuggestEnabledInputWithHistory, {
                id: 'testing.explorer.filter',
                ariaLabel: (0, nls_1.localize)('testExplorerFilterLabel', "Filter text for tests in the explorer"),
                parent: wrapper,
                suggestionProvider: {
                    triggerCharacters: ['@'],
                    provideResults: () => [
                        ...Object.entries(testFilterDescriptions).map(([label, detail]) => ({ label, detail })),
                        ...iterator_1.Iterable.map(this.testService.collection.tags.values(), tag => {
                            const { ctrlId, tagId } = (0, testTypes_1.denamespaceTestTag)(tag.id);
                            const insertText = `@${ctrlId}:${tagId}`;
                            return ({
                                label: `@${ctrlId}:${tagId}`,
                                detail: this.testService.collection.getNodeById(ctrlId)?.item.label,
                                insertText: tagId.includes(' ') ? `@${ctrlId}:"${tagId.replace(/(["\\])/g, '\\$1')}"` : insertText,
                            });
                        }),
                    ].filter(r => !this.state.text.value.includes(r.label)),
                },
                resourceHandle: 'testing:filter',
                suggestOptions: {
                    value: this.state.text.value,
                    placeholderText: (0, nls_1.localize)('testExplorerFilter', "Filter (e.g. text, !exclude, @tag)"),
                },
                history: history.values
            }));
            this._register(this.state.text.onDidChange(newValue => {
                if (input.getValue() !== newValue) {
                    input.setValue(newValue);
                }
            }));
            this._register(this.state.onDidRequestInputFocus(() => {
                input.focus();
            }));
            this._register(input.onDidFocus(() => {
                this.focusEmitter.fire();
            }));
            this._register(input.onInputDidChange(() => updateDelayer.trigger(() => {
                input.addToHistory();
                this.state.setText(input.getValue());
            })));
            const actionbar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === this.filtersAction.id) {
                        return this.instantiationService.createInstance(FiltersDropdownMenuActionViewItem, action, options, this.state, this.actionRunner);
                    }
                    return undefined;
                },
            }));
            actionbar.push(this.filtersAction, { icon: true, label: false });
            this.layout(this.wrapper.clientWidth);
        }
        layout(width) {
            this.input.layout(new dom.Dimension(width - /* horizontal padding */ 24 - /* editor padding */ 8 - /* filter button padding */ 22, 20));
        }
        /**
         * Focuses the filter input.
         */
        focus() {
            this.input.focus();
        }
        /**
         * Persists changes to the input history.
         */
        saveState() {
            this.history.store({ lastValue: this.input.getValue(), values: this.input.getHistory() });
        }
        /**
         * @override
         */
        dispose() {
            this.saveState();
            super.dispose();
        }
        /**
         * Updates the 'checked' state of the filter submenu.
         */
        updateFilterActiveState() {
            this.filtersAction.checked = this.testService.excluded.hasAny;
        }
    };
    exports.TestingExplorerFilter = TestingExplorerFilter;
    exports.TestingExplorerFilter = TestingExplorerFilter = __decorate([
        __param(2, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, testService_1.ITestService)
    ], TestingExplorerFilter);
    let FiltersDropdownMenuActionViewItem = class FiltersDropdownMenuActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, options, filters, actionRunner, contextMenuService, testService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                menuAsChild: true
            });
            this.filters = filters;
            this.testService = testService;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
        getActions() {
            return [
                ...["@failed" /* TestFilterTerm.Failed */, "@executed" /* TestFilterTerm.Executed */, "@doc" /* TestFilterTerm.CurrentDoc */].map(term => ({
                    checked: this.filters.isFilteringFor(term),
                    class: undefined,
                    enabled: true,
                    id: term,
                    label: testFilterDescriptions[term],
                    run: () => this.filters.toggleFilteringFor(term),
                    tooltip: '',
                    dispose: () => null
                })),
                new actions_1.Separator(),
                {
                    checked: this.filters.fuzzy.value,
                    class: undefined,
                    enabled: true,
                    id: 'fuzzy',
                    label: (0, nls_1.localize)('testing.filters.fuzzyMatch', "Fuzzy Match"),
                    run: () => this.filters.fuzzy.value = !this.filters.fuzzy.value,
                    tooltip: ''
                },
                new actions_1.Separator(),
                {
                    checked: this.filters.isFilteringFor("@hidden" /* TestFilterTerm.Hidden */),
                    class: undefined,
                    enabled: this.testService.excluded.hasAny,
                    id: 'showExcluded',
                    label: (0, nls_1.localize)('testing.filters.showExcludedTests', "Show Hidden Tests"),
                    run: () => this.filters.toggleFilteringFor("@hidden" /* TestFilterTerm.Hidden */),
                    tooltip: ''
                },
                {
                    class: undefined,
                    enabled: this.testService.excluded.hasAny,
                    id: 'removeExcluded',
                    label: (0, nls_1.localize)('testing.filters.removeTestExclusions', "Unhide All Tests"),
                    run: async () => this.testService.excluded.clear(),
                    tooltip: ''
                }
            ];
        }
        updateChecked() {
            this.element.classList.toggle('checked', this._action.checked);
        }
    };
    FiltersDropdownMenuActionViewItem = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, testService_1.ITestService)
    ], FiltersDropdownMenuActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0V4cGxvcmVyRmlsdGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZ0V4cGxvcmVyRmlsdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBTSxzQkFBc0IsR0FBc0M7UUFDakUsdUNBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsd0JBQXdCLENBQUM7UUFDN0YsMkNBQXlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0NBQWtDLEVBQUUsMEJBQTBCLENBQUM7UUFDbkcsd0NBQTJCLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsMEJBQTBCLENBQUM7UUFDaEcsdUNBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUNBQW1DLEVBQUUsbUJBQW1CLENBQUM7S0FDM0YsQ0FBQztJQUVLLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsb0NBQWtCO1FBYTVELFlBQ0MsTUFBZSxFQUNmLE9BQW1DLEVBQ1QsS0FBZ0QsRUFDbkQsb0JBQTRELEVBQ3JFLFdBQTBDO1lBRXhELEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBSmMsVUFBSyxHQUFMLEtBQUssQ0FBMEI7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNwRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQWZ4QyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3BELGVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUNwQyxZQUFPLEdBQW9FLElBQUksQ0FBQyxTQUFTLENBQUMs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
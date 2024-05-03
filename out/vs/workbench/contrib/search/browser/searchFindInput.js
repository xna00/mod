/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindReplaceWidget", "vs/nls", "vs/base/common/codicons", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/toggle/toggle", "vs/base/common/event"], function (require, exports, contextScopedHistoryWidget_1, notebookFindReplaceWidget_1, nls, codicons_1, hoverDelegateFactory_1, toggle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchFindInput = void 0;
    const NLS_AI_TOGGLE_LABEL = nls.localize('aiDescription', "Use AI");
    class SearchFindInput extends contextScopedHistoryWidget_1.ContextScopedFindInput {
        constructor(container, contextViewProvider, options, contextKeyService, contextMenuService, instantiationService, filters, _shouldShowAIButton, // caller responsible for updating this when it changes,
        filterStartVisiblitity) {
            super(container, contextViewProvider, options, contextKeyService);
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.filters = filters;
            this._shouldShowAIButton = _shouldShowAIButton;
            this._filterChecked = false;
            this._visible = false;
            this._onDidChangeAIToggle = this._register(new event_1.Emitter());
            this.onDidChangeAIToggle = this._onDidChangeAIToggle.event;
            this._findFilter = this._register(new notebookFindReplaceWidget_1.NotebookFindInputFilterButton(filters, contextMenuService, instantiationService, options, nls.localize('searchFindInputNotebookFilter.label', "Notebook Find Filters")));
            this._aiButton = this._register(new AIToggle({
                appendTitle: '',
                isChecked: false,
                ...options.toggleStyles
            }));
            this.setAdditionalToggles([this._aiButton]);
            this.inputBox.paddingRight = (this.caseSensitive?.width() ?? 0) + (this.wholeWords?.width() ?? 0) + (this.regex?.width() ?? 0) + this._findFilter.width;
            this.controls.appendChild(this._findFilter.container);
            this._findFilter.container.classList.add('monaco-custom-toggle');
            this.filterVisible = filterStartVisiblitity;
            this._register(this._aiButton.onChange(() => {
                if (this._aiButton.checked) {
                    this.regex?.disable();
                    this.wholeWords?.disable();
                    this.caseSensitive?.disable();
                    this._findFilter.disable();
                }
                else {
                    this.regex?.enable();
                    this.wholeWords?.enable();
                    this.caseSensitive?.enable();
                    this._findFilter.enable();
                }
            }));
            // ensure that ai button is visible if it should be
            this._aiButton.domNode.style.display = _shouldShowAIButton ? '' : 'none';
        }
        set shouldShowAIButton(visible) {
            if (this._shouldShowAIButton !== visible) {
                this._shouldShowAIButton = visible;
                this._aiButton.domNode.style.display = visible ? '' : 'none';
            }
        }
        set filterVisible(visible) {
            this._findFilter.container.style.display = visible ? '' : 'none';
            this._visible = visible;
            this.updateStyles();
        }
        setEnabled(enabled) {
            super.setEnabled(enabled);
            if (enabled && (!this._filterChecked || !this._visible)) {
                this.regex?.enable();
            }
            else {
                this.regex?.disable();
            }
        }
        updateStyles() {
            // filter is checked if it's in a non-default state
            this._filterChecked =
                !this.filters.markupInput ||
                    !this.filters.markupPreview ||
                    !this.filters.codeInput ||
                    !this.filters.codeOutput;
            // TODO: find a way to express that searching notebook output and markdown preview don't support regex.
            this._findFilter.applyStyles(this._filterChecked);
        }
        get isAIEnabled() {
            return this._aiButton.checked;
        }
    }
    exports.SearchFindInput = SearchFindInput;
    class AIToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.sparkle,
                title: NLS_AI_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRmluZElucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zZWFyY2hGaW5kSW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRXBFLE1BQWEsZUFBZ0IsU0FBUSxtREFBc0I7UUFRMUQsWUFDQyxTQUE2QixFQUM3QixtQkFBeUMsRUFDekMsT0FBMEIsRUFDMUIsaUJBQXFDLEVBQzVCLGtCQUF1QyxFQUN2QyxvQkFBMkMsRUFDM0MsT0FBNEIsRUFDN0IsbUJBQTRCLEVBQUUsd0RBQXdEO1FBQzlGLHNCQUErQjtZQUUvQixLQUFLLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBTnpELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyxZQUFPLEdBQVAsT0FBTyxDQUFxQjtZQUM3Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQVM7WUFiN0IsbUJBQWMsR0FBWSxLQUFLLENBQUM7WUFDaEMsYUFBUSxHQUFZLEtBQUssQ0FBQztZQUNqQix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFXLENBQUMsQ0FBQztZQUMvRCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBY3JFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FDaEMsSUFBSSx5REFBNkIsQ0FDaEMsT0FBTyxFQUNQLGtCQUFrQixFQUNsQixvQkFBb0Is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
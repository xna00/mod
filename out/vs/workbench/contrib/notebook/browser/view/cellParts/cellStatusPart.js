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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/iconLabels", "vs/base/common/lifecycle", "vs/editor/common/editorCommon", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/platform/hover/browser/hover", "vs/platform/configuration/common/configuration"], function (require, exports, DOM, keyboardEvent_1, simpleIconLabel_1, errorMessage_1, event_1, iconLabels_1, lifecycle_1, editorCommon_1, commands_1, instantiation_1, notification_1, telemetry_1, themeService_1, notebookBrowser_1, cellPart_1, codeCellViewModel_1, updatableHoverWidget_1, hover_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellEditorStatusBar = void 0;
    const $ = DOM.$;
    let CellEditorStatusBar = class CellEditorStatusBar extends cellPart_1.CellContentPart {
        constructor(_notebookEditor, _cellContainer, editorPart, _editor, _instantiationService, hoverService, configurationService, _themeService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._cellContainer = _cellContainer;
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this.leftItems = [];
            this.rightItems = [];
            this.width = 0;
            this._onDidClick = this._register(new event_1.Emitter());
            this.onDidClick = this._onDidClick.event;
            this.statusBarContainer = DOM.append(editorPart, $('.cell-statusbar-container'));
            this.statusBarContainer.tabIndex = -1;
            const leftItemsContainer = DOM.append(this.statusBarContainer, $('.cell-status-left'));
            const rightItemsContainer = DOM.append(this.statusBarContainer, $('.cell-status-right'));
            this.leftItemsContainer = DOM.append(leftItemsContainer, $('.cell-contributed-items.cell-contributed-items-left'));
            this.rightItemsContainer = DOM.append(rightItemsContainer, $('.cell-contributed-items.cell-contributed-items-right'));
            this.itemsDisposable = this._register(new lifecycle_1.DisposableStore());
            this.hoverDelegate = new class {
                constructor() {
                    this._lastHoverHideTime = 0;
                    this.showHover = (options) => {
                        options.position = options.position ?? {};
                        options.position.hoverPosition = 3 /* HoverPosition.ABOVE */;
                        return hoverService.showHover(options);
                    };
                    this.placement = 'element';
                }
                get delay() {
                    return Date.now() - this._lastHoverHideTime < 200
                        ? 0 // show instantly when a hover was recently shown
                        : configurationService.getValue('workbench.hover.delay');
                }
                onDidHideHover() {
                    this._lastHoverHideTime = Date.now();
                }
            };
            this._register(this._themeService.onDidColorThemeChange(() => this.currentContext && this.updateContext(this.currentContext)));
            this._register(DOM.addDisposableListener(this.statusBarContainer, DOM.EventType.CLICK, e => {
                if (e.target === leftItemsContainer || e.target === rightItemsContainer || e.target === this.statusBarContainer) {
                    // hit on empty space
                    this._onDidClick.fire({
                        type: 0 /* ClickTargetType.Container */,
                        event: e
                    });
                }
                else {
                    if (e.target.classList.contains('cell-status-item-has-command')) {
                        this._onDidClick.fire({
                            type: 2 /* ClickTargetType.ContributedCommandItem */,
                            event: e
                        });
                    }
                    else {
                        // text
                        this._onDidClick.fire({
                            type: 1 /* ClickTargetType.ContributedTextItem */,
                            event: e
                        });
                    }
                }
            }));
        }
        didRenderCell(element) {
            this.updateContext({
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                $mid: 13 /* MarshalledId.NotebookCellActionContext */
            });
            if (this._editor) {
                // Focus Mode
                const updateFocusModeForEditorEvent = () => {
                    if (this._editor && (this._editor.hasWidgetFocus() || (this.statusBarContainer.ownerDocument.activeElement && this.statusBarContainer.contains(this.statusBarContainer.ownerDocument.activeElement)))) {
                        element.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                    }
                    else {
                        const currentMode = element.focusMode;
                        if (currentMode === notebookBrowser_1.CellFocusMode.ChatInput) {
                            element.focusMode = notebookBrowser_1.CellFocusMode.ChatInput;
                        }
                        else if (currentMode === notebookBrowser_1.CellFocusMode.Output && this._notebookEditor.hasWebviewFocus()) {
                            element.focusMode = notebookBrowser_1.CellFocusMode.Output;
                        }
                        else {
                            element.focusMode = notebookBrowser_1.CellFocusMode.Container;
                        }
                    }
                };
                this.cellDisposables.add(this._editor.onDidFocusEditorWidget(() => {
                    updateFocusModeForEditorEvent();
                }));
                this.cellDisposables.add(this._editor.onDidBlurEditorWidget(() => {
                    // this is for a special case:
                    // users click the status bar empty space, which we will then focus the editor
                    // so we don't want to update the focus state too eagerly, it will be updated with onDidFocusEditorWidget
                    if (this._notebookEditor.hasEditorFocus() &&
                        !(this.statusBarContainer.ownerDocument.activeElement && this.statusBarContainer.contains(this.statusBarContainer.ownerDocument.activeElement))) {
                        updateFocusModeForEditorEvent();
                    }
                }));
                // Mouse click handlers
                this.cellDisposables.add(this.onDidClick(e => {
                    if (this.currentCell instanceof codeCellViewModel_1.CodeCellViewModel && e.type !== 2 /* ClickTargetType.ContributedCommandItem */ && this._editor) {
                        const target = this._editor.getTargetAtClientPoint(e.event.clientX, e.event.clientY - this._notebookEditor.notebookOptions.computeEditorStatusbarHeight(this.currentCell.internalMetadata, this.currentCell.uri));
                        if (target?.position) {
                            this._editor.setPosition(target.position);
                            this._editor.focus();
                        }
                    }
                }));
            }
        }
        updateInternalLayoutNow(element) {
            // todo@rebornix layer breaker
            this._cellContainer.classList.toggle('cell-statusbar-hidden', this._notebookEditor.notebookOptions.computeEditorStatusbarHeight(element.internalMetadata, element.uri) === 0);
            const layoutInfo = element.layoutInfo;
            const width = layoutInfo.editorWidth;
            if (!width) {
                return;
            }
            this.width = width;
            this.statusBarContainer.style.width = `${width}px`;
            const maxItemWidth = this.getMaxItemWidth();
            this.leftItems.forEach(item => item.maxWidth = maxItemWidth);
            this.rightItems.forEach(item => item.maxWidth = maxItemWidth);
        }
        getMaxItemWidth() {
            return this.width / 2;
        }
        updateContext(context) {
            this.currentContext = context;
            this.itemsDisposable.clear();
            if (!this.currentContext) {
                return;
            }
            this.itemsDisposable.add(this.currentContext.cell.onDidChangeLayout(() => {
                if (this.currentContext) {
                    this.updateInternalLayoutNow(this.currentContext.cell);
                }
            }));
            this.itemsDisposable.add(this.currentContext.cell.onDidChangeCellStatusBarItems(() => this.updateRenderedItems()));
            this.itemsDisposable.add(this.currentContext.notebookEditor.onDidChangeActiveCell(() => this.updateActiveCell()));
            this.updateInternalLayoutNow(this.currentContext.cell);
            this.updateActiveCell();
            this.updateRenderedItems();
        }
        updateActiveCell() {
            const isActiveCell = this.currentContext.notebookEditor.getActiveCell() === this.currentContext?.cell;
            this.statusBarContainer.classList.toggle('is-active-cell', isActiveCell);
        }
        updateRenderedItems() {
            const items = this.currentContext.cell.getCellStatusBarItems();
            items.sort((itemA, itemB) => {
                return (itemB.priority ?? 0) - (itemA.priority ?? 0);
            });
            const maxItemWidth = this.getMaxItemWidth();
            const newLeftItems = items.filter(item => item.alignment === 1 /* CellStatusbarAlignment.Left */);
            const newRightItems = items.filter(item => item.alignment === 2 /* CellStatusbarAlignment.Right */).reverse();
            const updateItems = (renderedItems, newItems, container) => {
                if (renderedItems.length > newItems.length) {
                    const deleted = renderedItems.splice(newItems.length, renderedItems.length - newItems.length);
                    for (const deletedItem of deleted) {
                        container.removeChild(deletedItem.container);
                        deletedItem.dispose();
                    }
                }
                newItems.forEach((newLeftItem, i) => {
                    const existingItem = renderedItems[i];
                    if (existingItem) {
                        existingItem.updateItem(newLeftItem, maxItemWidth);
                    }
                    else {
                        const item = this._instantiationService.createInstance(CellStatusBarItem, this.currentContext, this.hoverDelegate, this._editor, newLeftItem, maxItemWidth);
                        renderedItems.push(item);
                        container.appendChild(item.container);
                    }
                });
            };
            updateItems(this.leftItems, newLeftItems, this.leftItemsContainer);
            updateItems(this.rightItems, newRightItems, this.rightItemsContainer);
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this.leftItems);
            (0, lifecycle_1.dispose)(this.rightItems);
        }
    };
    exports.CellEditorStatusBar = CellEditorStatusBar;
    exports.CellEditorStatusBar = CellEditorStatusBar = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, hover_1.IHoverService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, themeService_1.IThemeService)
    ], CellEditorStatusBar);
    let CellStatusBarItem = class CellStatusBarItem extends lifecycle_1.Disposable {
        set maxWidth(v) {
            this.container.style.maxWidth = v + 'px';
        }
        constructor(_context, _hoverDelegate, _editor, itemModel, maxWidth, _telemetryService, _commandService, _notificationService, _themeService) {
            super();
            this._context = _context;
            this._hoverDelegate = _hoverDelegate;
            this._editor = _editor;
            this._telemetryService = _telemetryService;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._themeService = _themeService;
            this.container = $('.cell-status-item');
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this.updateItem(itemModel, maxWidth);
        }
        updateItem(item, maxWidth) {
            this._itemDisposables.clear();
            if (!this._currentItem || this._currentItem.text !== item.text) {
                this._itemDisposables.add(new simpleIconLabel_1.SimpleIconLabel(this.container)).text = item.text.replace(/\n/g, ' ');
            }
            const resolveColor = (color) => {
                return (0, editorCommon_1.isThemeColor)(color) ?
                    (this._themeService.getColorTheme().getColor(color.id)?.toString() || '') :
                    color;
            };
            this.container.style.color = item.color ? resolveColor(item.color) : '';
            this.container.style.backgroundColor = item.backgroundColor ? resolveColor(item.backgroundColor) : '';
            this.container.style.opacity = item.opacity ? item.opacity : '';
            this.container.classList.toggle('cell-status-item-show-when-active', !!item.onlyShowWhenActive);
            if (typeof maxWidth === 'number') {
                this.maxWidth = maxWidth;
            }
            let ariaLabel;
            let role;
            if (item.accessibilityInformation) {
                ariaLabel = item.accessibilityInformation.label;
                role = item.accessibilityInformation.role;
            }
            else {
                ariaLabel = item.text ? (0, iconLabels_1.stripIcons)(item.text).trim() : '';
            }
            this.container.setAttribute('aria-label', ariaLabel);
            this.container.setAttribute('role', role || '');
            if (item.tooltip) {
                const hoverContent = typeof item.tooltip === 'string' ? item.tooltip : { markdown: item.tooltip };
                this._itemDisposables.add((0, updatableHoverWidget_1.setupCustomHover)(this._hoverDelegate, this.container, hoverContent));
            }
            this.container.classList.toggle('cell-status-item-has-command', !!item.command);
            if (item.command) {
                this.container.tabIndex = 0;
                this._itemDisposables.add(DOM.addDisposableListener(this.container, DOM.EventType.CLICK, _e => {
                    this.executeCommand();
                }));
                this._itemDisposables.add(DOM.addDisposableListener(this.container, DOM.EventType.KEY_DOWN, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */)) {
                        this.executeCommand();
                    }
                }));
            }
            else {
                this.container.removeAttribute('tabIndex');
            }
            this._currentItem = item;
        }
        async executeCommand() {
            const command = this._currentItem.command;
            if (!command) {
                return;
            }
            const id = typeof command === 'string' ? command : command.id;
            const args = typeof command === 'string' ? [] : command.arguments ?? [];
            if (typeof command === 'string' || !command.arguments || !Array.isArray(command.arguments) || command.arguments.length === 0) {
                args.unshift(this._context);
            }
            this._telemetryService.publicLog2('workbenchActionExecuted', { id, from: 'cell status bar' });
            try {
                this._editor?.focus();
                await this._commandService.executeCommand(id, ...args);
            }
            catch (error) {
                this._notificationService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
    };
    CellStatusBarItem = __decorate([
        __param(5, telemetry_1.ITelemetryService),
        __param(6, commands_1.ICommandService),
        __param(7, notification_1.INotificationService),
        __param(8, themeService_1.IThemeService)
    ], CellStatusBarItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFN0YXR1c1BhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbFN0YXR1c1BhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0NoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBR1QsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSwwQkFBZTtRQWlCdkQsWUFDa0IsZUFBd0MsRUFDeEMsY0FBMkIsRUFDNUMsVUFBdUIsRUFDTixPQUFnQyxFQUMxQixxQkFBNkQsRUFDckUsWUFBMkIsRUFDbkIsb0JBQTJDLEVBQ25ELGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBVFMsb0JBQWUsR0FBZixlQUFlLENBQXlCO1lBQ3hDLG1CQUFjLEdBQWQsY0FBYyxDQUFhO1lBRTNCLFlBQU8sR0FBUCxPQUFPLENBQXlCO1lBQ1QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUdwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQWxCckQsY0FBUyxHQUF3QixFQUFFLENBQUM7WUFDcEMsZUFBVSxHQUF3QixFQUFFLENBQUM7WUFDckMsVUFBSyxHQUFXLENBQUMsQ0FBQztZQUdQLGdCQUFXLEdBQTBCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdCLENBQUMsQ0FBQztZQUMzRixlQUFVLEdBQXdCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBZWpFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxrQkFB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
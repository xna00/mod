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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/workbench/browser/parts/editor/multiEditorTabsControl", "vs/workbench/browser/parts/editor/singleEditorTabsControl", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/multiRowEditorTabsControl", "vs/workbench/browser/parts/editor/noEditorTabsControl", "vs/css!./media/editortitlecontrol"], function (require, exports, dom_1, instantiation_1, themeService_1, breadcrumbsControl_1, multiEditorTabsControl_1, singleEditorTabsControl_1, lifecycle_1, multiRowEditorTabsControl_1, noEditorTabsControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorTitleControl = void 0;
    let EditorTitleControl = class EditorTitleControl extends themeService_1.Themable {
        get breadcrumbsControl() { return this.breadcrumbsControlFactory?.control; }
        constructor(parent, editorPartsView, groupsView, groupView, model, instantiationService, themeService) {
            super(themeService);
            this.parent = parent;
            this.editorPartsView = editorPartsView;
            this.groupsView = groupsView;
            this.groupView = groupView;
            this.model = model;
            this.instantiationService = instantiationService;
            this.editorTabsControlDisposable = this._register(new lifecycle_1.DisposableStore());
            this.breadcrumbsControlDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorTabsControl = this.createEditorTabsControl();
            this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
        }
        createEditorTabsControl() {
            let tabsControlType;
            switch (this.groupsView.partOptions.showTabs) {
                case 'none':
                    tabsControlType = noEditorTabsControl_1.NoEditorTabsControl;
                    break;
                case 'single':
                    tabsControlType = singleEditorTabsControl_1.SingleEditorTabsControl;
                    break;
                case 'multiple':
                default:
                    tabsControlType = this.groupsView.partOptions.pinnedTabsOnSeparateRow ? multiRowEditorTabsControl_1.MultiRowEditorControl : multiEditorTabsControl_1.MultiEditorTabsControl;
                    break;
            }
            const control = this.instantiationService.createInstance(tabsControlType, this.parent, this.editorPartsView, this.groupsView, this.groupView, this.model);
            return this.editorTabsControlDisposable.add(control);
        }
        createBreadcrumbsControl() {
            if (this.groupsView.partOptions.showTabs === 'single') {
                return undefined; // Single tabs have breadcrumbs inlined. No tabs have no breadcrumbs.
            }
            // Breadcrumbs container
            const breadcrumbsContainer = document.createElement('div');
            breadcrumbsContainer.classList.add('breadcrumbs-below-tabs');
            this.parent.appendChild(breadcrumbsContainer);
            const breadcrumbsControlFactory = this.breadcrumbsControlDisposables.add(this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControlFactory, breadcrumbsContainer, this.groupView, {
                showFileIcons: true,
                showSymbolIcons: true,
                showDecorationColors: false,
                showPlaceholder: true
            }));
            // Breadcrumbs enablement & visibility change have an impact on layout
            // so we need to relayout the editor group when that happens.
            this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidEnablementChange(() => this.groupView.relayout()));
            this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidVisibilityChange(() => this.groupView.relayout()));
            return breadcrumbsControlFactory;
        }
        openEditor(editor, options) {
            const didChange = this.editorTabsControl.openEditor(editor, options);
            this.handleOpenedEditors(didChange);
        }
        openEditors(editors) {
            const didChange = this.editorTabsControl.openEditors(editors);
            this.handleOpenedEditors(didChange);
        }
        handleOpenedEditors(didChange) {
            if (didChange) {
                this.breadcrumbsControl?.update();
            }
            else {
                this.breadcrumbsControl?.revealLast();
            }
        }
        beforeCloseEditor(editor) {
            return this.editorTabsControl.beforeCloseEditor(editor);
        }
        closeEditor(editor) {
            this.editorTabsControl.closeEditor(editor);
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            this.editorTabsControl.closeEditors(editors);
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            if (!this.groupView.activeEditor) {
                this.breadcrumbsControl?.update();
            }
        }
        moveEditor(editor, fromIndex, targetIndex, stickyStateChange) {
            return this.editorTabsControl.moveEditor(editor, fromIndex, targetIndex, stickyStateChange);
        }
        pinEditor(editor) {
            return this.editorTabsControl.pinEditor(editor);
        }
        stickEditor(editor) {
            return this.editorTabsControl.stickEditor(editor);
        }
        unstickEditor(editor) {
            return this.editorTabsControl.unstickEditor(editor);
        }
        setActive(isActive) {
            return this.editorTabsControl.setActive(isActive);
        }
        updateEditorLabel(editor) {
            return this.editorTabsControl.updateEditorLabel(editor);
        }
        updateEditorDirty(editor) {
            return this.editorTabsControl.updateEditorDirty(editor);
        }
        updateOptions(oldOptions, newOptions) {
            // Update editor tabs control if options changed
            if (oldOptions.showTabs !== newOptions.showTabs ||
                (newOptions.showTabs !== 'single' && oldOptions.pinnedTabsOnSeparateRow !== newOptions.pinnedTabsOnSeparateRow)) {
                // Clear old
                this.editorTabsControlDisposable.clear();
                this.breadcrumbsControlDisposables.clear();
                (0, dom_1.clearNode)(this.parent);
                // Create new
                this.editorTabsControl = this.createEditorTabsControl();
                this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
            }
            // Forward into editor tabs control
            else {
                this.editorTabsControl.updateOptions(oldOptions, newOptions);
            }
        }
        layout(dimensions) {
            // Layout tabs control
            const tabsControlDimension = this.editorTabsControl.layout(dimensions);
            // Layout breadcrumbs if visible
            let breadcrumbsControlDimension = undefined;
            if (this.breadcrumbsControl?.isHidden() === false) {
                breadcrumbsControlDimension = new dom_1.Dimension(dimensions.container.width, breadcrumbsControl_1.BreadcrumbsControl.HEIGHT);
                this.breadcrumbsControl.layout(breadcrumbsControlDimension);
            }
            return new dom_1.Dimension(dimensions.container.width, tabsControlDimension.height + (breadcrumbsControlDimension ? breadcrumbsControlDimension.height : 0));
        }
        getHeight() {
            const tabsControlHeight = this.editorTabsControl.getHeight();
            const breadcrumbsControlHeight = this.breadcrumbsControl?.isHidden() === false ? breadcrumbsControl_1.BreadcrumbsControl.HEIGHT : 0;
            return {
                total: tabsControlHeight + breadcrumbsControlHeight,
                offset: tabsControlHeight
            };
        }
    };
    exports.EditorTitleControl = EditorTitleControl;
    exports.EditorTitleControl = EditorTitleControl = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService)
    ], EditorTitleControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yVGl0bGVDb250cm9sLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yVGl0bGVDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSx1QkFBUTtRQU8vQyxJQUFZLGtCQUFrQixLQUFLLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFcEYsWUFDa0IsTUFBbUIsRUFDbkIsZUFBaUMsRUFDakMsVUFBNkIsRUFDN0IsU0FBMkIsRUFDM0IsS0FBZ0MsRUFDMUIsb0JBQW1ELEVBQzNELFlBQTJCO1lBRTFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQVJILFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2pDLGVBQVUsR0FBVixVQUFVLENBQW1CO1lBQzdCLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQzNCLFVBQUssR0FBTCxLQUFLLENBQTJCO1lBQ2xCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFabkUsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBR3BFLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQWM3RSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDeEQsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2xFLENBQUM7UUFFTyx1QkFB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
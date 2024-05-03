var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "./utils", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, dom_1, button_1, codicons_1, lifecycle_1, observable_1, base_1, diffEditorWidget_1, toolbar_1, actions_1, instantiation_1, utils_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorItemTemplate = exports.TemplateData = void 0;
    class TemplateData {
        constructor(viewModel, deltaScrollVertical) {
            this.viewModel = viewModel;
            this.deltaScrollVertical = deltaScrollVertical;
        }
        getId() {
            return this.viewModel;
        }
    }
    exports.TemplateData = TemplateData;
    let DiffEditorItemTemplate = class DiffEditorItemTemplate extends lifecycle_1.Disposable {
        constructor(_container, _overflowWidgetsDomNode, _workbenchUIElementFactory, _instantiationService) {
            super();
            this._container = _container;
            this._overflowWidgetsDomNode = _overflowWidgetsDomNode;
            this._workbenchUIElementFactory = _workbenchUIElementFactory;
            this._instantiationService = _instantiationService;
            this._viewModel = (0, base_1.observableValue)(this, undefined);
            this._collapsed = (0, observable_1.derived)(this, reader => this._viewModel.read(reader)?.collapsed.read(reader));
            this._editorContentHeight = (0, base_1.observableValue)(this, 500);
            this.contentHeight = (0, observable_1.derived)(this, reader => {
                const h = this._collapsed.read(reader) ? 0 : this._editorContentHeight.read(reader);
                return h + this._outerEditorHeight;
            });
            this._modifiedContentWidth = (0, base_1.observableValue)(this, 0);
            this._modifiedWidth = (0, base_1.observableValue)(this, 0);
            this._originalContentWidth = (0, base_1.observableValue)(this, 0);
            this._originalWidth = (0, base_1.observableValue)(this, 0);
            this.maxScroll = (0, observable_1.derived)(this, reader => {
                const scroll1 = this._modifiedContentWidth.read(reader) - this._modifiedWidth.read(reader);
                const scroll2 = this._originalContentWidth.read(reader) - this._originalWidth.read(reader);
                if (scroll1 > scroll2) {
                    return { maxScroll: scroll1, width: this._modifiedWidth.read(reader) };
                }
                else {
                    return { maxScroll: scroll2, width: this._originalWidth.read(reader) };
                }
            });
            this._elements = (0, dom_1.h)('div.multiDiffEntry', [
                (0, dom_1.h)('div.header@header', [
                    (0, dom_1.h)('div.header-content', [
                        (0, dom_1.h)('div.collapse-button@collapseButton'),
                        (0, dom_1.h)('div.file-path', [
                            (0, dom_1.h)('div.title.modified.show-file-icons@primaryPath', []),
                            (0, dom_1.h)('div.status.deleted@status', ['R']),
                            (0, dom_1.h)('div.title.original.show-file-icons@secondaryPath', []),
                        ]),
                        (0, dom_1.h)('div.actions@actions'),
                    ]),
                ]),
                (0, dom_1.h)('div.editorParent', [
                    (0, dom_1.h)('div.editorContainer@editor'),
                ])
            ]);
            this.editor = this._register(this._instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._elements.editor, {
                overflowWidgetsDomNode: this._overflowWidgetsDomNode,
            }, {}));
            this.isModifedFocused = isFocused(this.editor.getModifiedEditor());
            this.isOriginalFocused = isFocused(this.editor.getOriginalEditor());
            this.isFocused = (0, observable_1.derived)(this, reader => this.isModifedFocused.read(reader) || this.isOriginalFocused.read(reader));
            this._resourceLabel = this._workbenchUIElementFactory.createResourceLabel
                ? this._register(this._workbenchUIElementFactory.createResourceLabel(this._elements.primaryPath))
                : undefined;
            this._resourceLabel2 = this._workbenchUIElementFactory.createResourceLabel
                ? this._register(this._workbenchUIElementFactory.createResourceLabel(this._elements.secondaryPath))
                : undefined;
            this._dataStore = new lifecycle_1.DisposableStore();
            this._headerHeight = 40;
            this._lastScrollTop = -1;
            this._isSettingScrollTop = false;
            const btn = new button_1.Button(this._elements.collapseButton, {});
            this._register((0, observable_1.autorun)(reader => {
                btn.element.className = '';
                btn.icon = this._collapsed.read(reader) ? codicons_1.Codicon.chevronRight : codicons_1.Codicon.chevronDown;
            }));
            this._register(btn.onDidClick(() => {
                this._viewModel.get()?.collapsed.set(!this._collapsed.get(), undefined);
            }));
            this._register((0, observable_1.autorun)(reader => {
                this._elements.editor.style.display = this._collapsed.read(reader) ? 'none' : 'block';
            }));
            this._register(this.editor.getModifiedEditor().onDidLayoutChange(e => {
                const width = this.editor.getModifiedEditor().getLayoutInfo().contentWidth;
                this._modifiedWidth.set(width, undefined);
            }));
            this._register(this.editor.getOriginalEditor().onDidLayoutChange(e => {
                const width = this.editor.getOriginalEditor().getLayoutInfo().contentWidth;
                this._originalWidth.set(width, undefined);
            }));
            this._register(this.editor.onDidContentSizeChange(e => {
                (0, base_1.globalTransaction)(tx => {
                    this._editorContentHeight.set(e.contentHeight, tx);
                    this._modifiedContentWidth.set(this.editor.getModifiedEditor().getContentWidth(), tx);
                    this._originalContentWidth.set(this.editor.getOriginalEditor().getContentWidth(), tx);
                });
            }));
            this._register(this.editor.getOriginalEditor().onDidScrollChange(e => {
                if (this._isSettingScrollTop) {
                    return;
                }
                if (!e.scrollTopChanged || !this._data) {
                    return;
                }
                const delta = e.scrollTop - this._lastScrollTop;
                this._data.deltaScrollVertical(delta);
            }));
            this._register((0, observable_1.autorun)(reader => {
                const isFocused = this.isFocused.read(reader);
                this._elements.root.classList.toggle('focused', isFocused);
            }));
            this._container.appendChild(this._elements.root);
            this._outerEditorHeight = this._headerHeight;
            this._register(this._instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this._elements.actions, actions_1.MenuId.MultiDiffEditorFileToolbar, {
                actionRunner: this._register(new utils_1.ActionRunnerWithContext(() => (this._viewModel.get()?.modifiedUri))),
                menuOptions: {
                    shouldForwardArgs: true,
                },
                toolbarOptions: { primaryGroup: g => g.startsWith('navigation') },
                actionViewItemProvider: (action, options) => (0, menuEntryActionViewItem_1.createActionViewItem)(_instantiationService, action, options),
            }));
        }
        setScrollLeft(left) {
            if (this._modifiedContentWidth.get() - this._modifiedWidth.get() > this._originalContentWidth.get() - this._originalWidth.get()) {
                this.editor.getModifiedEditor().setScrollLeft(left);
            }
            else {
                this.editor.getOriginalEditor().setScrollLeft(left);
            }
        }
        setData(data) {
            this._data = data;
            function updateOptions(options) {
                return {
                    ...options,
                    scrollBeyondLastLine: false,
                    hideUnchangedRegions: {
                        enabled: true,
                    },
                    scrollbar: {
                        vertical: 'hidden',
                        horizontal: 'hidden',
                        handleMouseWheel: false,
                        useShadows: false,
                    },
                    renderOverviewRuler: false,
                    fixedOverflowWidgets: true,
                    overviewRulerBorder: false,
                };
            }
            const value = data.viewModel.entry.value; // TODO
            if (value.onOptionsDidChange) {
                this._dataStore.add(value.onOptionsDidChange(() => {
                    this.editor.updateOptions(updateOptions(value.options ?? {}));
                }));
            }
            (0, base_1.globalTransaction)(tx => {
                this._resourceLabel?.setUri(data.viewModel.modifiedUri ?? data.viewModel.originalUri, { strikethrough: data.viewModel.modifiedUri === undefined });
                let isRenamed = false;
                let isDeleted = false;
                let isAdded = false;
                let flag = '';
                if (data.viewModel.modifiedUri && data.viewModel.originalUri && data.viewModel.modifiedUri.path !== data.viewModel.originalUri.path) {
                    flag = 'R';
                    isRenamed = true;
                }
                else if (!data.viewModel.modifiedUri) {
                    flag = 'D';
                    isDeleted = true;
                }
                else if (!data.viewModel.originalUri) {
                    flag = 'A';
                    isAdded = true;
                }
                this._elements.status.classList.toggle('renamed', isRenamed);
                this._elements.status.classList.toggle('deleted', isDeleted);
                this._elements.status.classList.toggle('added', isAdded);
                this._elements.status.innerText = flag;
                this._resourceLabel2?.setUri(isRenamed ? data.viewModel.originalUri : undefined, { strikethrough: true });
                this._dataStore.clear();
                this._viewModel.set(data.viewModel, tx);
                this.editor.setModel(data.viewModel.diffEditorViewModel, tx);
                this.editor.updateOptions(updateOptions(value.options ?? {}));
            });
        }
        render(verticalRange, width, editorScroll, viewPort) {
            this._elements.root.style.visibility = 'visible';
            this._elements.root.style.top = `${verticalRange.start}px`;
            this._elements.root.style.height = `${verticalRange.length}px`;
            this._elements.root.style.width = `${width}px`;
            this._elements.root.style.position = 'absolute';
            // For sticky scroll
            const maxDelta = verticalRange.length - this._headerHeight;
            const delta = Math.max(0, Math.min(viewPort.start - verticalRange.start, maxDelta));
            this._elements.header.style.transform = `translateY(${delta}px)`;
            (0, base_1.globalTransaction)(tx => {
                this.editor.layout({
                    width: width - 2 * 8 - 2 * 1,
                    height: verticalRange.length - this._outerEditorHeight,
                });
            });
            try {
                this._isSettingScrollTop = true;
                this._lastScrollTop = editorScroll;
                this.editor.getOriginalEditor().setScrollTop(editorScroll);
            }
            finally {
                this._isSettingScrollTop = false;
            }
            this._elements.header.classList.toggle('shadow', delta > 0 || editorScroll > 0);
            this._elements.header.classList.toggle('collapsed', delta === maxDelta);
        }
        hide() {
            this._elements.root.style.top = `-100000px`;
            this._elements.root.style.visibility = 'hidden'; // Some editor parts are still visible
        }
    };
    exports.DiffEditorItemTemplate = DiffEditorItemTemplate;
    exports.DiffEditorItemTemplate = DiffEditorItemTemplate = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], DiffEditorItemTemplate);
    function isFocused(editor) {
        return (0, observable_1.observableFromEvent)(h => {
            const store = new lifecycle_1.DisposableStore();
            store.add(editor.onDidFocusEditorWidget(() => h(true)));
            store.add(editor.onDidBlurEditorWidget(() => h(false)));
            return store;
        }, () => editor.hasTextFocus());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckl0ZW1UZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L211bHRpRGlmZkVkaXRvci9kaWZmRWRpdG9ySXRlbVRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUF1QkEsTUFBYSxZQUFZO1FBQ3hCLFlBQ2lCLFNBQW9DLEVBQ3BDLG1CQUE0QztZQUQ1QyxjQUFTLEdBQVQsU0FBUyxDQUEyQjtZQUNwQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXlCO1FBQ3pELENBQUM7UUFHTCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7S0FDRDtJQVZELG9DQVVDO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQThEckQsWUFDa0IsVUFBdUIsRUFDdkIsdUJBQW9DLEVBQ3BDLDBCQUFzRCxFQUNoRCxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFMUyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3ZCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBYTtZQUNwQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTRCO1lBQy9CLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFqRXBFLGVBQVUsR0FBRyxJQUFBLHNCQUFlLEVBQXdDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVyRixlQUFVLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUUzRix5QkFBb0IsR0FBRyxJQUFBLHNCQUFl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
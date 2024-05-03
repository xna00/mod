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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/editor/browser/editorExtensions", "vs/workbench/browser/labels", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/workbench/common/theme", "vs/nls", "vs/base/common/event"], function (require, exports, dom_1, lifecycle_1, embeddedCodeEditorWidget_1, zoneWidget_1, instantiation_1, colorRegistry, editorColorRegistry, themeService_1, inlineChat_1, editorExtensions_1, labels_1, files_1, resolverService_1, button_1, defaultStyles_1, editor_1, editorService_1, contextView_1, actions_1, iconLabels_1, codicons_1, theme_1, nls_1, event_1) {
    "use strict";
    var InlineChatFileCreatePreviewWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatFileCreatePreviewWidget = void 0;
    let InlineChatFileCreatePreviewWidget = class InlineChatFileCreatePreviewWidget extends zoneWidget_1.ZoneWidget {
        static { InlineChatFileCreatePreviewWidget_1 = this; }
        static { this.TitleHeight = 35; }
        constructor(parentEditor, instaService, themeService, _textModelResolverService, _editorService) {
            super(parentEditor, {
                showArrow: false,
                showFrame: true,
                frameColor: colorRegistry.asCssVariable(theme_1.TAB_ACTIVE_MODIFIED_BORDER),
                frameWidth: 1,
                isResizeable: true,
                isAccessible: true,
                showInHiddenAreas: true,
                ordinal: 10000 + 2
            });
            this._textModelResolverService = _textModelResolverService;
            this._editorService = _editorService;
            this._elements = (0, dom_1.h)('div.inline-chat-newfile-widget@domNode', [
                (0, dom_1.h)('div.title@title', [
                    (0, dom_1.h)('span.name.show-file-icons@name'),
                    (0, dom_1.h)('span.detail@detail'),
                ]),
                (0, dom_1.h)('div.editor@editor'),
            ]);
            this._previewStore = new lifecycle_1.MutableDisposable();
            super.create();
            this._name = instaService.createInstance(labels_1.ResourceLabel, this._elements.name, { supportIcons: true });
            this._elements.detail.appendChild((0, iconLabels_1.renderIcon)(codicons_1.Codicon.circleFilled));
            const contributions = editorExtensions_1.EditorExtensionsRegistry
                .getEditorContributions()
                .filter(c => c.id !== inlineChat_1.INLINE_CHAT_ID);
            this._previewEditor = instaService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this._elements.editor, {
                scrollBeyondLastLine: false,
                stickyScroll: { enabled: false },
                minimap: { enabled: false },
                scrollbar: { alwaysConsumeMouseWheel: false, useShadows: true, ignoreHorizontalScrollbarInContentHeight: true, },
            }, { isSimpleWidget: true, contributions }, parentEditor);
            const doStyle = () => {
                const theme = themeService.getColorTheme();
                const overrides = [
                    [colorRegistry.editorBackground, inlineChat_1.inlineChatRegionHighlight],
                    [editorColorRegistry.editorGutter, inlineChat_1.inlineChatRegionHighlight],
                ];
                for (const [target, source] of overrides) {
                    const value = theme.getColor(source);
                    if (value) {
                        this._elements.domNode.style.setProperty(colorRegistry.asCssVariableName(target), String(value));
                    }
                }
            };
            doStyle();
            this._disposables.add(themeService.onDidColorThemeChange(doStyle));
            this._buttonBar = instaService.createInstance(ButtonBarWidget);
            this._elements.title.appendChild(this._buttonBar.domNode);
        }
        dispose() {
            this._name.dispose();
            this._buttonBar.dispose();
            this._previewEditor.dispose();
            this._previewStore.dispose();
            super.dispose();
        }
        _fillContainer(container) {
            container.appendChild(this._elements.domNode);
        }
        show() {
            throw new Error('Use showFileCreation');
        }
        async showCreation(where, untitledTextModel) {
            const store = new lifecycle_1.DisposableStore();
            this._previewStore.value = store;
            this._name.element.setFile(untitledTextModel.resource, {
                fileKind: files_1.FileKind.FILE,
                fileDecorations: { badges: true, colors: true }
            });
            const actionSave = (0, actions_1.toAction)({
                id: '1',
                label: (0, nls_1.localize)('save', "Create"),
                run: () => untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ })
            });
            const actionSaveAs = (0, actions_1.toAction)({
                id: '2',
                label: (0, nls_1.localize)('saveAs', "Create As"),
                run: async () => {
                    const ids = this._editorService.findEditors(untitledTextModel.resource, { supportSideBySide: editor_1.SideBySideEditor.ANY });
                    await this._editorService.save(ids.slice(), { saveAs: true, reason: 1 /* SaveReason.EXPLICIT */ });
                }
            });
            this._buttonBar.update([
                [actionSave, actionSaveAs],
                [((0, actions_1.toAction)({ id: '3', label: (0, nls_1.localize)('discard', "Discard"), run: () => untitledTextModel.revert() }))]
            ]);
            store.add(event_1.Event.any(untitledTextModel.onDidRevert, untitledTextModel.onDidSave, untitledTextModel.onDidChangeDirty, untitledTextModel.onWillDispose)(() => this.hide()));
            await untitledTextModel.resolve();
            const ref = await this._textModelResolverService.createModelReference(untitledTextModel.resource);
            store.add(ref);
            const model = ref.object.textEditorModel;
            this._previewEditor.setModel(model);
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            this._elements.title.style.height = `${InlineChatFileCreatePreviewWidget_1.TitleHeight}px`;
            const titleHightInLines = InlineChatFileCreatePreviewWidget_1.TitleHeight / lineHeight;
            const maxLines = Math.max(4, Math.floor((this.editor.getLayoutInfo().height / lineHeight) * .33));
            const lines = Math.min(maxLines, model.getLineCount());
            super.show(where, titleHightInLines + lines);
        }
        hide() {
            this._previewStore.clear();
            super.hide();
        }
        // --- layout
        revealRange(range, isLastLine) {
            // ignore
        }
        _onWidth(widthInPixel) {
            if (this._dim) {
                this._doLayout(this._dim.height, widthInPixel);
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            const { lineNumbersLeft } = this.editor.getLayoutInfo();
            this._elements.title.style.marginLeft = `${lineNumbersLeft}px`;
            const newDim = new dom_1.Dimension(widthInPixel, heightInPixel);
            if (!dom_1.Dimension.equals(this._dim, newDim)) {
                this._dim = newDim;
                this._previewEditor.layout(this._dim.with(undefined, this._dim.height - InlineChatFileCreatePreviewWidget_1.TitleHeight));
            }
        }
    };
    exports.InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget;
    exports.InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, editorService_1.IEditorService)
    ], InlineChatFileCreatePreviewWidget);
    let ButtonBarWidget = class ButtonBarWidget {
        constructor(_contextMenuService) {
            this._contextMenuService = _contextMenuService;
            this._domNode = (0, dom_1.h)('div.buttonbar-widget');
            this._store = new lifecycle_1.DisposableStore();
            this._buttonBar = new button_1.ButtonBar(this.domNode);
        }
        update(allActions) {
            this._buttonBar.clear();
            let secondary = false;
            for (const actions of allActions) {
                let btn;
                const [first, ...rest] = actions;
                if (!first) {
                    continue;
                }
                else if (rest.length === 0) {
                    // single action
                    btn = this._buttonBar.addButton({ ...defaultStyles_1.defaultButtonStyles, secondary });
                }
                else {
                    btn = this._buttonBar.addButtonWithDropdown({
                        ...defaultStyles_1.defaultButtonStyles,
                        addPrimaryActionToDropdown: false,
                        actions: rest,
                        contextMenuProvider: this._contextMenuService
                    });
                }
                btn.label = first.label;
                this._store.add(btn.onDidClick(() => first.run()));
                secondary = true;
            }
        }
        dispose() {
            this._buttonBar.dispose();
            this._store.dispose();
        }
        get domNode() {
            return this._domNode.root;
        }
    };
    ButtonBarWidget = __decorate([
        __param(0, contextView_1.IContextMenuService)
    ], ButtonBarWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEZpbGVDcmVhdGlvbldpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXRGaWxlQ3JlYXRpb25XaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdDekYsSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBa0MsU0FBUSx1QkFBVTs7aUJBRWpELGdCQUFXLEdBQUcsRUFBRSxBQUFMLENBQU07UUFnQmhDLFlBQ0MsWUFBeUIsRUFDRixZQUFtQyxFQUMzQyxZQUEyQixFQUN2Qix5QkFBNkQsRUFDaEUsY0FBK0M7WUFFL0QsS0FBSyxDQUFDLFlBQVksRUFBRTtnQkFDbkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFVBQVUsRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLGtDQUEwQixDQUFDO2dCQUNuRSxVQUFVLEVBQUUsQ0FBQztnQkFDYixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQzthQUNsQixDQUFDLENBQUM7WUFaaUMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFtQjtZQUMvQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFuQi9DLGNBQVMsR0FBRyxJQUFBLE9BQUMsRUFBQyx3Q0FBd0MsRUFBRTtnQkFDeEUsSUFBQSxPQUFDLEVBQUMsaUJBQWlCLEVBQUU7b0JBQ3BCLElBQUEsT0FBQyxFQUFDLGdDQUFnQyxDQUFDO29CQUNuQyxJQUFBLE9BQUMsRUFBQyxvQkFBb0IsQ0FBQztpQkFDdkIsQ0FBQztnQkFDRixJQUFBLE9BQUMs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
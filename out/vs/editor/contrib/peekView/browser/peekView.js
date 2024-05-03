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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/color", "vs/base/common/event", "vs/base/common/objects", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/css!./media/peekViewWidget"], function (require, exports, dom, actionbar_1, actions_1, codicons_1, themables_1, color_1, event_1, objects, editorExtensions_1, codeEditorService_1, embeddedCodeEditorWidget_1, zoneWidget_1, nls, menuEntryActionViewItem_1, contextkey_1, extensions_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.peekViewEditorMatchHighlightBorder = exports.peekViewEditorMatchHighlight = exports.peekViewResultsMatchHighlight = exports.peekViewEditorStickyScrollBackground = exports.peekViewEditorGutterBackground = exports.peekViewEditorBackground = exports.peekViewResultsSelectionForeground = exports.peekViewResultsSelectionBackground = exports.peekViewResultsFileForeground = exports.peekViewResultsMatchForeground = exports.peekViewResultsBackground = exports.peekViewBorder = exports.peekViewTitleInfoForeground = exports.peekViewTitleForeground = exports.peekViewTitleBackground = exports.PeekViewWidget = exports.PeekContext = exports.IPeekViewService = void 0;
    exports.getOuterEditor = getOuterEditor;
    exports.IPeekViewService = (0, instantiation_1.createDecorator)('IPeekViewService');
    (0, extensions_1.registerSingleton)(exports.IPeekViewService, class {
        constructor() {
            this._widgets = new Map();
        }
        addExclusiveWidget(editor, widget) {
            const existing = this._widgets.get(editor);
            if (existing) {
                existing.listener.dispose();
                existing.widget.dispose();
            }
            const remove = () => {
                const data = this._widgets.get(editor);
                if (data && data.widget === widget) {
                    data.listener.dispose();
                    this._widgets.delete(editor);
                }
            };
            this._widgets.set(editor, { widget, listener: widget.onDidClose(remove) });
        }
    }, 1 /* InstantiationType.Delayed */);
    var PeekContext;
    (function (PeekContext) {
        PeekContext.inPeekEditor = new contextkey_1.RawContextKey('inReferenceSearchEditor', true, nls.localize('inReferenceSearchEditor', "Whether the current code editor is embedded inside peek"));
        PeekContext.notInPeekEditor = PeekContext.inPeekEditor.toNegated();
    })(PeekContext || (exports.PeekContext = PeekContext = {}));
    let PeekContextController = class PeekContextController {
        static { this.ID = 'editor.contrib.referenceController'; }
        constructor(editor, contextKeyService) {
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                PeekContext.inPeekEditor.bindTo(contextKeyService);
            }
        }
        dispose() { }
    };
    PeekContextController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], PeekContextController);
    (0, editorExtensions_1.registerEditorContribution)(PeekContextController.ID, PeekContextController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    function getOuterEditor(accessor) {
        const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            return editor.getParentEditor();
        }
        return editor;
    }
    const defaultOptions = {
        headerBackgroundColor: color_1.Color.white,
        primaryHeadingColor: color_1.Color.fromHex('#333333'),
        secondaryHeadingColor: color_1.Color.fromHex('#6c6c6cb3')
    };
    let PeekViewWidget = class PeekViewWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, options, instantiationService) {
            super(editor, options);
            this.instantiationService = instantiationService;
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
            objects.mixin(this.options, defaultOptions, false);
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true; // prevent consumers who dispose on onDidClose from looping
                super.dispose();
                this._onDidClose.fire(this);
            }
        }
        style(styles) {
            const options = this.options;
            if (styles.headerBackgroundColor) {
                options.headerBackgroundColor = styles.headerBackgroundColor;
            }
            if (styles.primaryHeadingColor) {
                options.primaryHeadingColor = styles.primaryHeadingColor;
            }
            if (styles.secondaryHeadingColor) {
                options.secondaryHeadingColor = styles.secondaryHeadingColor;
            }
            super.style(styles);
        }
        _applyStyles() {
            super._applyStyles();
            const options = this.options;
            if (this._headElement && options.headerBackgroundColor) {
                this._headElement.style.backgroundColor = options.headerBackgroundColor.toString();
            }
            if (this._primaryHeading && options.primaryHeadingColor) {
                this._primaryHeading.style.color = options.primaryHeadingColor.toString();
            }
            if (this._secondaryHeading && options.secondaryHeadingColor) {
                this._secondaryHeading.style.color = options.secondaryHeadingColor.toString();
            }
            if (this._bodyElement && options.frameColor) {
                this._bodyElement.style.borderColor = options.frameColor.toString();
            }
        }
        _fillContainer(container) {
            this.setCssClass('peekview-widget');
            this._headElement = dom.$('.head');
            this._bodyElement = dom.$('.body');
            this._fillHead(this._headElement);
            this._fillBody(this._bodyElement);
            container.appendChild(this._headElement);
            container.appendChild(this._bodyElement);
        }
        _fillHead(container, noCloseAction) {
            this._titleElement = dom.$('.peekview-title');
            if (this.options.supportOnTitleClick) {
                this._titleElement.classList.add('clickable');
                dom.addStandardDisposableListener(this._titleElement, 'click', event => this._onTitleClick(event));
            }
            dom.append(this._headElement, this._titleElement);
            this._fillTitleIcon(this._titleElement);
            this._primaryHeading = dom.$('span.filename');
            this._secondaryHeading = dom.$('span.dirname');
            this._metaHeading = dom.$('span.meta');
            dom.append(this._titleElement, this._primaryHeading, this._secondaryHeading, this._metaHeading);
            const actionsContainer = dom.$('.peekview-actions');
            dom.append(this._headElement, actionsContainer);
            const actionBarOptions = this._getActionBarOptions();
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, actionBarOptions);
            this._disposables.add(this._actionbarWidget);
            if (!noCloseAction) {
                this._actionbarWidget.push(new actions_1.Action('peekview.close', nls.localize('label.close', "Close"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close), true, () => {
                    this.dispose();
                    return Promise.resolve();
                }), { label: false, icon: true });
            }
        }
        _fillTitleIcon(container) {
        }
        _getActionBarOptions() {
            return {
                actionViewItemProvider: menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */
            };
        }
        _onTitleClick(event) {
            // implement me if supportOnTitleClick option is set
        }
        setTitle(primaryHeading, secondaryHeading) {
            if (this._primaryHeading && this._secondaryHeading) {
                this._primaryHeading.innerText = primaryHeading;
                this._primaryHeading.setAttribute('title', primaryHeading);
                if (secondaryHeading) {
                    this._secondaryHeading.innerText = secondaryHeading;
                }
                else {
                    dom.clearNode(this._secondaryHeading);
                }
            }
        }
        setMetaTitle(value) {
            if (this._metaHeading) {
                if (value) {
                    this._metaHeading.innerText = value;
                    dom.show(this._metaHeading);
                }
                else {
                    dom.hide(this._metaHeading);
                }
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            if (!this._isShowing && heightInPixel < 0) {
                // Looks like the view zone got folded away!
                this.dispose();
                return;
            }
            const headHeight = Math.ceil(this.editor.getOption(67 /* EditorOption.lineHeight */) * 1.2);
            const bodyHeight = Math.round(heightInPixel - (headHeight + 2 /* the border-top/bottom width*/));
            this._doLayoutHead(headHeight, widthInPixel);
            this._doLayoutBody(bodyHeight, widthInPixel);
        }
        _doLayoutHead(heightInPixel, widthInPixel) {
            if (this._headElement) {
                this._headElement.style.height = `${heightInPixel}px`;
                this._headElement.style.lineHeight = this._headElement.style.height;
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            if (this._bodyElement) {
                this._bodyElement.style.height = `${heightInPixel}px`;
            }
        }
    };
    exports.PeekViewWidget = PeekViewWidget;
    exports.PeekViewWidget = PeekViewWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], PeekViewWidget);
    exports.peekViewTitleBackground = (0, colorRegistry_1.registerColor)('peekViewTitle.background', { dark: '#252526', light: '#F3F3F3', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('peekViewTitleBackground', 'Background color of the peek view title area.'));
    exports.peekViewTitleForeground = (0, colorRegistry_1.registerColor)('peekViewTitleLabel.foreground', { dark: color_1.Color.white, light: color_1.Color.black, hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewTitleForeground', 'Color of the peek view title.'));
    exports.peekViewTitleInfoForeground = (0, colorRegistry_1.registerColor)('peekViewTitleDescription.foreground', { dark: '#ccccccb3', light: '#616161', hcDark: '#FFFFFF99', hcLight: '#292929' }, nls.localize('peekViewTitleInfoForeground', 'Color of the peek view title info.'));
    exports.peekViewBorder = (0, colorRegistry_1.registerColor)('peekView.border', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('peekViewBorder', 'Color of the peek view borders and arrow.'));
    exports.peekViewResultsBackground = (0, colorRegistry_1.registerColor)('peekViewResult.background', { dark: '#252526', light: '#F3F3F3', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('peekViewResultsBackground', 'Background color of the peek view result list.'));
    exports.peekViewResultsMatchForeground = (0, colorRegistry_1.registerColor)('peekViewResult.lineForeground', { dark: '#bbbbbb', light: '#646465', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsMatchForeground', 'Foreground color for line nodes in the peek view result list.'));
    exports.peekViewResultsFileForeground = (0, colorRegistry_1.registerColor)('peekViewResult.fileForeground', { dark: color_1.Color.white, light: '#1E1E1E', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsFileForeground', 'Foreground color for file nodes in the peek view result list.'));
    exports.peekViewResultsSelectionBackground = (0, colorRegistry_1.registerColor)('peekViewResult.selectionBackground', { dark: '#3399ff33', light: '#3399ff33', hcDark: null, hcLight: null }, nls.localize('peekViewResultsSelectionBackground', 'Background color of the selected entry in the peek view result list.'));
    exports.peekViewResultsSelectionForeground = (0, colorRegistry_1.registerColor)('peekViewResult.selectionForeground', { dark: color_1.Color.white, light: '#6C6C6C', hcDark: color_1.Color.white, hcLight: colorRegistry_1.editorForeground }, nls.localize('peekViewResultsSelectionForeground', 'Foreground color of the selected entry in the peek view result list.'));
    exports.peekViewEditorBackground = (0, colorRegistry_1.registerColor)('peekViewEditor.background', { dark: '#001F33', light: '#F2F8FC', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('peekViewEditorBackground', 'Background color of the peek view editor.'));
    exports.peekViewEditorGutterBackground = (0, colorRegistry_1.registerColor)('peekViewEditorGutter.background', { dark: exports.peekViewEditorBackground, light: exports.peekViewEditorBackground, hcDark: exports.peekViewEditorBackground, hcLight: exports.peekViewEditorBackground }, nls.localize('peekViewEditorGutterBackground', 'Background color of the gutter in the peek view editor.'));
    exports.peekViewEditorStickyScrollBackground = (0, colorRegistry_1.registerColor)('peekViewEditorStickyScroll.background', { dark: exports.peekViewEditorBackground, light: exports.peekViewEditorBackground, hcDark: exports.peekViewEditorBackground, hcLight: exports.peekViewEditorBackground }, nls.localize('peekViewEditorStickScrollBackground', 'Background color of sticky scroll in the peek view editor.'));
    exports.peekViewResultsMatchHighlight = (0, colorRegistry_1.registerColor)('peekViewResult.matchHighlightBackground', { dark: '#ea5c004d', light: '#ea5c004d', hcDark: null, hcLight: null }, nls.localize('peekViewResultsMatchHighlight', 'Match highlight color in the peek view result list.'));
    exports.peekViewEditorMatchHighlight = (0, colorRegistry_1.registerColor)('peekViewEditor.matchHighlightBackground', { dark: '#ff8f0099', light: '#f5d802de', hcDark: null, hcLight: null }, nls.localize('peekViewEditorMatchHighlight', 'Match highlight color in the peek view editor.'));
    exports.peekViewEditorMatchHighlightBorder = (0, colorRegistry_1.registerColor)('peekViewEditor.matchHighlightBorder', { dark: null, light: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('peekViewEditorMatchHighlightBorder', 'Match highlight border in the peek view editor.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVla1ZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3BlZWtWaWV3L2Jyb3dzZXIvcGVla1ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEVoRyx3Q0FNQztJQXpEWSxRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsa0JBQWtCLENBQUMsQ0FBQztJQU10RixJQUFBLDhCQUFpQixFQUFDLHdCQUFnQixFQUFFO1FBQUE7WUFHbEIsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFrRSxDQUFDO1FBaUJ2RyxDQUFDO1FBZkEsa0JBQWtCLENBQUMsTUFBbUIsRUFBRSxNQUFzQjtZQUM3RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLEdBQUcsRUFBRTtnQkFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFH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
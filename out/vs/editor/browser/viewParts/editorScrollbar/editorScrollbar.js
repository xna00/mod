/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/editor/browser/view/viewPart", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, scrollableElement_1, viewPart_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorScrollbar = void 0;
    class EditorScrollbar extends viewPart_1.ViewPart {
        constructor(context, linesContent, viewDomNode, overflowGuardDomNode) {
            super(context);
            const options = this._context.configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            const mouseWheelScrollSensitivity = options.get(75 /* EditorOption.mouseWheelScrollSensitivity */);
            const fastScrollSensitivity = options.get(40 /* EditorOption.fastScrollSensitivity */);
            const scrollPredominantAxis = options.get(106 /* EditorOption.scrollPredominantAxis */);
            const scrollbarOptions = {
                listenOnDomNode: viewDomNode.domNode,
                className: 'editor-scrollable' + ' ' + (0, themeService_1.getThemeTypeSelector)(context.theme.type),
                useShadows: false,
                lazyRender: true,
                vertical: scrollbar.vertical,
                horizontal: scrollbar.horizontal,
                verticalHasArrows: scrollbar.verticalHasArrows,
                horizontalHasArrows: scrollbar.horizontalHasArrows,
                verticalScrollbarSize: scrollbar.verticalScrollbarSize,
                verticalSliderSize: scrollbar.verticalSliderSize,
                horizontalScrollbarSize: scrollbar.horizontalScrollbarSize,
                horizontalSliderSize: scrollbar.horizontalSliderSize,
                handleMouseWheel: scrollbar.handleMouseWheel,
                alwaysConsumeMouseWheel: scrollbar.alwaysConsumeMouseWheel,
                arrowSize: scrollbar.arrowSize,
                mouseWheelScrollSensitivity: mouseWheelScrollSensitivity,
                fastScrollSensitivity: fastScrollSensitivity,
                scrollPredominantAxis: scrollPredominantAxis,
                scrollByPage: scrollbar.scrollByPage,
            };
            this.scrollbar = this._register(new scrollableElement_1.SmoothScrollableElement(linesContent.domNode, scrollbarOptions, this._context.viewLayout.getScrollable()));
            viewPart_1.PartFingerprints.write(this.scrollbar.getDomNode(), 6 /* PartFingerprint.ScrollableElement */);
            this.scrollbarDomNode = (0, fastDomNode_1.createFastDomNode)(this.scrollbar.getDomNode());
            this.scrollbarDomNode.setPosition('absolute');
            this._setLayout();
            // When having a zone widget that calls .focus() on one of its dom elements,
            // the browser will try desperately to reveal that dom node, unexpectedly
            // changing the .scrollTop of this.linesContent
            const onBrowserDesperateReveal = (domNode, lookAtScrollTop, lookAtScrollLeft) => {
                const newScrollPosition = {};
                if (lookAtScrollTop) {
                    const deltaTop = domNode.scrollTop;
                    if (deltaTop) {
                        newScrollPosition.scrollTop = this._context.viewLayout.getCurrentScrollTop() + deltaTop;
                        domNode.scrollTop = 0;
                    }
                }
                if (lookAtScrollLeft) {
                    const deltaLeft = domNode.scrollLeft;
                    if (deltaLeft) {
                        newScrollPosition.scrollLeft = this._context.viewLayout.getCurrentScrollLeft() + deltaLeft;
                        domNode.scrollLeft = 0;
                    }
                }
                this._context.viewModel.viewLayout.setScrollPosition(newScrollPosition, 1 /* ScrollType.Immediate */);
            };
            // I've seen this happen both on the view dom node & on the lines content dom node.
            this._register(dom.addDisposableListener(viewDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(viewDomNode.domNode, true, true)));
            this._register(dom.addDisposableListener(linesContent.domNode, 'scroll', (e) => onBrowserDesperateReveal(linesContent.domNode, true, false)));
            this._register(dom.addDisposableListener(overflowGuardDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(overflowGuardDomNode.domNode, true, false)));
            this._register(dom.addDisposableListener(this.scrollbarDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(this.scrollbarDomNode.domNode, true, false)));
        }
        dispose() {
            super.dispose();
        }
        _setLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.scrollbarDomNode.setLeft(layoutInfo.contentLeft);
            const minimap = options.get(73 /* EditorOption.minimap */);
            const side = minimap.side;
            if (side === 'right') {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth + layoutInfo.minimap.minimapWidth);
            }
            else {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth);
            }
            this.scrollbarDomNode.setHeight(layoutInfo.height);
        }
        getOverviewRulerLayoutInfo() {
            return this.scrollbar.getOverviewRulerLayoutInfo();
        }
        getDomNode() {
            return this.scrollbarDomNode;
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this.scrollbar.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this.scrollbar.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(103 /* EditorOption.scrollbar */)
                || e.hasChanged(75 /* EditorOption.mouseWheelScrollSensitivity */)
                || e.hasChanged(40 /* EditorOption.fastScrollSensitivity */)) {
                const options = this._context.configuration.options;
                const scrollbar = options.get(103 /* EditorOption.scrollbar */);
                const mouseWheelScrollSensitivity = options.get(75 /* EditorOption.mouseWheelScrollSensitivity */);
                const fastScrollSensitivity = options.get(40 /* EditorOption.fastScrollSensitivity */);
                const scrollPredominantAxis = options.get(106 /* EditorOption.scrollPredominantAxis */);
                const newOpts = {
                    vertical: scrollbar.vertical,
                    horizontal: scrollbar.horizontal,
                    verticalScrollbarSize: scrollbar.verticalScrollbarSize,
                    horizontalScrollbarSize: scrollbar.horizontalScrollbarSize,
                    scrollByPage: scrollbar.scrollByPage,
                    handleMouseWheel: scrollbar.handleMouseWheel,
                    mouseWheelScrollSensitivity: mouseWheelScrollSensitivity,
                    fastScrollSensitivity: fastScrollSensitivity,
                    scrollPredominantAxis: scrollPredominantAxis
                };
                this.scrollbar.updateOptions(newOpts);
            }
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                this._setLayout();
            }
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onThemeChanged(e) {
            this.scrollbar.updateClassName('editor-scrollable' + ' ' + (0, themeService_1.getThemeTypeSelector)(this._context.theme.type));
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to do
        }
        render(ctx) {
            this.scrollbar.renderNow();
        }
    }
    exports.EditorScrollbar = EditorScrollbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2Nyb2xsYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvZWRpdG9yU2Nyb2xsYmFyL2VkaXRvclNjcm9sbGJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxlQUFnQixTQUFRLG1CQUFRO1FBSzVDLFlBQ0MsT0FBb0IsRUFDcEIsWUFBc0MsRUFDdEMsV0FBcUMsRUFDckMsb0JBQThDO1lBRTlDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUdmLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBd0IsQ0FBQztZQUN0RCxNQUFNLDJCQUEyQixHQUFHLE9BQU8sQ0FBQyxHQUFHLG1EQUEwQyxDQUFDO1lBQzFGLE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLEdBQUcsNkNBQW9DLENBQUM7WUFDOUUsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyw4Q0FBb0MsQ0FBQztZQUU5RSxNQUFNLGdCQUFnQixHQUFxQztnQkFDMUQsZUFBZSxFQUFFLFdBQVcsQ0FBQyxPQUFPO2dCQUNwQyxTQUFTLEVBQUUsbUJBQW1CLEdBQUcsR0FBRyxHQUFHLElBQUEsbUNBQW9CLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQy9FLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixVQUFVLEVBQUUsSUFBSTtnQkFFaEIsUUFBUSxFQUFFLFNBQVMsQ0FBQyxRQUFRO2dCQUM1QixVQUFVLEVBQUUsU0FBUyxDQUFDLFVBQVU7Z0JBQ2hDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxpQkFBaUI7Z0JBQzlDLG1CQUFt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
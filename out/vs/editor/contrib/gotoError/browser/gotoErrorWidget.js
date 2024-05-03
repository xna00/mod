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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/platform/severityIcon/browser/severityIcon", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./media/gotoErrorWidget"], function (require, exports, dom, scrollableElement_1, arrays_1, color_1, event_1, lifecycle_1, resources_1, strings_1, range_1, peekView_1, nls, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, label_1, markers_1, opener_1, severityIcon_1, colorRegistry_1, themeService_1) {
    "use strict";
    var MarkerNavigationWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerNavigationWidget = void 0;
    class MessageWidget {
        constructor(parent, editor, onRelatedInformation, _openerService, _labelService) {
            this._openerService = _openerService;
            this._labelService = _labelService;
            this._lines = 0;
            this._longestLineLength = 0;
            this._relatedDiagnostics = new WeakMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._editor = editor;
            const domNode = document.createElement('div');
            domNode.className = 'descriptioncontainer';
            this._messageBlock = document.createElement('div');
            this._messageBlock.classList.add('message');
            this._messageBlock.setAttribute('aria-live', 'assertive');
            this._messageBlock.setAttribute('role', 'alert');
            domNode.appendChild(this._messageBlock);
            this._relatedBlock = document.createElement('div');
            domNode.appendChild(this._relatedBlock);
            this._disposables.add(dom.addStandardDisposableListener(this._relatedBlock, 'click', event => {
                event.preventDefault();
                const related = this._relatedDiagnostics.get(event.target);
                if (related) {
                    onRelatedInformation(related);
                }
            }));
            this._scrollable = new scrollableElement_1.ScrollableElement(domNode, {
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                vertical: 1 /* ScrollbarVisibility.Auto */,
                useShadows: false,
                horizontalScrollbarSize: 6,
                verticalScrollbarSize: 6
            });
            parent.appendChild(this._scrollable.getDomNode());
            this._disposables.add(this._scrollable.onScroll(e => {
                domNode.style.left = `-${e.scrollLeft}px`;
                domNode.style.top = `-${e.scrollTop}px`;
            }));
            this._disposables.add(this._scrollable);
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._disposables);
        }
        update(marker) {
            const { source, message, relatedInformation, code } = marker;
            let sourceAndCodeLength = (source?.length || 0) + '()'.length;
            if (code) {
                if (typeof code === 'string') {
                    sourceAndCodeLength += code.length;
                }
                else {
                    sourceAndCodeLength += code.value.length;
                }
            }
            const lines = (0, strings_1.splitLines)(message);
            this._lines = lines.length;
            this._longestLineLength = 0;
            for (const line of lines) {
                this._longestLineLength = Math.max(line.length + sourceAndCodeLength, this._longestLineLength);
            }
            dom.clearNode(this._messageBlock);
            this._messageBlock.setAttribute('aria-label', this.getAriaLabel(marker));
            this._editor.applyFontInfo(this._messageBlock);
            let lastLineElement = this._messageBlock;
            for (const line of lines) {
                lastLineElement = document.createElement('div');
                lastLineElement.innerText = line;
                if (line === '') {
                    lastLineElement.style.height = this._messageBlock.style.lineHeight;
                }
                this._messageBlock.appendChild(lastLineElement);
            }
            if (source || code) {
                const detailsElement = document.createElement('span');
                detailsElement.classList.add('details');
                lastLineElement.appendChild(detailsElement);
                if (source) {
                    const sourceElement = document.createElement('span');
                    sourceElement.innerText = source;
                    sourceElement.classList.add('source');
                    detailsElement.appendChild(sourceElement);
                }
                if (code) {
                    if (typeof code === 'string') {
                        const codeElement = document.createElement('span');
                        codeElement.innerText = `(${code})`;
                        codeElement.classList.add('code');
                        detailsElement.appendChild(codeElement);
                    }
                    else {
                        this._codeLink = dom.$('a.code-link');
                        this._codeLink.setAttribute('href', `${code.target.toString()}`);
                        this._codeLink.onclick = (e) => {
                            this._openerService.open(code.target, { allowCommands: true });
                            e.preventDefault();
                            e.stopPropagation();
                        };
                        const codeElement = dom.append(this._codeLink, dom.$('span'));
                        codeElement.innerText = code.value;
                        detailsElement.appendChild(this._codeLink);
                    }
                }
            }
            dom.clearNode(this._relatedBlock);
            this._editor.applyFontInfo(this._relatedBlock);
            if ((0, arrays_1.isNonEmptyArray)(relatedInformation)) {
                const relatedInformationNode = this._relatedBlock.appendChild(document.createElement('div'));
                relatedInformationNode.style.paddingTop = `${Math.floor(this._editor.getOption(67 /* EditorOption.lineHeight */) * 0.66)}px`;
                this._lines += 1;
                for (const related of relatedInformation) {
                    const container = document.createElement('div');
                    const relatedResource = document.createElement('a');
                    relatedResource.classList.add('filename');
                    relatedResource.innerText = `${this._labelService.getUriBasenameLabel(related.resource)}(${related.startLineNumber}, ${related.startColumn}): `;
                    relatedResource.title = this._labelService.getUriLabel(related.resource);
                    this._relatedDiagnostics.set(relatedResource, related);
                    const relatedMessage = document.createElement('span');
                    relatedMessage.innerText = related.message;
                    container.appendChild(relatedResource);
                    container.appendChild(relatedMessage);
                    this._lines += 1;
                    relatedInformationNode.appendChild(container);
                }
            }
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            const scrollWidth = Math.ceil(fontInfo.typicalFullwidthCharacterWidth * this._longestLineLength * 0.75);
            const scrollHeight = fontInfo.lineHeight * this._lines;
            this._scrollable.setScrollDimensions({ scrollWidth, scrollHeight });
        }
        layout(height, width) {
            this._scrollable.getDomNode().style.height = `${height}px`;
            this._scrollable.getDomNode().style.width = `${width}px`;
            this._scrollable.setScrollDimensions({ width, height });
        }
        getHeightInLines() {
            return Math.min(17, this._lines);
        }
        getAriaLabel(marker) {
            let severityLabel = '';
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Error:
                    severityLabel = nls.localize('Error', "Error");
                    break;
                case markers_1.MarkerSeverity.Warning:
                    severityLabel = nls.localize('Warning', "Warning");
                    break;
                case markers_1.MarkerSeverity.Info:
                    severityLabel = nls.localize('Info', "Info");
                    break;
                case markers_1.MarkerSeverity.Hint:
                    severityLabel = nls.localize('Hint', "Hint");
                    break;
            }
            let ariaLabel = nls.localize('marker aria', "{0} at {1}. ", severityLabel, marker.startLineNumber + ':' + marker.startColumn);
            const model = this._editor.getModel();
            if (model && (marker.startLineNumber <= model.getLineCount()) && (marker.startLineNumber >= 1)) {
                const lineContent = model.getLineContent(marker.startLineNumber);
                ariaLabel = `${lineContent}, ${ariaLabel}`;
            }
            return ariaLabel;
        }
    }
    let MarkerNavigationWidget = class MarkerNavigationWidget extends peekView_1.PeekViewWidget {
        static { MarkerNavigationWidget_1 = this; }
        static { this.TitleMenu = new actions_1.MenuId('gotoErrorTitleMenu'); }
        constructor(editor, _themeService, _openerService, _menuService, instantiationService, _contextKeyService, _labelService) {
            super(editor, { showArrow: true, showFrame: true, isAccessible: true, frameWidth: 1 }, instantiationService);
            this._themeService = _themeService;
            this._openerService = _openerService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._labelService = _labelService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectRelatedInformation = new event_1.Emitter();
            this.onDidSelectRelatedInformation = this._onDidSelectRelatedInformation.event;
            this._severity = markers_1.MarkerSeverity.Warning;
            this._backgroundColor = color_1.Color.white;
            this._applyTheme(_themeService.getColorTheme());
            this._callOnDispose.add(_themeService.onDidColorThemeChange(this._applyTheme.bind(this)));
            this.create();
        }
        _applyTheme(theme) {
            this._backgroundColor = theme.getColor(editorMarkerNavigationBackground);
            let colorId = editorMarkerNavigationError;
            let headerBackground = editorMarkerNavigationErrorHeader;
            if (this._severity === markers_1.MarkerSeverity.Warning) {
                colorId = editorMarkerNavigationWarning;
                headerBackground = editorMarkerNavigationWarningHeader;
            }
            else if (this._severity === markers_1.MarkerSeverity.Info) {
                colorId = editorMarkerNavigationInfo;
                headerBackground = editorMarkerNavigationInfoHeader;
            }
            const frameColor = theme.getColor(colorId);
            const headerBg = theme.getColor(headerBackground);
            this.style({
                arrowColor: frameColor,
                frameColor: frameColor,
                headerBackgroundColor: headerBg,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            }); // style() will trigger _applyStyles
        }
        _applyStyles() {
            if (this._parentContainer) {
                this._parentContainer.style.backgroundColor = this._backgroundColor ? this._backgroundColor.toString() : '';
            }
            super._applyStyles();
        }
        dispose() {
            this._callOnDispose.dispose();
            super.dispose();
        }
        focus() {
            this._parentContainer.focus();
        }
        _fillHead(container) {
            super._fillHead(container);
            this._disposables.add(this._actionbarWidget.actionRunner.onWillRun(e => this.editor.focus()));
            const actions = [];
            const menu = this._menuService.createMenu(MarkerNavigationWidget_1.TitleMenu, this._contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            this._actionbarWidget.push(actions, { label: false, icon: true, index: 0 });
            menu.dispose();
        }
        _fillTitleIcon(container) {
            this._icon = dom.append(container, dom.$(''));
        }
        _fillBody(container) {
            this._parentContainer = container;
            container.classList.add('marker-widget');
            this._parentContainer.tabIndex = 0;
            this._parentContainer.setAttribute('role', 'tooltip');
            this._container = document.createElement('div');
            container.appendChild(this._container);
            this._message = new MessageWidget(this._container, this.editor, related => this._onDidSelectRelatedInformation.fire(related), this._openerService, this._labelService);
            this._disposables.add(this._message);
        }
        show() {
            throw new Error('call showAtMarker');
        }
        showAtMarker(marker, markerIdx, markerCount) {
            // update:
            // * title
            // * message
            this._container.classList.remove('stale');
            this._message.update(marker);
            // update frame color (only applied on 'show')
            this._severity = marker.severity;
            this._applyTheme(this._themeService.getColorTheme());
            // show
            const range = range_1.Range.lift(marker);
            const editorPosition = this.editor.getPosition();
            const position = editorPosition && range.containsPosition(editorPosition) ? editorPosition : range.getStartPosition();
            super.show(position, this.computeRequiredHeight());
            const model = this.editor.getModel();
            if (model) {
                const detail = markerCount > 1
                    ? nls.localize('problems', "{0} of {1} problems", markerIdx, markerCount)
                    : nls.localize('change', "{0} of {1} problem", markerIdx, markerCount);
                this.setTitle((0, resources_1.basename)(model.uri), detail);
            }
            this._icon.className = `codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(this._severity))}`;
            this.editor.revealPositionNearTop(position, 0 /* ScrollType.Smooth */);
            this.editor.focus();
        }
        updateMarker(marker) {
            this._container.classList.remove('stale');
            this._message.update(marker);
        }
        showStale() {
            this._container.classList.add('stale');
            this._relayout();
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._heightInPixel = heightInPixel;
            this._message.layout(heightInPixel, widthInPixel);
            this._container.style.height = `${heightInPixel}px`;
        }
        _onWidth(widthInPixel) {
            this._message.layout(this._heightInPixel, widthInPixel);
        }
        _relayout() {
            super._relayout(this.computeRequiredHeight());
        }
        computeRequiredHeight() {
            return 3 + this._message.getHeightInLines();
        }
    };
    exports.MarkerNavigationWidget = MarkerNavigationWidget;
    exports.MarkerNavigationWidget = MarkerNavigationWidget = MarkerNavigationWidget_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, opener_1.IOpenerService),
        __param(3, actions_1.IMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, label_1.ILabelService)
    ], MarkerNavigationWidget);
    // theming
    const errorDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorErrorForeground, colorRegistry_1.editorErrorBorder);
    const warningDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorWarningForeground, colorRegistry_1.editorWarningBorder);
    const infoDefault = (0, colorRegistry_1.oneOf)(colorRegistry_1.editorInfoForeground, colorRegistry_1.editorInfoBorder);
    const editorMarkerNavigationError = (0, colorRegistry_1.registerColor)('editorMarkerNavigationError.background', { dark: errorDefault, light: errorDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationError', 'Editor marker navigation widget error color.'));
    const editorMarkerNavigationErrorHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationError.headerBackground', { dark: (0, colorRegistry_1.transparent)(editorMarkerNavigationError, .1), light: (0, colorRegistry_1.transparent)(editorMarkerNavigationError, .1), hcDark: null, hcLight: null }, nls.localize('editorMarkerNavigationErrorHeaderBackground', 'Editor marker navigation widget error heading background.'));
    const editorMarkerNavigationWarning = (0, colorRegistry_1.registerColor)('editorMarkerNavigationWarning.background', { dark: warningDefault, light: warningDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationWarning', 'Editor marker navigation widget warning color.'));
    const editorMarkerNavigationWarningHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationWarning.headerBackground', { dark: (0, colorRegistry_1.transparent)(editorMarkerNavigationWarning, .1), light: (0, colorRegistry_1.transparent)(editorMarkerNavigationWarning, .1), hcDark: '#0C141F', hcLight: (0, colorRegistry_1.transparent)(editorMarkerNavigationWarning, .2) }, nls.localize('editorMarkerNavigationWarningBackground', 'Editor marker navigation widget warning heading background.'));
    const editorMarkerNavigationInfo = (0, colorRegistry_1.registerColor)('editorMarkerNavigationInfo.background', { dark: infoDefault, light: infoDefault, hcDark: colorRegistry_1.contrastBorder, hcLight: colorRegistry_1.contrastBorder }, nls.localize('editorMarkerNavigationInfo', 'Editor marker navigation widget info color.'));
    const editorMarkerNavigationInfoHeader = (0, colorRegistry_1.registerColor)('editorMarkerNavigationInfo.headerBackground', { dark: (0, colorRegistry_1.transparent)(editorMarkerNavigationInfo, .1), light: (0, colorRegistry_1.transparent)(editorMarkerNavigationInfo, .1), hcDark: null, hcLight: null }, nls.localize('editorMarkerNavigationInfoHeaderBackground', 'Editor marker navigation widget info heading background.'));
    const editorMarkerNavigationBackground = (0, colorRegistry_1.registerColor)('editorMarkerNavigation.background', { dark: colorRegistry_1.editorBackground, light: colorRegistry_1.editorBackground, hcDark: colorRegistry_1.editorBackground, hcLight: colorRegistry_1.editorBackground }, nls.localize('editorMarkerNavigationBackground', 'Editor marker navigation widget background.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b0Vycm9yV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9nb3RvRXJyb3IvYnJvd3Nlci9nb3RvRXJyb3JXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThCaEcsTUFBTSxhQUFhO1FBY2xCLFlBQ0MsTUFBbUIsRUFDbkIsTUFBbUIsRUFDbkIsb0JBQTRELEVBQzNDLGNBQThCLEVBQzlCLGFBQTRCO1lBRDVCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQWpCdEMsV0FBTSxHQUFXLENBQUMsQ0FBQztZQUNuQix1QkFBa0IsR0FBVyxDQUFDLENBQUM7WUFNdEIsd0JBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQW9DLENBQUM7WUFDdEUsaUJBQVksR0FBb0IsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFXdEUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxPQUFPLENBQUMsU0FBUyxHQUFHLHNCQUFzQixDQUFDO1lBRTNDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzFELElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNqRCxPQUFPLENBQUMsV0FBVyxD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
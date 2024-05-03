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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/workbench/contrib/debug/common/debug", "vs/base/common/async", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/debug/browser/linkDetector", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/platform/theme/common/iconRegistry", "vs/css!./media/exceptionWidget"], function (require, exports, nls, dom, zoneWidget_1, debug_1, async_1, themeService_1, themables_1, colorRegistry_1, instantiation_1, linkDetector_1, actionbar_1, actions_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExceptionWidget = void 0;
    const $ = dom.$;
    // theming
    const debugExceptionWidgetBorder = (0, colorRegistry_1.registerColor)('debugExceptionWidget.border', { dark: '#a31515', light: '#a31515', hcDark: '#a31515', hcLight: '#a31515' }, nls.localize('debugExceptionWidgetBorder', 'Exception widget border color.'));
    const debugExceptionWidgetBackground = (0, colorRegistry_1.registerColor)('debugExceptionWidget.background', { dark: '#420b0d', light: '#f1dfde', hcDark: '#420b0d', hcLight: '#f1dfde' }, nls.localize('debugExceptionWidgetBackground', 'Exception widget background color.'));
    let ExceptionWidget = class ExceptionWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, exceptionInfo, debugSession, themeService, instantiationService) {
            super(editor, { showFrame: true, showArrow: true, isAccessible: true, frameWidth: 1, className: 'exception-widget-container' });
            this.exceptionInfo = exceptionInfo;
            this.debugSession = debugSession;
            this.instantiationService = instantiationService;
            this.applyTheme(themeService.getColorTheme());
            this._disposables.add(themeService.onDidColorThemeChange(this.applyTheme.bind(this)));
            this.create();
            const onDidLayoutChangeScheduler = new async_1.RunOnceScheduler(() => this._doLayout(undefined, undefined), 50);
            this._disposables.add(this.editor.onDidLayoutChange(() => onDidLayoutChangeScheduler.schedule()));
            this._disposables.add(onDidLayoutChangeScheduler);
        }
        applyTheme(theme) {
            this.backgroundColor = theme.getColor(debugExceptionWidgetBackground);
            const frameColor = theme.getColor(debugExceptionWidgetBorder);
            this.style({
                arrowColor: frameColor,
                frameColor: frameColor
            }); // style() will trigger _applyStyles
        }
        _applyStyles() {
            if (this.container) {
                this.container.style.backgroundColor = this.backgroundColor ? this.backgroundColor.toString() : '';
            }
            super._applyStyles();
        }
        _fillContainer(container) {
            this.setCssClass('exception-widget');
            // Set the font size and line height to the one from the editor configuration.
            const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            container.style.fontSize = `${fontInfo.fontSize}px`;
            container.style.lineHeight = `${fontInfo.lineHeight}px`;
            container.tabIndex = 0;
            const title = $('.title');
            const label = $('.label');
            dom.append(title, label);
            const actions = $('.actions');
            dom.append(title, actions);
            label.textContent = this.exceptionInfo.id ? nls.localize('exceptionThrownWithId', 'Exception has occurred: {0}', this.exceptionInfo.id) : nls.localize('exceptionThrown', 'Exception has occurred.');
            let ariaLabel = label.textContent;
            const actionBar = new actionbar_1.ActionBar(actions);
            actionBar.push(new actions_1.Action('editor.closeExceptionWidget', nls.localize('close', "Close"), themables_1.ThemeIcon.asClassName(iconRegistry_1.widgetClose), true, async () => {
                const contribution = this.editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID);
                contribution?.closeExceptionWidget();
            }), { label: false, icon: true });
            dom.append(container, title);
            if (this.exceptionInfo.description) {
                const description = $('.description');
                description.textContent = this.exceptionInfo.description;
                ariaLabel += ', ' + this.exceptionInfo.description;
                dom.append(container, description);
            }
            if (this.exceptionInfo.details && this.exceptionInfo.details.stackTrace) {
                const stackTrace = $('.stack-trace');
                const linkDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
                const linkedStackTrace = linkDetector.linkify(this.exceptionInfo.details.stackTrace, true, this.debugSession ? this.debugSession.root : undefined);
                stackTrace.appendChild(linkedStackTrace);
                dom.append(container, stackTrace);
                ariaLabel += ', ' + this.exceptionInfo.details.stackTrace;
            }
            container.setAttribute('aria-label', ariaLabel);
        }
        _doLayout(_heightInPixel, _widthInPixel) {
            // Reload the height with respect to the exception text content and relayout it to match the line count.
            this.container.style.height = 'initial';
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const arrowHeight = Math.round(lineHeight / 3);
            const computedLinesNumber = Math.ceil((this.container.offsetHeight + arrowHeight) / lineHeight);
            this._relayout(computedLinesNumber);
        }
        focus() {
            // Focus into the container for accessibility purposes so the exception and stack trace gets read
            this.container?.focus();
        }
        hasFocus() {
            if (!this.container) {
                return false;
            }
            return dom.isAncestorOfActiveElement(this.container);
        }
    };
    exports.ExceptionWidget = ExceptionWidget;
    exports.ExceptionWidget = ExceptionWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService)
    ], ExceptionWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZXB0aW9uV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2V4Y2VwdGlvbldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsVUFBVTtJQUVWLE1BQU0sMEJBQTBCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLDZCQUE2QixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0lBQzVPLE1BQU0sOEJBQThCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGlDQUFpQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0NBQWdDLEVBQUUsb0NBQW9DLENBQUMsQ0FBQyxDQUFDO0lBRXJQLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsdUJBQVU7UUFJOUMsWUFDQyxNQUFtQixFQUNYLGFBQTZCLEVBQzdCLFlBQXVDLEVBQ2hDLFlBQTJCLEVBQ0Ysb0JBQTJDO1lBRW5GLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFB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
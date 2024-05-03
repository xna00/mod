/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls"], function (require, exports, dom, async_1, cancellation_1, htmlContent_1, iconLabels_1, lifecycle_1, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupNativeHover = setupNativeHover;
    exports.setupCustomHover = setupCustomHover;
    function setupNativeHover(htmlElement, tooltip) {
        if ((0, types_1.isString)(tooltip)) {
            // Icons don't render in the native hover so we strip them out
            htmlElement.title = (0, iconLabels_1.stripIcons)(tooltip);
        }
        else if (tooltip?.markdownNotSupportedFallback) {
            htmlElement.title = tooltip.markdownNotSupportedFallback;
        }
        else {
            htmlElement.removeAttribute('title');
        }
    }
    class UpdatableHoverWidget {
        constructor(hoverDelegate, target, fadeInAnimation) {
            this.hoverDelegate = hoverDelegate;
            this.target = target;
            this.fadeInAnimation = fadeInAnimation;
        }
        async update(content, focus, options) {
            if (this._cancellationTokenSource) {
                // there's an computation ongoing, cancel it
                this._cancellationTokenSource.dispose(true);
                this._cancellationTokenSource = undefined;
            }
            if (this.isDisposed) {
                return;
            }
            let resolvedContent;
            if (content === undefined || (0, types_1.isString)(content) || content instanceof HTMLElement) {
                resolvedContent = content;
            }
            else if (!(0, types_1.isFunction)(content.markdown)) {
                resolvedContent = content.markdown ?? content.markdownNotSupportedFallback;
            }
            else {
                // compute the content, potentially long-running
                // show 'Loading' if no hover is up yet
                if (!this._hoverWidget) {
                    this.show((0, nls_1.localize)('iconLabel.loading', "Loading..."), focus);
                }
                // compute the content
                this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                const token = this._cancellationTokenSource.token;
                resolvedContent = await content.markdown(token);
                if (resolvedContent === undefined) {
                    resolvedContent = content.markdownNotSupportedFallback;
                }
                if (this.isDisposed || token.isCancellationRequested) {
                    // either the widget has been closed in the meantime
                    // or there has been a new call to `update`
                    return;
                }
            }
            this.show(resolvedContent, focus, options);
        }
        show(content, focus, options) {
            const oldHoverWidget = this._hoverWidget;
            if (this.hasContent(content)) {
                const hoverOptions = {
                    content,
                    target: this.target,
                    appearance: {
                        showPointer: this.hoverDelegate.placement === 'element',
                        skipFadeInAnimation: !this.fadeInAnimation || !!oldHoverWidget, // do not fade in if the hover is already showing
                    },
                    position: {
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                    },
                    ...options
                };
                this._hoverWidget = this.hoverDelegate.showHover(hoverOptions, focus);
            }
            oldHoverWidget?.dispose();
        }
        hasContent(content) {
            if (!content) {
                return false;
            }
            if ((0, htmlContent_1.isMarkdownString)(content)) {
                return !!content.value;
            }
            return true;
        }
        get isDisposed() {
            return this._hoverWidget?.isDisposed;
        }
        dispose() {
            this._hoverWidget?.dispose();
            this._cancellationTokenSource?.dispose(true);
            this._cancellationTokenSource = undefined;
        }
    }
    function getHoverTargetElement(element, stopElement) {
        stopElement = stopElement ?? dom.getWindow(element).document.body;
        while (!element.hasAttribute('custom-hover') && element !== stopElement) {
            element = element.parentElement;
        }
        return element;
    }
    function setupCustomHover(hoverDelegate, htmlElement, content, options) {
        htmlElement.setAttribute('custom-hover', 'true');
        if (htmlElement.title !== '') {
            console.warn('HTML element already has a title attribute, which will conflict with the custom hover. Please remove the title attribute.');
            console.trace('Stack trace:', htmlElement.title);
            htmlElement.title = '';
        }
        let hoverPreparation;
        let hoverWidget;
        const hideHover = (disposeWidget, disposePreparation) => {
            const hadHover = hoverWidget !== undefined;
            if (disposeWidget) {
                hoverWidget?.dispose();
                hoverWidget = undefined;
            }
            if (disposePreparation) {
                hoverPreparation?.dispose();
                hoverPreparation = undefined;
            }
            if (hadHover) {
                hoverDelegate.onDidHideHover?.();
                hoverWidget = undefined;
            }
        };
        const triggerShowHover = (delay, focus, target) => {
            return new async_1.TimeoutTimer(async () => {
                if (!hoverWidget || hoverWidget.isDisposed) {
                    hoverWidget = new UpdatableHoverWidget(hoverDelegate, target || htmlElement, delay > 0);
                    await hoverWidget.update(typeof content === 'function' ? content() : content, focus, options);
                }
            }, delay);
        };
        let isMouseDown = false;
        const mouseDownEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_DOWN, () => {
            isMouseDown = true;
            hideHover(true, true);
        }, true);
        const mouseUpEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_UP, () => {
            isMouseDown = false;
        }, true);
        const mouseLeaveEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_LEAVE, (e) => {
            isMouseDown = false;
            hideHover(false, e.fromElement === htmlElement);
        }, true);
        const onMouseOver = (e) => {
            if (hoverPreparation) {
                return;
            }
            const toDispose = new lifecycle_1.DisposableStore();
            const target = {
                targetElements: [htmlElement],
                dispose: () => { }
            };
            if (hoverDelegate.placement === undefined || hoverDelegate.placement === 'mouse') {
                // track the mouse position
                const onMouseMove = (e) => {
                    target.x = e.x + 10;
                    if ((e.target instanceof HTMLElement) && getHoverTargetElement(e.target, htmlElement) !== htmlElement) {
                        hideHover(true, true);
                    }
                };
                toDispose.add(dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_MOVE, onMouseMove, true));
            }
            hoverPreparation = toDispose;
            if ((e.target instanceof HTMLElement) && getHoverTargetElement(e.target, htmlElement) !== htmlElement) {
                return; // Do not show hover when the mouse is over another hover target
            }
            toDispose.add(triggerShowHover(hoverDelegate.delay, false, target));
        };
        const mouseOverDomEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_OVER, onMouseOver, true);
        const onFocus = () => {
            if (isMouseDown || hoverPreparation) {
                return;
            }
            const target = {
                targetElements: [htmlElement],
                dispose: () => { }
            };
            const toDispose = new lifecycle_1.DisposableStore();
            const onBlur = () => hideHover(true, true);
            toDispose.add(dom.addDisposableListener(htmlElement, dom.EventType.BLUR, onBlur, true));
            toDispose.add(triggerShowHover(hoverDelegate.delay, false, target));
            hoverPreparation = toDispose;
        };
        // Do not show hover when focusing an input or textarea
        let focusDomEmitter;
        const tagName = htmlElement.tagName.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea') {
            focusDomEmitter = dom.addDisposableListener(htmlElement, dom.EventType.FOCUS, onFocus, true);
        }
        const hover = {
            show: focus => {
                hideHover(false, true); // terminate a ongoing mouse over preparation
                triggerShowHover(0, focus); // show hover immediately
            },
            hide: () => {
                hideHover(true, true);
            },
            update: async (newContent, hoverOptions) => {
                content = newContent;
                await hoverWidget?.update(content, undefined, hoverOptions);
            },
            dispose: () => {
                mouseOverDomEmitter.dispose();
                mouseLeaveEmitter.dispose();
                mouseDownEmitter.dispose();
                mouseUpEmitter.dispose();
                focusDomEmitter?.dispose();
                hideHover(true, true);
            }
        };
        return hover;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRhYmxlSG92ZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9ob3Zlci91cGRhdGFibGVIb3ZlcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsNENBU0M7SUFrSkQsNENBOEhDO0lBelJELFNBQWdCLGdCQUFnQixDQUFDLFdBQXdCLEVBQUUsT0FBb0Q7UUFDOUcsSUFBSSxJQUFBLGdCQUFRLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN2Qiw4REFBOEQ7WUFDOUQsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDekMsQ0FBQzthQUFNLElBQUksT0FBTyxFQUFFLDRCQUE0QixFQUFFLENBQUM7WUFDbEQsV0FBVyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUM7UUFDMUQsQ0FBQzthQUFNLENBQUM7WUFDUCxXQUFXLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDRixDQUFDO0lBNENELE1BQU0sb0JBQW9CO1FBS3pCLFlBQW9CLGFBQTZCLEVBQVUsTUFBMEMsRUFBVSxlQUF3QjtZQUFuSCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFvQztZQUFVLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBQ3ZJLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQXNCLEVBQUUsS0FBZSxFQUFFLE9BQWdDO1lBQ3JGLElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ25DLDRDQUE0QztnQkFDNUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFB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
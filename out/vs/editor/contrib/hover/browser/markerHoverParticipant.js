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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/markerDecorations", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/contrib/codeAction/common/types", "vs/editor/contrib/gotoError/browser/gotoError", "vs/nls", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress"], function (require, exports, dom, arrays_1, async_1, errors_1, lifecycle_1, resources_1, range_1, languageFeatures_1, markerDecorations_1, codeAction_1, codeActionController_1, types_1, gotoError_1, nls, markers_1, opener_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerHoverParticipant = exports.MarkerHover = void 0;
    const $ = dom.$;
    class MarkerHover {
        constructor(owner, range, marker) {
            this.owner = owner;
            this.range = range;
            this.marker = marker;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.MarkerHover = MarkerHover;
    const markerCodeActionTrigger = {
        type: 1 /* CodeActionTriggerType.Invoke */,
        filter: { include: types_1.CodeActionKind.QuickFix },
        triggerAction: types_1.CodeActionTriggerSource.QuickFixHover
    };
    let MarkerHoverParticipant = class MarkerHoverParticipant {
        constructor(_editor, _markerDecorationsService, _openerService, _languageFeaturesService) {
            this._editor = _editor;
            this._markerDecorationsService = _markerDecorationsService;
            this._openerService = _openerService;
            this._languageFeaturesService = _languageFeaturesService;
            this.hoverOrdinal = 1;
            this.recentMarkerCodeActionsInfo = undefined;
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */ && !anchor.supportsMarkerHover) {
                return [];
            }
            const model = this._editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            const result = [];
            for (const d of lineDecorations) {
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                const marker = this._markerDecorationsService.getMarker(model.uri, d);
                if (!marker) {
                    continue;
                }
                const range = new range_1.Range(anchor.range.startLineNumber, startColumn, anchor.range.startLineNumber, endColumn);
                result.push(new MarkerHover(this, range, marker));
            }
            return result;
        }
        renderHoverParts(context, hoverParts) {
            if (!hoverParts.length) {
                return lifecycle_1.Disposable.None;
            }
            const disposables = new lifecycle_1.DisposableStore();
            hoverParts.forEach(msg => context.fragment.appendChild(this.renderMarkerHover(msg, disposables)));
            const markerHoverForStatusbar = hoverParts.length === 1 ? hoverParts[0] : hoverParts.sort((a, b) => markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity))[0];
            this.renderMarkerStatusbar(context, markerHoverForStatusbar, disposables);
            return disposables;
        }
        renderMarkerHover(markerHover, disposables) {
            const hoverElement = $('div.hover-row');
            const markerElement = dom.append(hoverElement, $('div.marker.hover-contents'));
            const { source, message, code, relatedInformation } = markerHover.marker;
            this._editor.applyFontInfo(markerElement);
            const messageElement = dom.append(markerElement, $('span'));
            messageElement.style.whiteSpace = 'pre-wrap';
            messageElement.innerText = message;
            if (source || code) {
                // Code has link
                if (code && typeof code !== 'string') {
                    const sourceAndCodeElement = $('span');
                    if (source) {
                        const sourceElement = dom.append(sourceAndCodeElement, $('span'));
                        sourceElement.innerText = source;
                    }
                    const codeLink = dom.append(sourceAndCodeElement, $('a.code-link'));
                    codeLink.setAttribute('href', code.target.toString());
                    disposables.add(dom.addDisposableListener(codeLink, 'click', (e) => {
                        this._openerService.open(code.target, { allowCommands: true });
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                    const codeElement = dom.append(codeLink, $('span'));
                    codeElement.innerText = code.value;
                    const detailsElement = dom.append(markerElement, sourceAndCodeElement);
                    detailsElement.style.opacity = '0.6';
                    detailsElement.style.paddingLeft = '6px';
                }
                else {
                    const detailsElement = dom.append(markerElement, $('span'));
                    detailsElement.style.opacity = '0.6';
                    detailsElement.style.paddingLeft = '6px';
                    detailsElement.innerText = source && code ? `${source}(${code})` : source ? source : `(${code})`;
                }
            }
            if ((0, arrays_1.isNonEmptyArray)(relatedInformation)) {
                for (const { message, resource, startLineNumber, startColumn } of relatedInformation) {
                    const relatedInfoContainer = dom.append(markerElement, $('div'));
                    relatedInfoContainer.style.marginTop = '8px';
                    const a = dom.append(relatedInfoContainer, $('a'));
                    a.innerText = `${(0, resources_1.basename)(resource)}(${startLineNumber}, ${startColumn}): `;
                    a.style.cursor = 'pointer';
                    disposables.add(dom.addDisposableListener(a, 'click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (this._openerService) {
                            this._openerService.open(resource, {
                                fromUserGesture: true,
                                editorOptions: { selection: { startLineNumber, startColumn } }
                            }).catch(errors_1.onUnexpectedError);
                        }
                    }));
                    const messageElement = dom.append(relatedInfoContainer, $('span'));
                    messageElement.innerText = message;
                    this._editor.applyFontInfo(messageElement);
                }
            }
            return hoverElement;
        }
        renderMarkerStatusbar(context, markerHover, disposables) {
            if (markerHover.marker.severity === markers_1.MarkerSeverity.Error || markerHover.marker.severity === markers_1.MarkerSeverity.Warning || markerHover.marker.severity === markers_1.MarkerSeverity.Info) {
                const markerController = gotoError_1.MarkerController.get(this._editor);
                if (markerController) {
                    context.statusBar.addAction({
                        label: nls.localize('view problem', "View Problem"),
                        commandId: gotoError_1.NextMarkerAction.ID,
                        run: () => {
                            context.hide();
                            markerController.showAtMarker(markerHover.marker);
                            this._editor.focus();
                        }
                    });
                }
            }
            if (!this._editor.getOption(91 /* EditorOption.readOnly */)) {
                const quickfixPlaceholderElement = context.statusBar.append($('div'));
                if (this.recentMarkerCodeActionsInfo) {
                    if (markers_1.IMarkerData.makeKey(this.recentMarkerCodeActionsInfo.marker) === markers_1.IMarkerData.makeKey(markerHover.marker)) {
                        if (!this.recentMarkerCodeActionsInfo.hasCodeActions) {
                            quickfixPlaceholderElement.textContent = nls.localize('noQuickFixes', "No quick fixes available");
                        }
                    }
                    else {
                        this.recentMarkerCodeActionsInfo = undefined;
                    }
                }
                const updatePlaceholderDisposable = this.recentMarkerCodeActionsInfo && !this.recentMarkerCodeActionsInfo.hasCodeActions ? lifecycle_1.Disposable.None : (0, async_1.disposableTimeout)(() => quickfixPlaceholderElement.textContent = nls.localize('checkingForQuickFixes', "Checking for quick fixes..."), 200, disposables);
                if (!quickfixPlaceholderElement.textContent) {
                    // Have some content in here to avoid flickering
                    quickfixPlaceholderElement.textContent = String.fromCharCode(0xA0); // &nbsp;
                }
                const codeActionsPromise = this.getCodeActions(markerHover.marker);
                disposables.add((0, lifecycle_1.toDisposable)(() => codeActionsPromise.cancel()));
                codeActionsPromise.then(actions => {
                    updatePlaceholderDisposable.dispose();
                    this.recentMarkerCodeActionsInfo = { marker: markerHover.marker, hasCodeActions: actions.validActions.length > 0 };
                    if (!this.recentMarkerCodeActionsInfo.hasCodeActions) {
                        actions.dispose();
                        quickfixPlaceholderElement.textContent = nls.localize('noQuickFixes', "No quick fixes available");
                        return;
                    }
                    quickfixPlaceholderElement.style.display = 'none';
                    let showing = false;
                    disposables.add((0, lifecycle_1.toDisposable)(() => {
                        if (!showing) {
                            actions.dispose();
                        }
                    }));
                    context.statusBar.addAction({
                        label: nls.localize('quick fixes', "Quick Fix..."),
                        commandId: codeAction_1.quickFixCommandId,
                        run: (target) => {
                            showing = true;
                            const controller = codeActionController_1.CodeActionController.get(this._editor);
                            const elementPosition = dom.getDomNodePagePosition(target);
                            // Hide the hover pre-emptively, otherwise the editor can close the code actions
                            // context menu as well when using keyboard navigation
                            context.hide();
                            controller?.showCodeActions(markerCodeActionTrigger, actions, {
                                x: elementPosition.left,
                                y: elementPosition.top,
                                width: elementPosition.width,
                                height: elementPosition.height
                            });
                        }
                    });
                }, errors_1.onUnexpectedError);
            }
        }
        getCodeActions(marker) {
            return (0, async_1.createCancelablePromise)(cancellationToken => {
                return (0, codeAction_1.getCodeActions)(this._languageFeaturesService.codeActionProvider, this._editor.getModel(), new range_1.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn), markerCodeActionTrigger, progress_1.Progress.None, cancellationToken);
            });
        }
    };
    exports.MarkerHoverParticipant = MarkerHoverParticipant;
    exports.MarkerHoverParticipant = MarkerHoverParticipant = __decorate([
        __param(1, markerDecorations_1.IMarkerDecorationsService),
        __param(2, opener_1.IOpenerService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], MarkerHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VySG92ZXJQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9tYXJrZXJIb3ZlclBhcnRpY2lwYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixNQUFhLFdBQVc7UUFFdkIsWUFDaUIsS0FBMkMsRUFDM0MsS0FBWSxFQUNaLE1BQWU7WUFGZixVQUFLLEdBQUwsS0FBSyxDQUFzQztZQUMzQyxVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBUztRQUM1QixDQUFDO1FBRUUscUJBQXFCLENBQUMsTUFBbUI7WUFDL0MsT0FBTyxDQUNOLE1BQU0sQ0FBQyxJQUFJLGtDQUEwQjttQkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXO21CQUNsRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDakQsQ0FBQztRQUNILENBQUM7S0FDRDtJQWZELGtDQWVDO0lBRUQsTUFBTSx1QkFBdUIsR0FBc0I7UUFDbEQsSUFBSSxzQ0FBOEI7UUFDbEMsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLHNCQUFjLENBQUMsUUFBUSxFQUFFO1FBQzVDLGFBQWEsRUFBRSwrQkFBdUIsQ0FBQyxhQUFhO0tBQ3BELENBQUM7SUFFSyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQU1sQyxZQUNrQixPQUFvQixFQUNWLHlCQUFxRSxFQUNoRixjQUErQyxFQUNyQyx3QkFBbUU7WUFINUUsWUFBTyxHQUFQLE9BQU8sQ0FB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
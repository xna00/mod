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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry"], function (require, exports, dom, htmlContent_1, lifecycle_1, observable_1, range_1, language_1, hoverTypes_1, inlineCompletionsController_1, inlineCompletionsHintsWidget_1, markdownRenderer_1, nls, accessibility_1, instantiation_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsHoverParticipant = exports.InlineCompletionsHover = void 0;
    class InlineCompletionsHover {
        constructor(owner, range, controller) {
            this.owner = owner;
            this.range = range;
            this.controller = controller;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.InlineCompletionsHover = InlineCompletionsHover;
    let InlineCompletionsHoverParticipant = class InlineCompletionsHoverParticipant {
        constructor(_editor, _languageService, _openerService, accessibilityService, _instantiationService, _telemetryService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.accessibilityService = accessibilityService;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this.hoverOrdinal = 4;
        }
        suggestHoverAnchor(mouseEvent) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(this._editor);
            if (!controller) {
                return null;
            }
            const target = mouseEvent.target;
            if (target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                // handle the case where the mouse is over the view zone
                const viewZoneData = target.detail;
                if (controller.shouldShowHoverAtViewZone(viewZoneData.viewZoneId)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, range_1.Range.fromPositions(this._editor.getModel().validatePosition(viewZoneData.positionBefore || viewZoneData.position)), mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                // handle the case where the mouse is over the empty portion of a line following ghost text
                if (controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                // handle the case where the mouse is directly over ghost text
                const mightBeForeignElement = target.detail.mightBeForeignElement;
                if (mightBeForeignElement && controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            return null;
        }
        computeSync(anchor, lineDecorations) {
            if (this._editor.getOption(62 /* EditorOption.inlineSuggest */).showToolbar !== 'onHover') {
                return [];
            }
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(this._editor);
            if (controller && controller.shouldShowHoverAt(anchor.range)) {
                return [new InlineCompletionsHover(this, anchor.range, controller)];
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const part = hoverParts[0];
            this._telemetryService.publicLog2('inlineCompletionHover.shown');
            if (this.accessibilityService.isScreenReaderOptimized() && !this._editor.getOption(8 /* EditorOption.screenReaderAnnounceInlineSuggestion */)) {
                this.renderScreenReaderText(context, part, disposableStore);
            }
            const model = part.controller.model.get();
            const w = this._instantiationService.createInstance(inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget, this._editor, false, (0, observable_1.constObservable)(null), model.selectedInlineCompletionIndex, model.inlineCompletionsCount, model.selectedInlineCompletion.map(v => /** @description commands */ v?.inlineCompletion.source.inlineCompletions.commands ?? []));
            context.fragment.appendChild(w.getDomNode());
            model.triggerExplicitly();
            disposableStore.add(w);
            return disposableStore;
        }
        renderScreenReaderText(context, part, disposableStore) {
            const $ = dom.$;
            const markdownHoverElement = $('div.hover-row.markdown-hover');
            const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents', { ['aria-live']: 'assertive' }));
            const renderer = disposableStore.add(new markdownRenderer_1.MarkdownRenderer({ editor: this._editor }, this._languageService, this._openerService));
            const render = (code) => {
                disposableStore.add(renderer.onDidRenderAsync(() => {
                    hoverContentsElement.className = 'hover-contents code-hover-contents';
                    context.onContentsChanged();
                }));
                const inlineSuggestionAvailable = nls.localize('inlineSuggestionFollows', "Suggestion:");
                const renderedContents = disposableStore.add(renderer.render(new htmlContent_1.MarkdownString().appendText(inlineSuggestionAvailable).appendCodeblock('text', code)));
                hoverContentsElement.replaceChildren(renderedContents.element);
            };
            disposableStore.add((0, observable_1.autorun)(reader => {
                /** @description update hover */
                const ghostText = part.controller.model.read(reader)?.primaryGhostText.read(reader);
                if (ghostText) {
                    const lineText = this._editor.getModel().getLineContent(ghostText.lineNumber);
                    render(ghostText.renderForScreenReader(lineText));
                }
                else {
                    dom.reset(hoverContentsElement);
                }
            }));
            context.fragment.appendChild(markdownHoverElement);
        }
    };
    exports.InlineCompletionsHoverParticipant = InlineCompletionsHoverParticipant;
    exports.InlineCompletionsHoverParticipant = InlineCompletionsHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, telemetry_1.ITelemetryService)
    ], InlineCompletionsHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9ob3ZlclBhcnRpY2lwYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsTUFBYSxzQkFBc0I7UUFDbEMsWUFDaUIsS0FBc0QsRUFDdEQsS0FBWSxFQUNaLFVBQXVDO1lBRnZDLFVBQUssR0FBTCxLQUFLLENBQWlEO1lBQ3RELFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixlQUFVLEdBQVYsVUFBVSxDQUE2QjtRQUNwRCxDQUFDO1FBRUUscUJBQXFCLENBQUMsTUFBbUI7WUFDL0MsT0FBTyxDQUNOLE1BQU0sQ0FBQyxJQUFJLGtDQUEwQjttQkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXO21CQUNsRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDakQsQ0FBQztRQUNILENBQUM7S0FDRDtJQWRELHdEQWNDO0lBRU0sSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBaUM7UUFJN0MsWUFDa0IsT0FBb0IsRUFDbkIsZ0JBQW1ELEVBQ3JELGNBQStDLEVBQ3hDLG9CQUE0RCxFQUM1RCxxQkFBNkQsRUFDakUsaUJBQXFEO1lBTHZELFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDRixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3BDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDaEQsc0JBQWlCLEdBQWpCLGlC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
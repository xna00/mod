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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/hover/browser/getHover", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/editor/common/services/languageFeatures"], function (require, exports, dom, arrays_1, async_1, htmlContent_1, lifecycle_1, markdownRenderer_1, position_1, range_1, language_1, getHover_1, nls, configuration_1, opener_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownHoverParticipant = exports.MarkdownHover = void 0;
    exports.renderMarkdownHovers = renderMarkdownHovers;
    const $ = dom.$;
    class MarkdownHover {
        constructor(owner, range, contents, isBeforeContent, ordinal) {
            this.owner = owner;
            this.range = range;
            this.contents = contents;
            this.isBeforeContent = isBeforeContent;
            this.ordinal = ordinal;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.MarkdownHover = MarkdownHover;
    let MarkdownHoverParticipant = class MarkdownHoverParticipant {
        constructor(_editor, _languageService, _openerService, _configurationService, _languageFeaturesService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this.hoverOrdinal = 3;
        }
        createLoadingMessage(anchor) {
            return new MarkdownHover(this, anchor.range, [new htmlContent_1.MarkdownString().appendText(nls.localize('modesContentHover.loading', "Loading..."))], false, 2000);
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            const result = [];
            let index = 1000;
            const lineLength = model.getLineLength(lineNumber);
            const languageId = model.getLanguageIdAtPosition(anchor.range.startLineNumber, anchor.range.startColumn);
            const stopRenderingLineAfter = this._editor.getOption(117 /* EditorOption.stopRenderingLineAfter */);
            const maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: languageId
            });
            let stopRenderingMessage = false;
            if (stopRenderingLineAfter >= 0 && lineLength > stopRenderingLineAfter && anchor.range.startColumn >= stopRenderingLineAfter) {
                stopRenderingMessage = true;
                result.push(new MarkdownHover(this, anchor.range, [{
                        value: nls.localize('stopped rendering', "Rendering paused for long line for performance reasons. This can be configured via `editor.stopRenderingLineAfter`.")
                    }], false, index++));
            }
            if (!stopRenderingMessage && typeof maxTokenizationLineLength === 'number' && lineLength >= maxTokenizationLineLength) {
                result.push(new MarkdownHover(this, anchor.range, [{
                        value: nls.localize('too many characters', "Tokenization is skipped for long lines for performance reasons. This can be configured via `editor.maxTokenizationLineLength`.")
                    }], false, index++));
            }
            let isBeforeContent = false;
            for (const d of lineDecorations) {
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                const hoverMessage = d.options.hoverMessage;
                if (!hoverMessage || (0, htmlContent_1.isEmptyMarkdownString)(hoverMessage)) {
                    continue;
                }
                if (d.options.beforeContentClassName) {
                    isBeforeContent = true;
                }
                const range = new range_1.Range(anchor.range.startLineNumber, startColumn, anchor.range.startLineNumber, endColumn);
                result.push(new MarkdownHover(this, range, (0, arrays_1.asArray)(hoverMessage), isBeforeContent, index++));
            }
            return result;
        }
        computeAsync(anchor, lineDecorations, token) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const model = this._editor.getModel();
            if (!this._languageFeaturesService.hoverProvider.has(model)) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const position = new position_1.Position(anchor.range.startLineNumber, anchor.range.startColumn);
            return (0, getHover_1.getHover)(this._languageFeaturesService.hoverProvider, model, position, token)
                .filter(item => !(0, htmlContent_1.isEmptyMarkdownString)(item.hover.contents))
                .map(item => {
                const rng = item.hover.range ? range_1.Range.lift(item.hover.range) : anchor.range;
                return new MarkdownHover(this, rng, item.hover.contents, false, item.ordinal);
            });
        }
        renderHoverParts(context, hoverParts) {
            return renderMarkdownHovers(context, hoverParts, this._editor, this._languageService, this._openerService);
        }
    };
    exports.MarkdownHoverParticipant = MarkdownHoverParticipant;
    exports.MarkdownHoverParticipant = MarkdownHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], MarkdownHoverParticipant);
    function renderMarkdownHovers(context, hoverParts, editor, languageService, openerService) {
        // Sort hover parts to keep them stable since they might come in async, out-of-order
        hoverParts.sort((a, b) => a.ordinal - b.ordinal);
        const disposables = new lifecycle_1.DisposableStore();
        for (const hoverPart of hoverParts) {
            for (const contents of hoverPart.contents) {
                if ((0, htmlContent_1.isEmptyMarkdownString)(contents)) {
                    continue;
                }
                const markdownHoverElement = $('div.hover-row.markdown-hover');
                const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
                const renderer = disposables.add(new markdownRenderer_1.MarkdownRenderer({ editor }, languageService, openerService));
                disposables.add(renderer.onDidRenderAsync(() => {
                    hoverContentsElement.className = 'hover-contents code-hover-contents';
                    context.onContentsChanged();
                }));
                const renderedContents = disposables.add(renderer.render(contents));
                hoverContentsElement.appendChild(renderedContents.element);
                context.fragment.appendChild(markdownHoverElement);
            }
        }
        return disposables;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25Ib3ZlclBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL21hcmtkb3duSG92ZXJQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5SWhHLG9EQThCQztJQWpKRCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLE1BQWEsYUFBYTtRQUV6QixZQUNpQixLQUE2QyxFQUM3QyxLQUFZLEVBQ1osUUFBMkIsRUFDM0IsZUFBd0IsRUFDeEIsT0FBZTtZQUpmLFVBQUssR0FBTCxLQUFLLENBQXdDO1lBQzdDLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBUztZQUN4QixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQzVCLENBQUM7UUFFRSxxQkFBcUIsQ0FBQyxNQUFtQjtZQUMvQyxPQUFPLENBQ04sTUFBTSxDQUFDLElBQUksa0NBQTBCO21CQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVc7bUJBQ2xELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUNqRCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBakJELHNDQWlCQztJQUVNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO1FBSXBDLFlBQ29CLE9BQW9CLEVBQ3JCLGdCQUFtRCxFQUNyRCxjQUErQyxFQUN4QyxxQkFBNkQsRUFDMUQsd0JBQXFFO1lBSjVFLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDSixxQkFBZ0IsR0FBaEIsZ0JBQWdC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
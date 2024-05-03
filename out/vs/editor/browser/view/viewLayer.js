/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/browser/trustedTypes", "vs/base/common/errors", "vs/editor/common/core/stringBuilder"], function (require, exports, fastDomNode_1, trustedTypes_1, errors_1, stringBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisibleLinesCollection = exports.RenderedLinesCollection = void 0;
    class RenderedLinesCollection {
        constructor(createLine) {
            this._createLine = createLine;
            this._set(1, []);
        }
        flush() {
            this._set(1, []);
        }
        _set(rendLineNumberStart, lines) {
            this._lines = lines;
            this._rendLineNumberStart = rendLineNumberStart;
        }
        _get() {
            return {
                rendLineNumberStart: this._rendLineNumberStart,
                lines: this._lines
            };
        }
        /**
         * @returns Inclusive line number that is inside this collection
         */
        getStartLineNumber() {
            return this._rendLineNumberStart;
        }
        /**
         * @returns Inclusive line number that is inside this collection
         */
        getEndLineNumber() {
            return this._rendLineNumberStart + this._lines.length - 1;
        }
        getCount() {
            return this._lines.length;
        }
        getLine(lineNumber) {
            const lineIndex = lineNumber - this._rendLineNumberStart;
            if (lineIndex < 0 || lineIndex >= this._lines.length) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._lines[lineIndex];
        }
        /**
         * @returns Lines that were removed from this collection
         */
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            if (this.getCount() === 0) {
                // no lines
                return null;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            if (deleteToLineNumber < startLineNumber) {
                // deleting above the viewport
                const deleteCnt = deleteToLineNumber - deleteFromLineNumber + 1;
                this._rendLineNumberStart -= deleteCnt;
                return null;
            }
            if (deleteFromLineNumber > endLineNumber) {
                // deleted below the viewport
                return null;
            }
            // Record what needs to be deleted
            let deleteStartIndex = 0;
            let deleteCount = 0;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - this._rendLineNumberStart;
                if (deleteFromLineNumber <= lineNumber && lineNumber <= deleteToLineNumber) {
                    // this is a line to be deleted
                    if (deleteCount === 0) {
                        // this is the first line to be deleted
                        deleteStartIndex = lineIndex;
                        deleteCount = 1;
                    }
                    else {
                        deleteCount++;
                    }
                }
            }
            // Adjust this._rendLineNumberStart for lines deleted above
            if (deleteFromLineNumber < startLineNumber) {
                // Something was deleted above
                let deleteAboveCount = 0;
                if (deleteToLineNumber < startLineNumber) {
                    // the entire deleted lines are above
                    deleteAboveCount = deleteToLineNumber - deleteFromLineNumber + 1;
                }
                else {
                    deleteAboveCount = startLineNumber - deleteFromLineNumber;
                }
                this._rendLineNumberStart -= deleteAboveCount;
            }
            const deleted = this._lines.splice(deleteStartIndex, deleteCount);
            return deleted;
        }
        onLinesChanged(changeFromLineNumber, changeCount) {
            const changeToLineNumber = changeFromLineNumber + changeCount - 1;
            if (this.getCount() === 0) {
                // no lines
                return false;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            let someoneNotified = false;
            for (let changedLineNumber = changeFromLineNumber; changedLineNumber <= changeToLineNumber; changedLineNumber++) {
                if (changedLineNumber >= startLineNumber && changedLineNumber <= endLineNumber) {
                    // Notify the line
                    this._lines[changedLineNumber - this._rendLineNumberStart].onContentChanged();
                    someoneNotified = true;
                }
            }
            return someoneNotified;
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            if (this.getCount() === 0) {
                // no lines
                return null;
            }
            const insertCnt = insertToLineNumber - insertFromLineNumber + 1;
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            if (insertFromLineNumber <= startLineNumber) {
                // inserting above the viewport
                this._rendLineNumberStart += insertCnt;
                return null;
            }
            if (insertFromLineNumber > endLineNumber) {
                // inserting below the viewport
                return null;
            }
            if (insertCnt + insertFromLineNumber > endLineNumber) {
                // insert inside the viewport in such a way that all remaining lines are pushed outside
                const deleted = this._lines.splice(insertFromLineNumber - this._rendLineNumberStart, endLineNumber - insertFromLineNumber + 1);
                return deleted;
            }
            // insert inside the viewport, push out some lines, but not all remaining lines
            const newLines = [];
            for (let i = 0; i < insertCnt; i++) {
                newLines[i] = this._createLine();
            }
            const insertIndex = insertFromLineNumber - this._rendLineNumberStart;
            const beforeLines = this._lines.slice(0, insertIndex);
            const afterLines = this._lines.slice(insertIndex, this._lines.length - insertCnt);
            const deletedLines = this._lines.slice(this._lines.length - insertCnt, this._lines.length);
            this._lines = beforeLines.concat(newLines).concat(afterLines);
            return deletedLines;
        }
        onTokensChanged(ranges) {
            if (this.getCount() === 0) {
                // no lines
                return false;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            let notifiedSomeone = false;
            for (let i = 0, len = ranges.length; i < len; i++) {
                const rng = ranges[i];
                if (rng.toLineNumber < startLineNumber || rng.fromLineNumber > endLineNumber) {
                    // range outside viewport
                    continue;
                }
                const from = Math.max(startLineNumber, rng.fromLineNumber);
                const to = Math.min(endLineNumber, rng.toLineNumber);
                for (let lineNumber = from; lineNumber <= to; lineNumber++) {
                    const lineIndex = lineNumber - this._rendLineNumberStart;
                    this._lines[lineIndex].onTokensChanged();
                    notifiedSomeone = true;
                }
            }
            return notifiedSomeone;
        }
    }
    exports.RenderedLinesCollection = RenderedLinesCollection;
    class VisibleLinesCollection {
        constructor(host) {
            this._host = host;
            this.domNode = this._createDomNode();
            this._linesCollection = new RenderedLinesCollection(() => this._host.createVisibleLine());
        }
        _createDomNode() {
            const domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            domNode.setClassName('view-layer');
            domNode.setPosition('absolute');
            domNode.domNode.setAttribute('role', 'presentation');
            domNode.domNode.setAttribute('aria-hidden', 'true');
            return domNode;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                return true;
            }
            return false;
        }
        onFlushed(e) {
            this._linesCollection.flush();
            // No need to clear the dom node because a full .innerHTML will occur in ViewLayerRenderer._render
            return true;
        }
        onLinesChanged(e) {
            return this._linesCollection.onLinesChanged(e.fromLineNumber, e.count);
        }
        onLinesDeleted(e) {
            const deleted = this._linesCollection.onLinesDeleted(e.fromLineNumber, e.toLineNumber);
            if (deleted) {
                // Remove from DOM
                for (let i = 0, len = deleted.length; i < len; i++) {
                    const lineDomNode = deleted[i].getDomNode();
                    if (lineDomNode) {
                        this.domNode.domNode.removeChild(lineDomNode);
                    }
                }
            }
            return true;
        }
        onLinesInserted(e) {
            const deleted = this._linesCollection.onLinesInserted(e.fromLineNumber, e.toLineNumber);
            if (deleted) {
                // Remove from DOM
                for (let i = 0, len = deleted.length; i < len; i++) {
                    const lineDomNode = deleted[i].getDomNode();
                    if (lineDomNode) {
                        this.domNode.domNode.removeChild(lineDomNode);
                    }
                }
            }
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onTokensChanged(e) {
            return this._linesCollection.onTokensChanged(e.ranges);
        }
        onZonesChanged(e) {
            return true;
        }
        // ---- end view event handlers
        getStartLineNumber() {
            return this._linesCollection.getStartLineNumber();
        }
        getEndLineNumber() {
            return this._linesCollection.getEndLineNumber();
        }
        getVisibleLine(lineNumber) {
            return this._linesCollection.getLine(lineNumber);
        }
        renderLines(viewportData) {
            const inp = this._linesCollection._get();
            const renderer = new ViewLayerRenderer(this.domNode.domNode, this._host, viewportData);
            const ctx = {
                rendLineNumberStart: inp.rendLineNumberStart,
                lines: inp.lines,
                linesLength: inp.lines.length
            };
            // Decide if this render will do a single update (single large .innerHTML) or many updates (inserting/removing dom nodes)
            const resCtx = renderer.render(ctx, viewportData.startLineNumber, viewportData.endLineNumber, viewportData.relativeVerticalOffset);
            this._linesCollection._set(resCtx.rendLineNumberStart, resCtx.lines);
        }
    }
    exports.VisibleLinesCollection = VisibleLinesCollection;
    class ViewLayerRenderer {
        static { this._ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('editorViewLayer', { createHTML: value => value }); }
        constructor(domNode, host, viewportData) {
            this.domNode = domNode;
            this.host = host;
            this.viewportData = viewportData;
        }
        render(inContext, startLineNumber, stopLineNumber, deltaTop) {
            const ctx = {
                rendLineNumberStart: inContext.rendLineNumberStart,
                lines: inContext.lines.slice(0),
                linesLength: inContext.linesLength
            };
            if ((ctx.rendLineNumberStart + ctx.linesLength - 1 < startLineNumber) || (stopLineNumber < ctx.rendLineNumberStart)) {
                // There is no overlap whatsoever
                ctx.rendLineNumberStart = startLineNumber;
                ctx.linesLength = stopLineNumber - startLineNumber + 1;
                ctx.lines = [];
                for (let x = startLineNumber; x <= stopLineNumber; x++) {
                    ctx.lines[x - startLineNumber] = this.host.createVisibleLine();
                }
                this._finishRendering(ctx, true, deltaTop);
                return ctx;
            }
            // Update lines which will remain untouched
            this._renderUntouchedLines(ctx, Math.max(startLineNumber - ctx.rendLineNumberStart, 0), Math.min(stopLineNumber - ctx.rendLineNumberStart, ctx.linesLength - 1), deltaTop, startLineNumber);
            if (ctx.rendLineNumberStart > startLineNumber) {
                // Insert lines before
                const fromLineNumber = startLineNumber;
                const toLineNumber = Math.min(stopLineNumber, ctx.rendLineNumberStart - 1);
                if (fromLineNumber <= toLineNumber) {
                    this._insertLinesBefore(ctx, fromLineNumber, toLineNumber, deltaTop, startLineNumber);
                    ctx.linesLength += toLineNumber - fromLineNumber + 1;
                }
            }
            else if (ctx.rendLineNumberStart < startLineNumber) {
                // Remove lines before
                const removeCnt = Math.min(ctx.linesLength, startLineNumber - ctx.rendLineNumberStart);
                if (removeCnt > 0) {
                    this._removeLinesBefore(ctx, removeCnt);
                    ctx.linesLength -= removeCnt;
                }
            }
            ctx.rendLineNumberStart = startLineNumber;
            if (ctx.rendLineNumberStart + ctx.linesLength - 1 < stopLineNumber) {
                // Insert lines after
                const fromLineNumber = ctx.rendLineNumberStart + ctx.linesLength;
                const toLineNumber = stopLineNumber;
                if (fromLineNumber <= toLineNumber) {
                    this._insertLinesAfter(ctx, fromLineNumber, toLineNumber, deltaTop, startLineNumber);
                    ctx.linesLength += toLineNumber - fromLineNumber + 1;
                }
            }
            else if (ctx.rendLineNumberStart + ctx.linesLength - 1 > stopLineNumber) {
                // Remove lines after
                const fromLineNumber = Math.max(0, stopLineNumber - ctx.rendLineNumberStart + 1);
                const toLineNumber = ctx.linesLength - 1;
                const removeCnt = toLineNumber - fromLineNumber + 1;
                if (removeCnt > 0) {
                    this._removeLinesAfter(ctx, removeCnt);
                    ctx.linesLength -= removeCnt;
                }
            }
            this._finishRendering(ctx, false, deltaTop);
            return ctx;
        }
        _renderUntouchedLines(ctx, startIndex, endIndex, deltaTop, deltaLN) {
            const rendLineNumberStart = ctx.rendLineNumberStart;
            const lines = ctx.lines;
            for (let i = startIndex; i <= endIndex; i++) {
                const lineNumber = rendLineNumberStart + i;
                lines[i].layoutLine(lineNumber, deltaTop[lineNumber - deltaLN], this.viewportData.lineHeight);
            }
        }
        _insertLinesBefore(ctx, fromLineNumber, toLineNumber, deltaTop, deltaLN) {
            const newLines = [];
            let newLinesLen = 0;
            for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber++) {
                newLines[newLinesLen++] = this.host.createVisibleLine();
            }
            ctx.lines = newLines.concat(ctx.lines);
        }
        _removeLinesBefore(ctx, removeCount) {
            for (let i = 0; i < removeCount; i++) {
                const lineDomNode = ctx.lines[i].getDomNode();
                if (lineDomNode) {
                    this.domNode.removeChild(lineDomNode);
                }
            }
            ctx.lines.splice(0, removeCount);
        }
        _insertLinesAfter(ctx, fromLineNumber, toLineNumber, deltaTop, deltaLN) {
            const newLines = [];
            let newLinesLen = 0;
            for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber++) {
                newLines[newLinesLen++] = this.host.createVisibleLine();
            }
            ctx.lines = ctx.lines.concat(newLines);
        }
        _removeLinesAfter(ctx, removeCount) {
            const removeIndex = ctx.linesLength - removeCount;
            for (let i = 0; i < removeCount; i++) {
                const lineDomNode = ctx.lines[removeIndex + i].getDomNode();
                if (lineDomNode) {
                    this.domNode.removeChild(lineDomNode);
                }
            }
            ctx.lines.splice(removeIndex, removeCount);
        }
        _finishRenderingNewLines(ctx, domNodeIsEmpty, newLinesHTML, wasNew) {
            if (ViewLayerRenderer._ttPolicy) {
                newLinesHTML = ViewLayerRenderer._ttPolicy.createHTML(newLinesHTML);
            }
            const lastChild = this.domNode.lastChild;
            if (domNodeIsEmpty || !lastChild) {
                this.domNode.innerHTML = newLinesHTML; // explains the ugly casts -> https://github.com/microsoft/vscode/issues/106396#issuecomment-692625393;
            }
            else {
                lastChild.insertAdjacentHTML('afterend', newLinesHTML);
            }
            let currChild = this.domNode.lastChild;
            for (let i = ctx.linesLength - 1; i >= 0; i--) {
                const line = ctx.lines[i];
                if (wasNew[i]) {
                    line.setDomNode(currChild);
                    currChild = currChild.previousSibling;
                }
            }
        }
        _finishRenderingInvalidLines(ctx, invalidLinesHTML, wasInvalid) {
            const hugeDomNode = document.createElement('div');
            if (ViewLayerRenderer._ttPolicy) {
                invalidLinesHTML = ViewLayerRenderer._ttPolicy.createHTML(invalidLinesHTML);
            }
            hugeDomNode.innerHTML = invalidLinesHTML;
            for (let i = 0; i < ctx.linesLength; i++) {
                const line = ctx.lines[i];
                if (wasInvalid[i]) {
                    const source = hugeDomNode.firstChild;
                    const lineDomNode = line.getDomNode();
                    lineDomNode.parentNode.replaceChild(source, lineDomNode);
                    line.setDomNode(source);
                }
            }
        }
        static { this._sb = new stringBuilder_1.StringBuilder(100000); }
        _finishRendering(ctx, domNodeIsEmpty, deltaTop) {
            const sb = ViewLayerRenderer._sb;
            const linesLength = ctx.linesLength;
            const lines = ctx.lines;
            const rendLineNumberStart = ctx.rendLineNumberStart;
            const wasNew = [];
            {
                sb.reset();
                let hadNewLine = false;
                for (let i = 0; i < linesLength; i++) {
                    const line = lines[i];
                    wasNew[i] = false;
                    const lineDomNode = line.getDomNode();
                    if (lineDomNode) {
                        // line is not new
                        continue;
                    }
                    const renderResult = line.renderLine(i + rendLineNumberStart, deltaTop[i], this.viewportData.lineHeight, this.viewportData, sb);
                    if (!renderResult) {
                        // line does not need rendering
                        continue;
                    }
                    wasNew[i] = true;
                    hadNewLine = true;
                }
                if (hadNewLine) {
                    this._finishRenderingNewLines(ctx, domNodeIsEmpty, sb.build(), wasNew);
                }
            }
            {
                sb.reset();
                let hadInvalidLine = false;
                const wasInvalid = [];
                for (let i = 0; i < linesLength; i++) {
                    const line = lines[i];
                    wasInvalid[i] = false;
                    if (wasNew[i]) {
                        // line was new
                        continue;
                    }
                    const renderResult = line.renderLine(i + rendLineNumberStart, deltaTop[i], this.viewportData.lineHeight, this.viewportData, sb);
                    if (!renderResult) {
                        // line does not need rendering
                        continue;
                    }
                    wasInvalid[i] = true;
                    hadInvalidLine = true;
                }
                if (hadInvalidLine) {
                    this._finishRenderingInvalidLines(ctx, sb.build(), wasInvalid);
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xheWVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3L3ZpZXdMYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQ2hHLE1BQWEsdUJBQXVCO1FBS25DLFlBQVksVUFBbUI7WUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxDQUFDLG1CQUEyQixFQUFFLEtBQVU7WUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1FBQ2pELENBQUM7UUFFRCxJQUFJO1lBQ0gsT0FBTztnQkFDTixtQkFBbUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CO2dCQUM5QyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU07YUFDbEIsQ0FBQztRQUNILENBQUM7UUFFRDs7V0FFRztRQUNJLGtCQUFrQjtZQUN4QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxnQkFBZ0I7WUFDdEIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxRQUFRO1lBQ2QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixDQUFDO1FBRU0sT0FBTyxDQUFDLFVBQWtCO1lBQ2hDLE1BQU0sU0FB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
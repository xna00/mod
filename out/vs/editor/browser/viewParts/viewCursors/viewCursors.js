/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/async", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/viewCursors/viewCursor", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/platform/theme/common/theme", "vs/base/browser/dom", "vs/css!./viewCursors"], function (require, exports, fastDomNode_1, async_1, viewPart_1, viewCursor_1, editorOptions_1, editorColorRegistry_1, themeService_1, theme_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewCursors = void 0;
    class ViewCursors extends viewPart_1.ViewPart {
        static { this.BLINK_INTERVAL = 500; }
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            this._readOnly = options.get(91 /* EditorOption.readOnly */);
            this._cursorBlinking = options.get(26 /* EditorOption.cursorBlinking */);
            this._cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
            this._cursorSmoothCaretAnimation = options.get(27 /* EditorOption.cursorSmoothCaretAnimation */);
            this._selectionIsEmpty = true;
            this._isComposingInput = false;
            this._isVisible = false;
            this._primaryCursor = new viewCursor_1.ViewCursor(this._context, viewCursor_1.CursorPlurality.Single);
            this._secondaryCursors = [];
            this._renderData = [];
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._updateDomClassName();
            this._domNode.appendChild(this._primaryCursor.getDomNode());
            this._startCursorBlinkAnimation = new async_1.TimeoutTimer();
            this._cursorFlatBlinkInterval = new dom_1.WindowIntervalTimer();
            this._blinkingEnabled = false;
            this._editorHasFocus = false;
            this._updateBlinking();
        }
        dispose() {
            super.dispose();
            this._startCursorBlinkAnimation.dispose();
            this._cursorFlatBlinkInterval.dispose();
        }
        getDomNode() {
            return this._domNode;
        }
        // --- begin event handlers
        onCompositionStart(e) {
            this._isComposingInput = true;
            this._updateBlinking();
            return true;
        }
        onCompositionEnd(e) {
            this._isComposingInput = false;
            this._updateBlinking();
            return true;
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._readOnly = options.get(91 /* EditorOption.readOnly */);
            this._cursorBlinking = options.get(26 /* EditorOption.cursorBlinking */);
            this._cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
            this._cursorSmoothCaretAnimation = options.get(27 /* EditorOption.cursorSmoothCaretAnimation */);
            this._updateBlinking();
            this._updateDomClassName();
            this._primaryCursor.onConfigurationChanged(e);
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].onConfigurationChanged(e);
            }
            return true;
        }
        _onCursorPositionChanged(position, secondaryPositions, reason) {
            const pauseAnimation = (this._secondaryCursors.length !== secondaryPositions.length
                || (this._cursorSmoothCaretAnimation === 'explicit' && reason !== 3 /* CursorChangeReason.Explicit */));
            this._primaryCursor.setPlurality(secondaryPositions.length ? viewCursor_1.CursorPlurality.MultiPrimary : viewCursor_1.CursorPlurality.Single);
            this._primaryCursor.onCursorPositionChanged(position, pauseAnimation);
            this._updateBlinking();
            if (this._secondaryCursors.length < secondaryPositions.length) {
                // Create new cursors
                const addCnt = secondaryPositions.length - this._secondaryCursors.length;
                for (let i = 0; i < addCnt; i++) {
                    const newCursor = new viewCursor_1.ViewCursor(this._context, viewCursor_1.CursorPlurality.MultiSecondary);
                    this._domNode.domNode.insertBefore(newCursor.getDomNode().domNode, this._primaryCursor.getDomNode().domNode.nextSibling);
                    this._secondaryCursors.push(newCursor);
                }
            }
            else if (this._secondaryCursors.length > secondaryPositions.length) {
                // Remove some cursors
                const removeCnt = this._secondaryCursors.length - secondaryPositions.length;
                for (let i = 0; i < removeCnt; i++) {
                    this._domNode.removeChild(this._secondaryCursors[0].getDomNode());
                    this._secondaryCursors.splice(0, 1);
                }
            }
            for (let i = 0; i < secondaryPositions.length; i++) {
                this._secondaryCursors[i].onCursorPositionChanged(secondaryPositions[i], pauseAnimation);
            }
        }
        onCursorStateChanged(e) {
            const positions = [];
            for (let i = 0, len = e.selections.length; i < len; i++) {
                positions[i] = e.selections[i].getPosition();
            }
            this._onCursorPositionChanged(positions[0], positions.slice(1), e.reason);
            const selectionIsEmpty = e.selections[0].isEmpty();
            if (this._selectionIsEmpty !== selectionIsEmpty) {
                this._selectionIsEmpty = selectionIsEmpty;
                this._updateDomClassName();
            }
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onFocusChanged(e) {
            this._editorHasFocus = e.isFocused;
            this._updateBlinking();
            return false;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onTokensChanged(e) {
            const shouldRender = (position) => {
                for (let i = 0, len = e.ranges.length; i < len; i++) {
                    if (e.ranges[i].fromLineNumber <= position.lineNumber && position.lineNumber <= e.ranges[i].toLineNumber) {
                        return true;
                    }
                }
                return false;
            };
            if (shouldRender(this._primaryCursor.getPosition())) {
                return true;
            }
            for (const secondaryCursor of this._secondaryCursors) {
                if (shouldRender(secondaryCursor.getPosition())) {
                    return true;
                }
            }
            return false;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // ---- blinking logic
        _getCursorBlinking() {
            if (this._isComposingInput) {
                // avoid double cursors
                return 0 /* TextEditorCursorBlinkingStyle.Hidden */;
            }
            if (!this._editorHasFocus) {
                return 0 /* TextEditorCursorBlinkingStyle.Hidden */;
            }
            if (this._readOnly) {
                return 5 /* TextEditorCursorBlinkingStyle.Solid */;
            }
            return this._cursorBlinking;
        }
        _updateBlinking() {
            this._startCursorBlinkAnimation.cancel();
            this._cursorFlatBlinkInterval.cancel();
            const blinkingStyle = this._getCursorBlinking();
            // hidden and solid are special as they involve no animations
            const isHidden = (blinkingStyle === 0 /* TextEditorCursorBlinkingStyle.Hidden */);
            const isSolid = (blinkingStyle === 5 /* TextEditorCursorBlinkingStyle.Solid */);
            if (isHidden) {
                this._hide();
            }
            else {
                this._show();
            }
            this._blinkingEnabled = false;
            this._updateDomClassName();
            if (!isHidden && !isSolid) {
                if (blinkingStyle === 1 /* TextEditorCursorBlinkingStyle.Blink */) {
                    // flat blinking is handled by JavaScript to save battery life due to Chromium step timing issue https://bugs.chromium.org/p/chromium/issues/detail?id=361587
                    this._cursorFlatBlinkInterval.cancelAndSet(() => {
                        if (this._isVisible) {
                            this._hide();
                        }
                        else {
                            this._show();
                        }
                    }, ViewCursors.BLINK_INTERVAL, (0, dom_1.getWindow)(this._domNode.domNode));
                }
                else {
                    this._startCursorBlinkAnimation.setIfNotSet(() => {
                        this._blinkingEnabled = true;
                        this._updateDomClassName();
                    }, ViewCursors.BLINK_INTERVAL);
                }
            }
        }
        // --- end blinking logic
        _updateDomClassName() {
            this._domNode.setClassName(this._getClassName());
        }
        _getClassName() {
            let result = 'cursors-layer';
            if (!this._selectionIsEmpty) {
                result += ' has-selection';
            }
            switch (this._cursorStyle) {
                case editorOptions_1.TextEditorCursorStyle.Line:
                    result += ' cursor-line-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.Block:
                    result += ' cursor-block-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.Underline:
                    result += ' cursor-underline-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.LineThin:
                    result += ' cursor-line-thin-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.BlockOutline:
                    result += ' cursor-block-outline-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.UnderlineThin:
                    result += ' cursor-underline-thin-style';
                    break;
                default:
                    result += ' cursor-line-style';
            }
            if (this._blinkingEnabled) {
                switch (this._getCursorBlinking()) {
                    case 1 /* TextEditorCursorBlinkingStyle.Blink */:
                        result += ' cursor-blink';
                        break;
                    case 2 /* TextEditorCursorBlinkingStyle.Smooth */:
                        result += ' cursor-smooth';
                        break;
                    case 3 /* TextEditorCursorBlinkingStyle.Phase */:
                        result += ' cursor-phase';
                        break;
                    case 4 /* TextEditorCursorBlinkingStyle.Expand */:
                        result += ' cursor-expand';
                        break;
                    case 5 /* TextEditorCursorBlinkingStyle.Solid */:
                        result += ' cursor-solid';
                        break;
                    default:
                        result += ' cursor-solid';
                }
            }
            else {
                result += ' cursor-solid';
            }
            if (this._cursorSmoothCaretAnimation === 'on' || this._cursorSmoothCaretAnimation === 'explicit') {
                result += ' cursor-smooth-caret-animation';
            }
            return result;
        }
        _show() {
            this._primaryCursor.show();
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].show();
            }
            this._isVisible = true;
        }
        _hide() {
            this._primaryCursor.hide();
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].hide();
            }
            this._isVisible = false;
        }
        // ---- IViewPart implementation
        prepareRender(ctx) {
            this._primaryCursor.prepareRender(ctx);
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].prepareRender(ctx);
            }
        }
        render(ctx) {
            const renderData = [];
            let renderDataLen = 0;
            const primaryRenderData = this._primaryCursor.render(ctx);
            if (primaryRenderData) {
                renderData[renderDataLen++] = primaryRenderData;
            }
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                const secondaryRenderData = this._secondaryCursors[i].render(ctx);
                if (secondaryRenderData) {
                    renderData[renderDataLen++] = secondaryRenderData;
                }
            }
            this._renderData = renderData;
        }
        getLastRenderData() {
            return this._renderData;
        }
    }
    exports.ViewCursors = ViewCursors;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const cursorThemes = [
            { class: '.cursor', foreground: editorColorRegistry_1.editorCursorForeground, background: editorColorRegistry_1.editorCursorBackground },
            { class: '.cursor-primary', foreground: editorColorRegistry_1.editorMultiCursorPrimaryForeground, background: editorColorRegistry_1.editorMultiCursorPrimaryBackground },
            { class: '.cursor-secondary', foreground: editorColorRegistry_1.editorMultiCursorSecondaryForeground, background: editorColorRegistry_1.editorMultiCursorSecondaryBackground },
        ];
        for (const cursorTheme of cursorThemes) {
            const caret = theme.getColor(cursorTheme.foreground);
            if (caret) {
                let caretBackground = theme.getColor(cursorTheme.background);
                if (!caretBackground) {
                    caretBackground = caret.opposite();
                }
                collector.addRule(`.monaco-editor .cursors-layer ${cursorTheme.class} { background-color: ${caret}; border-color: ${caret}; color: ${caretBackground}; }`);
                if ((0, theme_1.isHighContrast)(theme.type)) {
                    collector.addRule(`.monaco-editor .cursors-layer.has-selection ${cursorTheme.class} { border-left: 1px solid ${caretBackground}; border-right: 1px solid ${caretBackground}; }`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0N1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy92aWV3Q3Vyc29ycy92aWV3Q3Vyc29ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQmhHLE1BQWEsV0FBWSxTQUFRLG1CQUFRO2lCQUV4QixtQkFBYyxHQUFHLEdBQUcsQ0FBQztRQXVCckMsWUFBWSxPQUFvQjtZQUMvQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFZixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxnQ0FBdUIsQ0FBQztZQUNwRCxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLHNDQUE2QixDQUFDO1lBQ2hFLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsbUNBQTBCLENBQUM7WUFDMUQsSUFBSSxDQUFDLDJCQUEyQixHQUFHLE9BQU8sQ0FBQyxHQUFHLGtEQUF5QyxDQUFDO1lBQ3hGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUUvQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUV4QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksdUJBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLDRCQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUV0QixJQUFJLENBQUMsUUFBUSxHQUFHLElB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
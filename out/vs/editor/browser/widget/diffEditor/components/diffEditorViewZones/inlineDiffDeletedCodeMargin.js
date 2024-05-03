/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/themables", "vs/nls"], function (require, exports, dom_1, actions_1, codicons_1, lifecycle_1, platform_1, themables_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineDiffDeletedCodeMargin = void 0;
    class InlineDiffDeletedCodeMargin extends lifecycle_1.Disposable {
        get visibility() {
            return this._visibility;
        }
        set visibility(_visibility) {
            if (this._visibility !== _visibility) {
                this._visibility = _visibility;
                this._diffActions.style.visibility = _visibility ? 'visible' : 'hidden';
            }
        }
        constructor(_getViewZoneId, _marginDomNode, _modifiedEditor, _diff, _editor, _viewLineCounts, _originalTextModel, _contextMenuService, _clipboardService) {
            super();
            this._getViewZoneId = _getViewZoneId;
            this._marginDomNode = _marginDomNode;
            this._modifiedEditor = _modifiedEditor;
            this._diff = _diff;
            this._editor = _editor;
            this._viewLineCounts = _viewLineCounts;
            this._originalTextModel = _originalTextModel;
            this._contextMenuService = _contextMenuService;
            this._clipboardService = _clipboardService;
            this._visibility = false;
            // make sure the diff margin shows above overlay.
            this._marginDomNode.style.zIndex = '10';
            this._diffActions = document.createElement('div');
            this._diffActions.className = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.lightBulb) + ' lightbulb-glyph';
            this._diffActions.style.position = 'absolute';
            const lineHeight = this._modifiedEditor.getOption(67 /* EditorOption.lineHeight */);
            this._diffActions.style.right = '0px';
            this._diffActions.style.visibility = 'hidden';
            this._diffActions.style.height = `${lineHeight}px`;
            this._diffActions.style.lineHeight = `${lineHeight}px`;
            this._marginDomNode.appendChild(this._diffActions);
            let currentLineNumberOffset = 0;
            const useShadowDOM = _modifiedEditor.getOption(127 /* EditorOption.useShadowDOM */) && !platform_1.isIOS; // Do not use shadow dom on IOS #122035
            const showContextMenu = (x, y) => {
                this._contextMenuService.showContextMenu({
                    domForShadowRoot: useShadowDOM ? _modifiedEditor.getDomNode() ?? undefined : undefined,
                    getAnchor: () => ({ x, y }),
                    getActions: () => {
                        const actions = [];
                        const isDeletion = _diff.modified.isEmpty;
                        // default action
                        actions.push(new actions_1.Action('diff.clipboard.copyDeletedContent', isDeletion
                            ? (_diff.original.length > 1
                                ? (0, nls_1.localize)('diff.clipboard.copyDeletedLinesContent.label', "Copy deleted lines")
                                : (0, nls_1.localize)('diff.clipboard.copyDeletedLinesContent.single.label', "Copy deleted line"))
                            : (_diff.original.length > 1
                                ? (0, nls_1.localize)('diff.clipboard.copyChangedLinesContent.label', "Copy changed lines")
                                : (0, nls_1.localize)('diff.clipboard.copyChangedLinesContent.single.label', "Copy changed line")), undefined, true, async () => {
                            const originalText = this._originalTextModel.getValueInRange(_diff.original.toExclusiveRange());
                            await this._clipboardService.writeText(originalText);
                        }));
                        if (_diff.original.length > 1) {
                            actions.push(new actions_1.Action('diff.clipboard.copyDeletedLineContent', isDeletion
                                ? (0, nls_1.localize)('diff.clipboard.copyDeletedLineContent.label', "Copy deleted line ({0})", _diff.original.startLineNumber + currentLineNumberOffset)
                                : (0, nls_1.localize)('diff.clipboard.copyChangedLineContent.label', "Copy changed line ({0})", _diff.original.startLineNumber + currentLineNumberOffset), undefined, true, async () => {
                                let lineContent = this._originalTextModel.getLineContent(_diff.original.startLineNumber + currentLineNumberOffset);
                                if (lineContent === '') {
                                    // empty line -> new line
                                    const eof = this._originalTextModel.getEndOfLineSequence();
                                    lineContent = eof === 0 /* EndOfLineSequence.LF */ ? '\n' : '\r\n';
                                }
                                await this._clipboardService.writeText(lineContent);
                            }));
                        }
                        const readOnly = _modifiedEditor.getOption(91 /* EditorOption.readOnly */);
                        if (!readOnly) {
                            actions.push(new actions_1.Action('diff.inline.revertChange', (0, nls_1.localize)('diff.inline.revertChange.label', "Revert this change"), undefined, true, async () => {
                                this._editor.revert(this._diff);
                            }));
                        }
                        return actions;
                    },
                    autoSelectFirstItem: true
                });
            };
            this._register((0, dom_1.addStandardDisposableListener)(this._diffActions, 'mousedown', e => {
                if (!e.leftButton) {
                    return;
                }
                const { top, height } = (0, dom_1.getDomNodePagePosition)(this._diffActions);
                const pad = Math.floor(lineHeight / 3);
                e.preventDefault();
                showContextMenu(e.posx, top + height + pad);
            }));
            this._register(_modifiedEditor.onMouseMove((e) => {
                if ((e.target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || e.target.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) && e.target.detail.viewZoneId === this._getViewZoneId()) {
                    currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                    this.visibility = true;
                }
                else {
                    this.visibility = false;
                }
            }));
            this._register(_modifiedEditor.onMouseDown((e) => {
                if (!e.event.leftButton) {
                    return;
                }
                if (e.target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || e.target.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                    const viewZoneId = e.target.detail.viewZoneId;
                    if (viewZoneId === this._getViewZoneId()) {
                        e.event.preventDefault();
                        currentLineNumberOffset = this._updateLightBulbPosition(this._marginDomNode, e.event.browserEvent.y, lineHeight);
                        showContextMenu(e.event.posx, e.event.posy + lineHeight);
                    }
                }
            }));
        }
        _updateLightBulbPosition(marginDomNode, y, lineHeight) {
            const { top } = (0, dom_1.getDomNodePagePosition)(marginDomNode);
            const offset = y - top;
            const lineNumberOffset = Math.floor(offset / lineHeight);
            const newTop = lineNumberOffset * lineHeight;
            this._diffActions.style.top = `${newTop}px`;
            if (this._viewLineCounts) {
                let acc = 0;
                for (let i = 0; i < this._viewLineCounts.length; i++) {
                    acc += this._viewLineCounts[i];
                    if (lineNumberOffset < acc) {
                        return i;
                    }
                }
            }
            return lineNumberOffset;
        }
    }
    exports.InlineDiffDeletedCodeMargin = InlineDiffDeletedCodeMargin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRGlmZkRlbGV0ZWRDb2RlTWFyZ2luLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2RpZmZFZGl0b3JWaWV3Wm9uZXMvaW5saW5lRGlmZkRlbGV0ZWRDb2RlTWFyZ2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSwyQkFBNEIsU0FBUSxzQkFBVTtRQUsxRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLFdBQW9CO1lBQ2xDLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3pFLENBQUM7UUFDRixDQUFDO1FBRUQsWUFDa0IsY0FBNEIsRUFDNUIsY0FBMkIsRUFDM0IsZUFBaUMsRUFDakMsS0FBK0IsRUFDL0IsT0FBeUIsRUFDekIsZUFBeUIsRUFDekIsa0JBQThCLEVBQzlCLG1CQUF3QyxFQUN4QyxpQkFBb0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFWUyxtQkFBYyxHQUFkLGNBQWMsQ0FBYztZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBYTtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDakMsVUFBSyxHQUFMLEtBQUssQ0FBMEI7WUFDL0IsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7WUFDekIsb0JBQWUsR0FBZixlQUFlLENBQVU7WUFDekIsdUJB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
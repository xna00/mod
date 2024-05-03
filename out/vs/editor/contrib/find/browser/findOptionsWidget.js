/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInputToggles", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/browser/findModel", "vs/platform/theme/common/colorRegistry", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./findOptionsWidget"], function (require, exports, dom, findInputToggles_1, widget_1, async_1, findModel_1, colorRegistry_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindOptionsWidget = void 0;
    class FindOptionsWidget extends widget_1.Widget {
        static { this.ID = 'editor.contrib.findOptionsWidget'; }
        constructor(editor, state, keybindingService) {
            super();
            this._hideSoon = this._register(new async_1.RunOnceScheduler(() => this._hide(), 2000));
            this._isVisible = false;
            this._editor = editor;
            this._state = state;
            this._keybindingService = keybindingService;
            this._domNode = document.createElement('div');
            this._domNode.className = 'findOptionsWidget';
            this._domNode.style.display = 'none';
            this._domNode.style.top = '10px';
            this._domNode.style.zIndex = '12';
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            const toggleStyles = {
                inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
                inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground),
            };
            const hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            this.caseSensitive = this._register(new findInputToggles_1.CaseSensitiveToggle({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleCaseSensitiveCommand),
                isChecked: this._state.matchCase,
                hoverDelegate,
                ...toggleStyles
            }));
            this._domNode.appendChild(this.caseSensitive.domNode);
            this._register(this.caseSensitive.onChange(() => {
                this._state.change({
                    matchCase: this.caseSensitive.checked
                }, false);
            }));
            this.wholeWords = this._register(new findInputToggles_1.WholeWordsToggle({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleWholeWordCommand),
                isChecked: this._state.wholeWord,
                hoverDelegate,
                ...toggleStyles
            }));
            this._domNode.appendChild(this.wholeWords.domNode);
            this._register(this.wholeWords.onChange(() => {
                this._state.change({
                    wholeWord: this.wholeWords.checked
                }, false);
            }));
            this.regex = this._register(new findInputToggles_1.RegexToggle({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleRegexCommand),
                isChecked: this._state.isRegex,
                hoverDelegate,
                ...toggleStyles
            }));
            this._domNode.appendChild(this.regex.domNode);
            this._register(this.regex.onChange(() => {
                this._state.change({
                    isRegex: this.regex.checked
                }, false);
            }));
            this._editor.addOverlayWidget(this);
            this._register(this._state.onFindReplaceStateChange((e) => {
                let somethingChanged = false;
                if (e.isRegex) {
                    this.regex.checked = this._state.isRegex;
                    somethingChanged = true;
                }
                if (e.wholeWord) {
                    this.wholeWords.checked = this._state.wholeWord;
                    somethingChanged = true;
                }
                if (e.matchCase) {
                    this.caseSensitive.checked = this._state.matchCase;
                    somethingChanged = true;
                }
                if (!this._state.isRevealed && somethingChanged) {
                    this._revealTemporarily();
                }
            }));
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.MOUSE_LEAVE, (e) => this._onMouseLeave()));
            this._register(dom.addDisposableListener(this._domNode, 'mouseover', (e) => this._onMouseOver()));
        }
        _keybindingLabelFor(actionId) {
            const kb = this._keybindingService.lookupKeybinding(actionId);
            if (!kb) {
                return '';
            }
            return ` (${kb.getLabel()})`;
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        // ----- IOverlayWidget API
        getId() {
            return FindOptionsWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 0 /* OverlayWidgetPositionPreference.TOP_RIGHT_CORNER */
            };
        }
        highlightFindOptions() {
            this._revealTemporarily();
        }
        _revealTemporarily() {
            this._show();
            this._hideSoon.schedule();
        }
        _onMouseLeave() {
            this._hideSoon.schedule();
        }
        _onMouseOver() {
            this._hideSoon.cancel();
        }
        _show() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._domNode.style.display = 'block';
        }
        _hide() {
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._domNode.style.display = 'none';
        }
    }
    exports.FindOptionsWidget = FindOptionsWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE9wdGlvbnNXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZpbmQvYnJvd3Nlci9maW5kT3B0aW9uc1dpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxpQkFBa0IsU0FBUSxlQUFNO2lCQUVwQixPQUFFLEdBQUcsa0NBQWtDLEFBQXJDLENBQXNDO1FBV2hFLFlBQ0MsTUFBbUIsRUFDbkIsS0FBdUIsRUFDdkIsaUJBQXFDO1lBRXJDLEtBQUssRUFBRSxDQUFDO1lBdUhELGNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFlM0UsZUFBVSxHQUFZLEtBQUssQ0FBQztZQXBJbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1lBRTVDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUM7WUFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxD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
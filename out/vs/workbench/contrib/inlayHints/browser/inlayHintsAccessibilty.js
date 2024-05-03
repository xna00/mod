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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link"], function (require, exports, dom, cancellation_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, inlayHints_1, inlayHintsController_1, nls_1, actions_1, accessibilitySignalService_1, contextkey_1, instantiation_1, link_1) {
    "use strict";
    var InlayHintsAccessibility_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsAccessibility = void 0;
    let InlayHintsAccessibility = class InlayHintsAccessibility {
        static { InlayHintsAccessibility_1 = this; }
        static { this.IsReading = new contextkey_1.RawContextKey('isReadingLineWithInlayHints', false, { type: 'boolean', description: (0, nls_1.localize)('isReadingLineWithInlayHints', "Whether the current line and its inlay hints are currently focused") }); }
        static { this.ID = 'editor.contrib.InlayHintsAccessibility'; }
        static get(editor) {
            return editor.getContribution(InlayHintsAccessibility_1.ID) ?? undefined;
        }
        constructor(_editor, contextKeyService, _accessibilitySignalService, _instaService) {
            this._editor = _editor;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._instaService = _instaService;
            this._sessionDispoosables = new lifecycle_1.DisposableStore();
            this._ariaElement = document.createElement('span');
            this._ariaElement.style.position = 'fixed';
            this._ariaElement.className = 'inlayhint-accessibility-element';
            this._ariaElement.tabIndex = 0;
            this._ariaElement.setAttribute('aria-description', (0, nls_1.localize)('description', "Code with Inlay Hint Information"));
            this._ctxIsReading = InlayHintsAccessibility_1.IsReading.bindTo(contextKeyService);
        }
        dispose() {
            this._sessionDispoosables.dispose();
            this._ctxIsReading.reset();
            this._ariaElement.remove();
        }
        _reset() {
            dom.clearNode(this._ariaElement);
            this._sessionDispoosables.clear();
            this._ctxIsReading.reset();
        }
        async _read(line, hints) {
            this._sessionDispoosables.clear();
            if (!this._ariaElement.isConnected) {
                this._editor.getDomNode()?.appendChild(this._ariaElement);
            }
            if (!this._editor.hasModel() || !this._ariaElement.isConnected) {
                this._ctxIsReading.set(false);
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            this._sessionDispoosables.add(cts);
            for (const hint of hints) {
                await hint.resolve(cts.token);
            }
            if (cts.token.isCancellationRequested) {
                return;
            }
            const model = this._editor.getModel();
            // const text = this._editor.getModel().getLineContent(line);
            const newChildren = [];
            let start = 0;
            let tooLongToRead = false;
            for (const item of hints) {
                // text
                const part = model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: item.hint.position.column });
                if (part.length > 0) {
                    newChildren.push(part);
                    start = item.hint.position.column - 1;
                }
                // check length
                if (start > 750) {
                    newChildren.push('…');
                    tooLongToRead = true;
                    break;
                }
                // hint
                const em = document.createElement('em');
                const { label } = item.hint;
                if (typeof label === 'string') {
                    em.innerText = label;
                }
                else {
                    for (const part of label) {
                        if (part.command) {
                            const link = this._instaService.createInstance(link_1.Link, em, { href: (0, inlayHints_1.asCommandLink)(part.command), label: part.label, title: part.command.title }, undefined);
                            this._sessionDispoosables.add(link);
                        }
                        else {
                            em.innerText += part.label;
                        }
                    }
                }
                newChildren.push(em);
            }
            // trailing text
            if (!tooLongToRead) {
                newChildren.push(model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: Number.MAX_SAFE_INTEGER }));
            }
            dom.reset(this._ariaElement, ...newChildren);
            this._ariaElement.focus();
            this._ctxIsReading.set(true);
            // reset on blur
            this._sessionDispoosables.add(dom.addDisposableListener(this._ariaElement, 'focusout', () => {
                this._reset();
            }));
        }
        startInlayHintsReading() {
            if (!this._editor.hasModel()) {
                return;
            }
            const line = this._editor.getPosition().lineNumber;
            const hints = inlayHintsController_1.InlayHintsController.get(this._editor)?.getInlayHintsForLine(line);
            if (!hints || hints.length === 0) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.noInlayHints);
            }
            else {
                this._read(line, hints);
            }
        }
        stopInlayHintsReading() {
            this._reset();
            this._editor.focus();
        }
    };
    exports.InlayHintsAccessibility = InlayHintsAccessibility;
    exports.InlayHintsAccessibility = InlayHintsAccessibility = InlayHintsAccessibility_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(3, instantiation_1.IInstantiationService)
    ], InlayHintsAccessibility);
    (0, actions_1.registerAction2)(class StartReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.startReadingLineWithHint',
                title: (0, nls_1.localize2)('read.title', "Read Line With Inline Hints"),
                precondition: editorContextKeys_1.EditorContextKeys.hasInlayHintsProvider,
                f1: true
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            ctrl?.startInlayHintsReading();
        }
    });
    (0, actions_1.registerAction2)(class StopReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.stopReadingLineWithHint',
                title: (0, nls_1.localize2)('stop.title', "Stop Inlay Hints Reading"),
                precondition: InlayHintsAccessibility.IsReading,
                f1: true,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            ctrl?.stopInlayHintsReading();
        }
    });
    (0, editorExtensions_1.registerEditorContribution)(InlayHintsAccessibility.ID, InlayHintsAccessibility, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0FjY2Vzc2liaWx0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5sYXlIaW50cy9icm93c2VyL2lubGF5SGludHNBY2Nlc3NpYmlsdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFCekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7O2lCQUVuQixjQUFTLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDZCQUE2QixFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLG9FQUFvRSxDQUFDLEVBQUUsQ0FBQyxBQUFwTixDQUFxTjtpQkFFOU4sT0FBRSxHQUFXLHdDQUF3QyxBQUFuRCxDQUFvRDtRQUV0RSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBMEIseUJBQXVCLENBQUMsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDO1FBQ2pHLENBQUM7UUFPRCxZQUNrQixPQUFvQixFQUNqQixpQkFBcUMsRUFDNUIsMkJBQXlFLEVBQy9FLGFBQXFEO1lBSDNELFlBQU8sR0FBUCxPQUFPLENBQWE7WUFFUyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBQzlELGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQU41RCx5QkFBb0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVE3RCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUMzQyxJQUFJLENBQUMs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
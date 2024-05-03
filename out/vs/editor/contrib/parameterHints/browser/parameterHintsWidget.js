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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/languages/language", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/css!./parameterHints"], function (require, exports, dom, aria, scrollableElement_1, codicons_1, event_1, lifecycle_1, strings_1, types_1, language_1, markdownRenderer_1, provideSignatureHelp_1, nls, contextkey_1, opener_1, colorRegistry_1, iconRegistry_1, themables_1) {
    "use strict";
    var ParameterHintsWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParameterHintsWidget = void 0;
    const $ = dom.$;
    const parameterHintsNextIcon = (0, iconRegistry_1.registerIcon)('parameter-hints-next', codicons_1.Codicon.chevronDown, nls.localize('parameterHintsNextIcon', 'Icon for show next parameter hint.'));
    const parameterHintsPreviousIcon = (0, iconRegistry_1.registerIcon)('parameter-hints-previous', codicons_1.Codicon.chevronUp, nls.localize('parameterHintsPreviousIcon', 'Icon for show previous parameter hint.'));
    let ParameterHintsWidget = class ParameterHintsWidget extends lifecycle_1.Disposable {
        static { ParameterHintsWidget_1 = this; }
        static { this.ID = 'editor.widget.parameterHintsWidget'; }
        constructor(editor, model, contextKeyService, openerService, languageService) {
            super();
            this.editor = editor;
            this.model = model;
            this.renderDisposeables = this._register(new lifecycle_1.DisposableStore());
            this.visible = false;
            this.announcedLabel = null;
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer({ editor }, languageService, openerService));
            this.keyVisible = provideSignatureHelp_1.Context.Visible.bindTo(contextKeyService);
            this.keyMultipleSignatures = provideSignatureHelp_1.Context.MultipleSignatures.bindTo(contextKeyService);
        }
        createParameterHintDOMNodes() {
            const element = $('.editor-widget.parameter-hints-widget');
            const wrapper = dom.append(element, $('.phwrapper'));
            wrapper.tabIndex = -1;
            const controls = dom.append(wrapper, $('.controls'));
            const previous = dom.append(controls, $('.button' + themables_1.ThemeIcon.asCSSSelector(parameterHintsPreviousIcon)));
            const overloads = dom.append(controls, $('.overloads'));
            const next = dom.append(controls, $('.button' + themables_1.ThemeIcon.asCSSSelector(parameterHintsNextIcon)));
            this._register(dom.addDisposableListener(previous, 'click', e => {
                dom.EventHelper.stop(e);
                this.previous();
            }));
            this._register(dom.addDisposableListener(next, 'click', e => {
                dom.EventHelper.stop(e);
                this.next();
            }));
            const body = $('.body');
            const scrollbar = new scrollableElement_1.DomScrollableElement(body, {
                alwaysConsumeMouseWheel: true,
            });
            this._register(scrollbar);
            wrapper.appendChild(scrollbar.getDomNode());
            const signature = dom.append(body, $('.signature'));
            const docs = dom.append(body, $('.docs'));
            element.style.userSelect = 'text';
            this.domNodes = {
                element,
                signature,
                overloads,
                docs,
                scrollbar,
            };
            this.editor.addContentWidget(this);
            this.hide();
            this._register(this.editor.onDidChangeCursorSelection(e => {
                if (this.visible) {
                    this.editor.layoutContentWidget(this);
                }
            }));
            const updateFont = () => {
                if (!this.domNodes) {
                    return;
                }
                const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
                this.domNodes.element.style.fontSize = `${fontInfo.fontSize}px`;
                this.domNodes.element.style.lineHeight = `${fontInfo.lineHeight / fontInfo.fontSize}`;
            };
            updateFont();
            this._register(event_1.Event.chain(this.editor.onDidChangeConfiguration.bind(this.editor), $ => $.filter(e => e.hasChanged(50 /* EditorOption.fontInfo */)))(updateFont));
            this._register(this.editor.onDidLayoutChange(e => this.updateMaxHeight()));
            this.updateMaxHeight();
        }
        show() {
            if (this.visible) {
                return;
            }
            if (!this.domNodes) {
                this.createParameterHintDOMNodes();
            }
            this.keyVisible.set(true);
            this.visible = true;
            setTimeout(() => {
                this.domNodes?.element.classList.add('visible');
            }, 100);
            this.editor.layoutContentWidget(this);
        }
        hide() {
            this.renderDisposeables.clear();
            if (!this.visible) {
                return;
            }
            this.keyVisible.reset();
            this.visible = false;
            this.announcedLabel = null;
            this.domNodes?.element.classList.remove('visible');
            this.editor.layoutContentWidget(this);
        }
        getPosition() {
            if (this.visible) {
                return {
                    position: this.editor.getPosition(),
                    preference: [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */]
                };
            }
            return null;
        }
        render(hints) {
            this.renderDisposeables.clear();
            if (!this.domNodes) {
                return;
            }
            const multiple = hints.signatures.length > 1;
            this.domNodes.element.classList.toggle('multiple', multiple);
            this.keyMultipleSignatures.set(multiple);
            this.domNodes.signature.innerText = '';
            this.domNodes.docs.innerText = '';
            const signature = hints.signatures[hints.activeSignature];
            if (!signature) {
                return;
            }
            const code = dom.append(this.domNodes.signature, $('.code'));
            const fontInfo = this.editor.getOption(50 /* EditorOption.fontInfo */);
            code.style.fontSize = `${fontInfo.fontSize}px`;
            code.style.fontFamily = fontInfo.fontFamily;
            const hasParameters = signature.parameters.length > 0;
            const activeParameterIndex = signature.activeParameter ?? hints.activeParameter;
            if (!hasParameters) {
                const label = dom.append(code, $('span'));
                label.textContent = signature.label;
            }
            else {
                this.renderParameters(code, signature, activeParameterIndex);
            }
            const activeParameter = signature.parameters[activeParameterIndex];
            if (activeParameter?.documentation) {
                const documentation = $('span.documentation');
                if (typeof activeParameter.documentation === 'string') {
                    documentation.textContent = activeParameter.documentation;
                }
                else {
                    const renderedContents = this.renderMarkdownDocs(activeParameter.documentation);
                    documentation.appendChild(renderedContents.element);
                }
                dom.append(this.domNodes.docs, $('p', {}, documentation));
            }
            if (signature.documentation === undefined) {
                /** no op */
            }
            else if (typeof signature.documentation === 'string') {
                dom.append(this.domNodes.docs, $('p', {}, signature.documentation));
            }
            else {
                const renderedContents = this.renderMarkdownDocs(signature.documentation);
                dom.append(this.domNodes.docs, renderedContents.element);
            }
            const hasDocs = this.hasDocs(signature, activeParameter);
            this.domNodes.signature.classList.toggle('has-docs', hasDocs);
            this.domNodes.docs.classList.toggle('empty', !hasDocs);
            this.domNodes.overloads.textContent =
                String(hints.activeSignature + 1).padStart(hints.signatures.length.toString().length, '0') + '/' + hints.signatures.length;
            if (activeParameter) {
                let labelToAnnounce = '';
                const param = signature.parameters[activeParameterIndex];
                if (Array.isArray(param.label)) {
                    labelToAnnounce = signature.label.substring(param.label[0], param.label[1]);
                }
                else {
                    labelToAnnounce = param.label;
                }
                if (param.documentation) {
                    labelToAnnounce += typeof param.documentation === 'string' ? `, ${param.documentation}` : `, ${param.documentation.value}`;
                }
                if (signature.documentation) {
                    labelToAnnounce += typeof signature.documentation === 'string' ? `, ${signature.documentation}` : `, ${signature.documentation.value}`;
                }
                // Select method gets called on every user type while parameter hints are visible.
                // We do not want to spam the user with same announcements, so we only announce if the current parameter changed.
                if (this.announcedLabel !== labelToAnnounce) {
                    aria.alert(nls.localize('hint', "{0}, hint", labelToAnnounce));
                    this.announcedLabel = labelToAnnounce;
                }
            }
            this.editor.layoutContentWidget(this);
            this.domNodes.scrollbar.scanDomNode();
        }
        renderMarkdownDocs(markdown) {
            const renderedContents = this.renderDisposeables.add(this.markdownRenderer.render(markdown, {
                asyncRenderCallback: () => {
                    this.domNodes?.scrollbar.scanDomNode();
                }
            }));
            renderedContents.element.classList.add('markdown-docs');
            return renderedContents;
        }
        hasDocs(signature, activeParameter) {
            if (activeParameter && typeof activeParameter.documentation === 'string' && (0, types_1.assertIsDefined)(activeParameter.documentation).length > 0) {
                return true;
            }
            if (activeParameter && typeof activeParameter.documentation === 'object' && (0, types_1.assertIsDefined)(activeParameter.documentation).value.length > 0) {
                return true;
            }
            if (signature.documentation && typeof signature.documentation === 'string' && (0, types_1.assertIsDefined)(signature.documentation).length > 0) {
                return true;
            }
            if (signature.documentation && typeof signature.documentation === 'object' && (0, types_1.assertIsDefined)(signature.documentation.value).length > 0) {
                return true;
            }
            return false;
        }
        renderParameters(parent, signature, activeParameterIndex) {
            const [start, end] = this.getParameterLabelOffsets(signature, activeParameterIndex);
            const beforeSpan = document.createElement('span');
            beforeSpan.textContent = signature.label.substring(0, start);
            const paramSpan = document.createElement('span');
            paramSpan.textContent = signature.label.substring(start, end);
            paramSpan.className = 'parameter active';
            const afterSpan = document.createElement('span');
            afterSpan.textContent = signature.label.substring(end);
            dom.append(parent, beforeSpan, paramSpan, afterSpan);
        }
        getParameterLabelOffsets(signature, paramIdx) {
            const param = signature.parameters[paramIdx];
            if (!param) {
                return [0, 0];
            }
            else if (Array.isArray(param.label)) {
                return param.label;
            }
            else if (!param.label.length) {
                return [0, 0];
            }
            else {
                const regex = new RegExp(`(\\W|^)${(0, strings_1.escapeRegExpCharacters)(param.label)}(?=\\W|$)`, 'g');
                regex.test(signature.label);
                const idx = regex.lastIndex - param.label.length;
                return idx >= 0
                    ? [idx, regex.lastIndex]
                    : [0, 0];
            }
        }
        next() {
            this.editor.focus();
            this.model.next();
        }
        previous() {
            this.editor.focus();
            this.model.previous();
        }
        getDomNode() {
            if (!this.domNodes) {
                this.createParameterHintDOMNodes();
            }
            return this.domNodes.element;
        }
        getId() {
            return ParameterHintsWidget_1.ID;
        }
        updateMaxHeight() {
            if (!this.domNodes) {
                return;
            }
            const height = Math.max(this.editor.getLayoutInfo().height / 4, 250);
            const maxHeight = `${height}px`;
            this.domNodes.element.style.maxHeight = maxHeight;
            const wrapper = this.domNodes.element.getElementsByClassName('phwrapper');
            if (wrapper.length) {
                wrapper[0].style.maxHeight = maxHeight;
            }
        }
    };
    exports.ParameterHintsWidget = ParameterHintsWidget;
    exports.ParameterHintsWidget = ParameterHintsWidget = ParameterHintsWidget_1 = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, opener_1.IOpenerService),
        __param(4, language_1.ILanguageService)
    ], ParameterHintsWidget);
    (0, colorRegistry_1.registerColor)('editorHoverWidget.highlightForeground', { dark: colorRegistry_1.listHighlightForeground, light: colorRegistry_1.listHighlightForeground, hcDark: colorRegistry_1.listHighlightForeground, hcLight: colorRegistry_1.listHighlightForeground }, nls.localize('editorHoverWidgetHighlightForeground', 'Foreground color of the active item in the parameter hint.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVySGludHNXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3BhcmFtZXRlckhpbnRzL2Jyb3dzZXIvcGFyYW1ldGVySGludHNXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixNQUFNLHNCQUFzQixHQUFHLElBQUEsMkJBQVksRUFBQyxzQkFBc0IsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztJQUN2SyxNQUFNLDBCQUEwQixHQUFHLElBQUEsMkJBQVksRUFBQywwQkFBMEIsRUFBRSxrQkFBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQztJQUU5SyxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFFM0IsT0FBRSxHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztRQXFCbEUsWUFDa0IsTUFBbUIsRUFDbkIsS0FBMEIsRUFDdkIsaUJBQXFDLEVBQ3pDLGFBQTZCLEVBQzNCLGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBTlMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixVQUFLLEdBQUwsS0FBSyxDQUFxQjtZQXBCM0IsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBWXBFLFlBQU8sR0FBWSxLQUFLLENBQUM7WUFDekIsbUJBQWMsR0FBa0IsSUFBSSxDQUFDO1lBRTdDLDRDQUE0QztZ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
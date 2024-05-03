/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/characterClassifier", "vs/editor/common/languages", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, characterClassifier_1, languages, provideSignatureHelp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParameterHintsModel = void 0;
    var ParameterHintState;
    (function (ParameterHintState) {
        let Type;
        (function (Type) {
            Type[Type["Default"] = 0] = "Default";
            Type[Type["Active"] = 1] = "Active";
            Type[Type["Pending"] = 2] = "Pending";
        })(Type = ParameterHintState.Type || (ParameterHintState.Type = {}));
        ParameterHintState.Default = { type: 0 /* Type.Default */ };
        class Pending {
            constructor(request, previouslyActiveHints) {
                this.request = request;
                this.previouslyActiveHints = previouslyActiveHints;
                this.type = 2 /* Type.Pending */;
            }
        }
        ParameterHintState.Pending = Pending;
        class Active {
            constructor(hints) {
                this.hints = hints;
                this.type = 1 /* Type.Active */;
            }
        }
        ParameterHintState.Active = Active;
    })(ParameterHintState || (ParameterHintState = {}));
    class ParameterHintsModel extends lifecycle_1.Disposable {
        static { this.DEFAULT_DELAY = 120; } // ms
        constructor(editor, providers, delay = ParameterHintsModel.DEFAULT_DELAY) {
            super();
            this._onChangedHints = this._register(new event_1.Emitter());
            this.onChangedHints = this._onChangedHints.event;
            this.triggerOnType = false;
            this._state = ParameterHintState.Default;
            this._pendingTriggers = [];
            this._lastSignatureHelpResult = this._register(new lifecycle_1.MutableDisposable());
            this.triggerChars = new characterClassifier_1.CharacterSet();
            this.retriggerChars = new characterClassifier_1.CharacterSet();
            this.triggerId = 0;
            this.editor = editor;
            this.providers = providers;
            this.throttledDelayer = new async_1.Delayer(delay);
            this._register(this.editor.onDidBlurEditorWidget(() => this.cancel()));
            this._register(this.editor.onDidChangeConfiguration(() => this.onEditorConfigurationChange()));
            this._register(this.editor.onDidChangeModel(e => this.onModelChanged()));
            this._register(this.editor.onDidChangeModelLanguage(_ => this.onModelChanged()));
            this._register(this.editor.onDidChangeCursorSelection(e => this.onCursorChange(e)));
            this._register(this.editor.onDidChangeModelContent(e => this.onModelContentChange()));
            this._register(this.providers.onDidChange(this.onModelChanged, this));
            this._register(this.editor.onDidType(text => this.onDidType(text)));
            this.onEditorConfigurationChange();
            this.onModelChanged();
        }
        get state() { return this._state; }
        set state(value) {
            if (this._state.type === 2 /* ParameterHintState.Type.Pending */) {
                this._state.request.cancel();
            }
            this._state = value;
        }
        cancel(silent = false) {
            this.state = ParameterHintState.Default;
            this.throttledDelayer.cancel();
            if (!silent) {
                this._onChangedHints.fire(undefined);
            }
        }
        trigger(context, delay) {
            const model = this.editor.getModel();
            if (!model || !this.providers.has(model)) {
                return;
            }
            const triggerId = ++this.triggerId;
            this._pendingTriggers.push(context);
            this.throttledDelayer.trigger(() => {
                return this.doTrigger(triggerId);
            }, delay)
                .catch(errors_1.onUnexpectedError);
        }
        next() {
            if (this.state.type !== 1 /* ParameterHintState.Type.Active */) {
                return;
            }
            const length = this.state.hints.signatures.length;
            const activeSignature = this.state.hints.activeSignature;
            const last = (activeSignature % length) === (length - 1);
            const cycle = this.editor.getOption(86 /* EditorOption.parameterHints */).cycle;
            // If there is only one signature, or we're on last signature of list
            if ((length < 2 || last) && !cycle) {
                this.cancel();
                return;
            }
            this.updateActiveSignature(last && cycle ? 0 : activeSignature + 1);
        }
        previous() {
            if (this.state.type !== 1 /* ParameterHintState.Type.Active */) {
                return;
            }
            const length = this.state.hints.signatures.length;
            const activeSignature = this.state.hints.activeSignature;
            const first = activeSignature === 0;
            const cycle = this.editor.getOption(86 /* EditorOption.parameterHints */).cycle;
            // If there is only one signature, or we're on first signature of list
            if ((length < 2 || first) && !cycle) {
                this.cancel();
                return;
            }
            this.updateActiveSignature(first && cycle ? length - 1 : activeSignature - 1);
        }
        updateActiveSignature(activeSignature) {
            if (this.state.type !== 1 /* ParameterHintState.Type.Active */) {
                return;
            }
            this.state = new ParameterHintState.Active({ ...this.state.hints, activeSignature });
            this._onChangedHints.fire(this.state.hints);
        }
        async doTrigger(triggerId) {
            const isRetrigger = this.state.type === 1 /* ParameterHintState.Type.Active */ || this.state.type === 2 /* ParameterHintState.Type.Pending */;
            const activeSignatureHelp = this.getLastActiveHints();
            this.cancel(true);
            if (this._pendingTriggers.length === 0) {
                return false;
            }
            const context = this._pendingTriggers.reduce(mergeTriggerContexts);
            this._pendingTriggers = [];
            const triggerContext = {
                triggerKind: context.triggerKind,
                triggerCharacter: context.triggerCharacter,
                isRetrigger: isRetrigger,
                activeSignatureHelp: activeSignatureHelp
            };
            if (!this.editor.hasModel()) {
                return false;
            }
            const model = this.editor.getModel();
            const position = this.editor.getPosition();
            this.state = new ParameterHintState.Pending((0, async_1.createCancelablePromise)(token => (0, provideSignatureHelp_1.provideSignatureHelp)(this.providers, model, position, triggerContext, token)), activeSignatureHelp);
            try {
                const result = await this.state.request;
                // Check that we are still resolving the correct signature help
                if (triggerId !== this.triggerId) {
                    result?.dispose();
                    return false;
                }
                if (!result || !result.value.signatures || result.value.signatures.length === 0) {
                    result?.dispose();
                    this._lastSignatureHelpResult.clear();
                    this.cancel();
                    return false;
                }
                else {
                    this.state = new ParameterHintState.Active(result.value);
                    this._lastSignatureHelpResult.value = result;
                    this._onChangedHints.fire(this.state.hints);
                    return true;
                }
            }
            catch (error) {
                if (triggerId === this.triggerId) {
                    this.state = ParameterHintState.Default;
                }
                (0, errors_1.onUnexpectedError)(error);
                return false;
            }
        }
        getLastActiveHints() {
            switch (this.state.type) {
                case 1 /* ParameterHintState.Type.Active */: return this.state.hints;
                case 2 /* ParameterHintState.Type.Pending */: return this.state.previouslyActiveHints;
                default: return undefined;
            }
        }
        get isTriggered() {
            return this.state.type === 1 /* ParameterHintState.Type.Active */
                || this.state.type === 2 /* ParameterHintState.Type.Pending */
                || this.throttledDelayer.isTriggered();
        }
        onModelChanged() {
            this.cancel();
            this.triggerChars.clear();
            this.retriggerChars.clear();
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            for (const support of this.providers.ordered(model)) {
                for (const ch of support.signatureHelpTriggerCharacters || []) {
                    if (ch.length) {
                        const charCode = ch.charCodeAt(0);
                        this.triggerChars.add(charCode);
                        // All trigger characters are also considered retrigger characters
                        this.retriggerChars.add(charCode);
                    }
                }
                for (const ch of support.signatureHelpRetriggerCharacters || []) {
                    if (ch.length) {
                        this.retriggerChars.add(ch.charCodeAt(0));
                    }
                }
            }
        }
        onDidType(text) {
            if (!this.triggerOnType) {
                return;
            }
            const lastCharIndex = text.length - 1;
            const triggerCharCode = text.charCodeAt(lastCharIndex);
            if (this.triggerChars.has(triggerCharCode) || this.isTriggered && this.retriggerChars.has(triggerCharCode)) {
                this.trigger({
                    triggerKind: languages.SignatureHelpTriggerKind.TriggerCharacter,
                    triggerCharacter: text.charAt(lastCharIndex),
                });
            }
        }
        onCursorChange(e) {
            if (e.source === 'mouse') {
                this.cancel();
            }
            else if (this.isTriggered) {
                this.trigger({ triggerKind: languages.SignatureHelpTriggerKind.ContentChange });
            }
        }
        onModelContentChange() {
            if (this.isTriggered) {
                this.trigger({ triggerKind: languages.SignatureHelpTriggerKind.ContentChange });
            }
        }
        onEditorConfigurationChange() {
            this.triggerOnType = this.editor.getOption(86 /* EditorOption.parameterHints */).enabled;
            if (!this.triggerOnType) {
                this.cancel();
            }
        }
        dispose() {
            this.cancel(true);
            super.dispose();
        }
    }
    exports.ParameterHintsModel = ParameterHintsModel;
    function mergeTriggerContexts(previous, current) {
        switch (current.triggerKind) {
            case languages.SignatureHelpTriggerKind.Invoke:
                // Invoke overrides previous triggers.
                return current;
            case languages.SignatureHelpTriggerKind.ContentChange:
                // Ignore content changes triggers
                return previous;
            case languages.SignatureHelpTriggerKind.TriggerCharacter:
            default:
                return current;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVySGludHNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcGFyYW1ldGVySGludHMvYnJvd3Nlci9wYXJhbWV0ZXJIaW50c01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsSUFBVSxrQkFBa0IsQ0F5QjNCO0lBekJELFdBQVUsa0JBQWtCO1FBQzNCLElBQWtCLElBSWpCO1FBSkQsV0FBa0IsSUFBSTtZQUNyQixxQ0FBTyxDQUFBO1lBQ1AsbUNBQU0sQ0FBQTtZQUNOLHFDQUFPLENBQUE7UUFDUixDQUFDLEVBSmlCLElBQUksR0FBSix1QkFBSSxLQUFKLHVCQUFJLFFBSXJCO1FBRVksMEJBQU8sR0FBRyxFQUFFLElBQUksc0JBQWMsRUFBVyxDQUFDO1FBRXZELE1BQWEsT0FBTztZQUVuQixZQUNVLE9BQTRFLEVBQzVFLHFCQUEwRDtnQkFEMUQsWUFBTyxHQUFQLE9BQU8sQ0FBcUU7Z0JBQzVFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBcUM7Z0JBSDNELFNBQUksd0JBQWdCO1lBSXpCLENBQUM7U0FDTDtRQU5ZLDBCQUFPLFVBTW5CLENBQUE7UUFFRCxNQUFhLE1BQU07WUFFbEIsWUFDVSxLQUE4QjtnQkFBOUIsVUFBSyxHQUFMLEtBQUssQ0FBeUI7Z0JBRi9CLFNBQUksdUJBQWU7WUFHeEIsQ0FBQztTQUNMO1FBTFkseUJBQU0sU0FLbEIsQ0FBQTtJQUdGLENBQUMsRUF6QlMsa0JBQWtCLEtBQWxCLGtCQUFrQixRQXlCM0I7SUFFRCxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO2lCQUUxQixrQkFBYSxHQUFHLEdBQUcsQUFBTixDQUFPLEdBQUMsS0FBSztRQW1CbEQsWUFDQyxNQUFtQixFQUNuQixTQUFtRSxFQUNuRSxRQUFnQixtQkFBbUIsQ0FB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
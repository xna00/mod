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
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorOptions", "vs/editor/common/model/textModel", "vs/editor/common/services/unicodeTextModelHighlighter", "vs/editor/common/services/editorWorker", "vs/editor/common/languages/language", "vs/editor/common/viewModel/viewModelDecorations", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/unicodeHighlighter/browser/bannerController", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/iconRegistry", "vs/platform/workspace/common/workspaceTrust", "vs/css!./unicodeHighlighter"], function (require, exports, async_1, codicons_1, htmlContent_1, lifecycle_1, platform, strings_1, editorExtensions_1, editorOptions_1, textModel_1, unicodeTextModelHighlighter_1, editorWorker_1, language_1, viewModelDecorations_1, hoverTypes_1, markdownHoverParticipant_1, bannerController_1, nls, configuration_1, instantiation_1, opener_1, quickInput_1, iconRegistry_1, workspaceTrust_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowExcludeOptions = exports.DisableHighlightingOfNonBasicAsciiCharactersAction = exports.DisableHighlightingOfInvisibleCharactersAction = exports.DisableHighlightingOfAmbiguousCharactersAction = exports.DisableHighlightingInStringsAction = exports.DisableHighlightingInCommentsAction = exports.UnicodeHighlighterHoverParticipant = exports.UnicodeHighlighterHover = exports.UnicodeHighlighter = exports.warningIcon = void 0;
    exports.warningIcon = (0, iconRegistry_1.registerIcon)('extensions-warning-message', codicons_1.Codicon.warning, nls.localize('warningIcon', 'Icon shown with a warning message in the extensions editor.'));
    let UnicodeHighlighter = class UnicodeHighlighter extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.unicodeHighlighter'; }
        constructor(_editor, _editorWorkerService, _workspaceTrustService, instantiationService) {
            super();
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._workspaceTrustService = _workspaceTrustService;
            this._highlighter = null;
            this._bannerClosed = false;
            this._updateState = (state) => {
                if (state && state.hasMore) {
                    if (this._bannerClosed) {
                        return;
                    }
                    // This document contains many non-basic ASCII characters.
                    const max = Math.max(state.ambiguousCharacterCount, state.nonBasicAsciiCharacterCount, state.invisibleCharacterCount);
                    let data;
                    if (state.nonBasicAsciiCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyNonBasicAsciiUnicodeCharacters', 'This document contains many non-basic ASCII unicode characters'),
                            command: new DisableHighlightingOfNonBasicAsciiCharactersAction(),
                        };
                    }
                    else if (state.ambiguousCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyAmbiguousUnicodeCharacters', 'This document contains many ambiguous unicode characters'),
                            command: new DisableHighlightingOfAmbiguousCharactersAction(),
                        };
                    }
                    else if (state.invisibleCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyInvisibleUnicodeCharacters', 'This document contains many invisible unicode characters'),
                            command: new DisableHighlightingOfInvisibleCharactersAction(),
                        };
                    }
                    else {
                        throw new Error('Unreachable');
                    }
                    this._bannerController.show({
                        id: 'unicodeHighlightBanner',
                        message: data.message,
                        icon: exports.warningIcon,
                        actions: [
                            {
                                label: data.command.shortLabel,
                                href: `command:${data.command.id}`
                            }
                        ],
                        onClose: () => {
                            this._bannerClosed = true;
                        },
                    });
                }
                else {
                    this._bannerController.hide();
                }
            };
            this._bannerController = this._register(instantiationService.createInstance(bannerController_1.BannerController, _editor));
            this._register(this._editor.onDidChangeModel(() => {
                this._bannerClosed = false;
                this._updateHighlighter();
            }));
            this._options = _editor.getOption(125 /* EditorOption.unicodeHighlighting */);
            this._register(_workspaceTrustService.onDidChangeTrust(e => {
                this._updateHighlighter();
            }));
            this._register(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(125 /* EditorOption.unicodeHighlighting */)) {
                    this._options = _editor.getOption(125 /* EditorOption.unicodeHighlighting */);
                    this._updateHighlighter();
                }
            }));
            this._updateHighlighter();
        }
        dispose() {
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            super.dispose();
        }
        _updateHighlighter() {
            this._updateState(null);
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const options = resolveOptions(this._workspaceTrustService.isWorkspaceTrusted(), this._options);
            if ([
                options.nonBasicASCII,
                options.ambiguousCharacters,
                options.invisibleCharacters,
            ].every((option) => option === false)) {
                // Don't do anything if the feature is fully disabled
                return;
            }
            const highlightOptions = {
                nonBasicASCII: options.nonBasicASCII,
                ambiguousCharacters: options.ambiguousCharacters,
                invisibleCharacters: options.invisibleCharacters,
                includeComments: options.includeComments,
                includeStrings: options.includeStrings,
                allowedCodePoints: Object.keys(options.allowedCharacters).map(c => c.codePointAt(0)),
                allowedLocales: Object.keys(options.allowedLocales).map(locale => {
                    if (locale === '_os') {
                        const osLocale = new Intl.NumberFormat().resolvedOptions().locale;
                        return osLocale;
                    }
                    else if (locale === '_vscode') {
                        return platform.language;
                    }
                    return locale;
                }),
            };
            if (this._editorWorkerService.canComputeUnicodeHighlights(this._editor.getModel().uri)) {
                this._highlighter = new DocumentUnicodeHighlighter(this._editor, highlightOptions, this._updateState, this._editorWorkerService);
            }
            else {
                this._highlighter = new ViewportUnicodeHighlighter(this._editor, highlightOptions, this._updateState);
            }
        }
        getDecorationInfo(decoration) {
            if (this._highlighter) {
                return this._highlighter.getDecorationInfo(decoration);
            }
            return null;
        }
    };
    exports.UnicodeHighlighter = UnicodeHighlighter;
    exports.UnicodeHighlighter = UnicodeHighlighter = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, instantiation_1.IInstantiationService)
    ], UnicodeHighlighter);
    function resolveOptions(trusted, options) {
        return {
            nonBasicASCII: options.nonBasicASCII === editorOptions_1.inUntrustedWorkspace ? !trusted : options.nonBasicASCII,
            ambiguousCharacters: options.ambiguousCharacters,
            invisibleCharacters: options.invisibleCharacters,
            includeComments: options.includeComments === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeComments,
            includeStrings: options.includeStrings === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeStrings,
            allowedCharacters: options.allowedCharacters,
            allowedLocales: options.allowedLocales,
        };
    }
    let DocumentUnicodeHighlighter = class DocumentUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState, _editorWorkerService) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._editorWorkerService = _editorWorkerService;
            this._model = this._editor.getModel();
            this._decorations = this._editor.createDecorationsCollection();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorations.clear();
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorations.clear();
                return;
            }
            const modelVersionId = this._model.getVersionId();
            this._editorWorkerService
                .computedUnicodeHighlights(this._model.uri, this._options)
                .then((info) => {
                if (this._model.isDisposed()) {
                    return;
                }
                if (this._model.getVersionId() !== modelVersionId) {
                    // model changed in the meantime
                    return;
                }
                this._updateState(info);
                const decorations = [];
                if (!info.hasMore) {
                    // Don't show decoration if there are too many.
                    // In this case, a banner is shown.
                    for (const range of info.ranges) {
                        decorations.push({
                            range: range,
                            options: Decorations.instance.getDecorationFromOptions(this._options),
                        });
                    }
                }
                this._decorations.set(decorations);
            });
        }
        getDecorationInfo(decoration) {
            if (!this._decorations.has(decoration)) {
                return null;
            }
            const model = this._editor.getModel();
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            const text = model.getValueInRange(decoration.range);
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    };
    DocumentUnicodeHighlighter = __decorate([
        __param(3, editorWorker_1.IEditorWorkerService)
    ], DocumentUnicodeHighlighter);
    class ViewportUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._model = this._editor.getModel();
            this._decorations = this._editor.createDecorationsCollection();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidLayoutChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidScrollChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeHiddenAreas(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorations.clear();
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorations.clear();
                return;
            }
            const ranges = this._editor.getVisibleRanges();
            const decorations = [];
            const totalResult = {
                ranges: [],
                ambiguousCharacterCount: 0,
                invisibleCharacterCount: 0,
                nonBasicAsciiCharacterCount: 0,
                hasMore: false,
            };
            for (const range of ranges) {
                const result = unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlights(this._model, this._options, range);
                for (const r of result.ranges) {
                    totalResult.ranges.push(r);
                }
                totalResult.ambiguousCharacterCount += totalResult.ambiguousCharacterCount;
                totalResult.invisibleCharacterCount += totalResult.invisibleCharacterCount;
                totalResult.nonBasicAsciiCharacterCount += totalResult.nonBasicAsciiCharacterCount;
                totalResult.hasMore = totalResult.hasMore || result.hasMore;
            }
            if (!totalResult.hasMore) {
                // Don't show decorations if there are too many.
                // A banner will be shown instead.
                for (const range of totalResult.ranges) {
                    decorations.push({ range, options: Decorations.instance.getDecorationFromOptions(this._options) });
                }
            }
            this._updateState(totalResult);
            this._decorations.set(decorations);
        }
        getDecorationInfo(decoration) {
            if (!this._decorations.has(decoration)) {
                return null;
            }
            const model = this._editor.getModel();
            const text = model.getValueInRange(decoration.range);
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    }
    class UnicodeHighlighterHover {
        constructor(owner, range, decoration) {
            this.owner = owner;
            this.range = range;
            this.decoration = decoration;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.UnicodeHighlighterHover = UnicodeHighlighterHover;
    const configureUnicodeHighlightOptionsStr = nls.localize('unicodeHighlight.configureUnicodeHighlightOptions', 'Configure Unicode Highlight Options');
    let UnicodeHighlighterHoverParticipant = class UnicodeHighlighterHoverParticipant {
        constructor(_editor, _languageService, _openerService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.hoverOrdinal = 5;
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const unicodeHighlighter = this._editor.getContribution(UnicodeHighlighter.ID);
            if (!unicodeHighlighter) {
                return [];
            }
            const result = [];
            const existedReason = new Set();
            let index = 300;
            for (const d of lineDecorations) {
                const highlightInfo = unicodeHighlighter.getDecorationInfo(d);
                if (!highlightInfo) {
                    continue;
                }
                const char = model.getValueInRange(d.range);
                // text refers to a single character.
                const codePoint = char.codePointAt(0);
                const codePointStr = formatCodePointMarkdown(codePoint);
                let reason;
                switch (highlightInfo.reason.kind) {
                    case 0 /* UnicodeHighlighterReasonKind.Ambiguous */: {
                        if ((0, strings_1.isBasicASCII)(highlightInfo.reason.confusableWith)) {
                            reason = nls.localize('unicodeHighlight.characterIsAmbiguousASCII', 'The character {0} could be confused with the ASCII character {1}, which is more common in source code.', codePointStr, formatCodePointMarkdown(highlightInfo.reason.confusableWith.codePointAt(0)));
                        }
                        else {
                            reason = nls.localize('unicodeHighlight.characterIsAmbiguous', 'The character {0} could be confused with the character {1}, which is more common in source code.', codePointStr, formatCodePointMarkdown(highlightInfo.reason.confusableWith.codePointAt(0)));
                        }
                        break;
                    }
                    case 1 /* UnicodeHighlighterReasonKind.Invisible */:
                        reason = nls.localize('unicodeHighlight.characterIsInvisible', 'The character {0} is invisible.', codePointStr);
                        break;
                    case 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */:
                        reason = nls.localize('unicodeHighlight.characterIsNonBasicAscii', 'The character {0} is not a basic ASCII character.', codePointStr);
                        break;
                }
                if (existedReason.has(reason)) {
                    continue;
                }
                existedReason.add(reason);
                const adjustSettingsArgs = {
                    codePoint: codePoint,
                    reason: highlightInfo.reason,
                    inComment: highlightInfo.inComment,
                    inString: highlightInfo.inString,
                };
                const adjustSettings = nls.localize('unicodeHighlight.adjustSettings', 'Adjust settings');
                const uri = `command:${ShowExcludeOptions.ID}?${encodeURIComponent(JSON.stringify(adjustSettingsArgs))}`;
                const markdown = new htmlContent_1.MarkdownString('', true)
                    .appendMarkdown(reason)
                    .appendText(' ')
                    .appendLink(uri, adjustSettings, configureUnicodeHighlightOptionsStr);
                result.push(new markdownHoverParticipant_1.MarkdownHover(this, d.range, [markdown], false, index++));
            }
            return result;
        }
        renderHoverParts(context, hoverParts) {
            return (0, markdownHoverParticipant_1.renderMarkdownHovers)(context, hoverParts, this._editor, this._languageService, this._openerService);
        }
    };
    exports.UnicodeHighlighterHoverParticipant = UnicodeHighlighterHoverParticipant;
    exports.UnicodeHighlighterHoverParticipant = UnicodeHighlighterHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], UnicodeHighlighterHoverParticipant);
    function codePointToHex(codePoint) {
        return `U+${codePoint.toString(16).padStart(4, '0')}`;
    }
    function formatCodePointMarkdown(codePoint) {
        let value = `\`${codePointToHex(codePoint)}\``;
        if (!strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
            // Don't render any control characters or any invisible characters, as they cannot be seen anyways.
            value += ` "${`${renderCodePointAsInlineCode(codePoint)}`}"`;
        }
        return value;
    }
    function renderCodePointAsInlineCode(codePoint) {
        if (codePoint === 96 /* CharCode.BackTick */) {
            return '`` ` ``';
        }
        return '`' + String.fromCodePoint(codePoint) + '`';
    }
    function computeReason(char, options) {
        return unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlightReason(char, options);
    }
    class Decorations {
        constructor() {
            this.map = new Map();
        }
        static { this.instance = new Decorations(); }
        getDecorationFromOptions(options) {
            return this.getDecoration(!options.includeComments, !options.includeStrings);
        }
        getDecoration(hideInComments, hideInStrings) {
            const key = `${hideInComments}${hideInStrings}`;
            let options = this.map.get(key);
            if (!options) {
                options = textModel_1.ModelDecorationOptions.createDynamic({
                    description: 'unicode-highlight',
                    stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                    className: 'unicode-highlight',
                    showIfCollapsed: true,
                    overviewRuler: null,
                    minimap: null,
                    hideInCommentTokens: hideInComments,
                    hideInStringTokens: hideInStrings,
                });
                this.map.set(key, options);
            }
            return options;
        }
    }
    class DisableHighlightingInCommentsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingInComments'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInComments', 'Disable highlighting of characters in comments'),
                alias: 'Disable highlighting of characters in comments',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInComments.shortLabel', 'Disable Highlight In Comments');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeComments, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInCommentsAction = DisableHighlightingInCommentsAction;
    class DisableHighlightingInStringsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingInStrings'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInStrings', 'Disable highlighting of characters in strings'),
                alias: 'Disable highlighting of characters in strings',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInStrings.shortLabel', 'Disable Highlight In Strings');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeStrings, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInStringsAction = DisableHighlightingInStringsAction;
    class DisableHighlightingOfAmbiguousCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters', 'Disable highlighting of ambiguous characters'),
                alias: 'Disable highlighting of ambiguous characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfAmbiguousCharacters.shortLabel', 'Disable Ambiguous Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.ambiguousCharacters, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfAmbiguousCharactersAction = DisableHighlightingOfAmbiguousCharactersAction;
    class DisableHighlightingOfInvisibleCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfInvisibleCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfInvisibleCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfInvisibleCharacters', 'Disable highlighting of invisible characters'),
                alias: 'Disable highlighting of invisible characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfInvisibleCharacters.shortLabel', 'Disable Invisible Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.invisibleCharacters, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfInvisibleCharactersAction = DisableHighlightingOfInvisibleCharactersAction;
    class DisableHighlightingOfNonBasicAsciiCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfNonBasicAsciiCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters', 'Disable highlighting of non basic ASCII characters'),
                alias: 'Disable highlighting of non basic ASCII characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters.shortLabel', 'Disable Non ASCII Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.nonBasicASCII, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfNonBasicAsciiCharactersAction = DisableHighlightingOfNonBasicAsciiCharactersAction;
    class ShowExcludeOptions extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.showExcludeOptions'; }
        constructor() {
            super({
                id: ShowExcludeOptions.ID,
                label: nls.localize('action.unicodeHighlight.showExcludeOptions', "Show Exclude Options"),
                alias: 'Show Exclude Options',
                precondition: undefined
            });
        }
        async run(accessor, editor, args) {
            const { codePoint, reason, inString, inComment } = args;
            const char = String.fromCodePoint(codePoint);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            function getExcludeCharFromBeingHighlightedLabel(codePoint) {
                if (strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return nls.localize('unicodeHighlight.excludeInvisibleCharFromBeingHighlighted', 'Exclude {0} (invisible character) from being highlighted', codePointToHex(codePoint));
                }
                return nls.localize('unicodeHighlight.excludeCharFromBeingHighlighted', 'Exclude {0} from being highlighted', `${codePointToHex(codePoint)} "${char}"`);
            }
            const options = [];
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                for (const locale of reason.notAmbiguousInLocales) {
                    options.push({
                        label: nls.localize("unicodeHighlight.allowCommonCharactersInLanguage", "Allow unicode characters that are more common in the language \"{0}\".", locale),
                        run: async () => {
                            excludeLocaleFromBeingHighlighted(configurationService, [locale]);
                        },
                    });
                }
            }
            options.push({
                label: getExcludeCharFromBeingHighlightedLabel(codePoint),
                run: () => excludeCharFromBeingHighlighted(configurationService, [codePoint])
            });
            if (inComment) {
                const action = new DisableHighlightingInCommentsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (inString) {
                const action = new DisableHighlightingInStringsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                const action = new DisableHighlightingOfAmbiguousCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 1 /* UnicodeHighlighterReasonKind.Invisible */) {
                const action = new DisableHighlightingOfInvisibleCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */) {
                const action = new DisableHighlightingOfNonBasicAsciiCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else {
                expectNever(reason);
            }
            const result = await quickPickService.pick(options, { title: configureUnicodeHighlightOptionsStr });
            if (result) {
                await result.run();
            }
        }
    }
    exports.ShowExcludeOptions = ShowExcludeOptions;
    async function excludeCharFromBeingHighlighted(configurationService, charCodes) {
        const existingValue = configurationService.getValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters);
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            value = existingValue;
        }
        else {
            value = {};
        }
        for (const charCode of charCodes) {
            value[String.fromCodePoint(charCode)] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters, value, 2 /* ConfigurationTarget.USER */);
    }
    async function excludeLocaleFromBeingHighlighted(configurationService, locales) {
        const existingValue = configurationService.inspect(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales).user?.value;
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            // Copy value, as the existing value is read only
            value = Object.assign({}, existingValue);
        }
        else {
            value = {};
        }
        for (const locale of locales) {
            value[locale] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales, value, 2 /* ConfigurationTarget.USER */);
    }
    function expectNever(value) {
        throw new Error(`Unexpected value: ${value}`);
    }
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfAmbiguousCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfInvisibleCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfNonBasicAsciiCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(ShowExcludeOptions);
    (0, editorExtensions_1.registerEditorContribution)(UnicodeHighlighter.ID, UnicodeHighlighter, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    hoverTypes_1.HoverParticipantRegistry.register(UnicodeHighlighterHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pY29kZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi91bmljb2RlSGlnaGxpZ2h0ZXIvYnJvd3Nlci91bmljb2RlSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0NuRixRQUFBLFdBQVcsR0FBRyxJQUFBLDJCQUFZLEVBQUMsNEJBQTRCLEVBQUUsa0JBQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsNkRBQTZELENBQUMsQ0FBQyxDQUFDO0lBRTVLLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7aUJBQzFCLE9BQUUsR0FBRyxtQ0FBbUMsQUFBdEMsQ0FBdUM7UUFRaEUsWUFDa0IsT0FBb0IsRUFDZixvQkFBMkQsRUFDL0Msc0JBQXlFLEVBQ3BGLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUxTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDRSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQzlCLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBa0M7WUFUcEcsaUJBQVksR0FBbUUsSUFBSSxDQUFDO1lBSXBGLGtCQUFhLEdBQVksS0FBSyxDQUFDO1lBeUN0QixpQkFBWSxHQUFHLENBQUMsS0FBc0MsRUFBUSxFQUFFO2dCQUNoRixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzVCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUN4QixPQUFPO29CQUNSLENBQUM7b0JBRUQsMERBQTBEO29CQUMxRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxLQUFL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
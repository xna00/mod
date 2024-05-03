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
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/services/suggest/browser/simpleCompletionItem", "vs/workbench/services/suggest/browser/simpleCompletionModel", "vs/workbench/services/suggest/browser/simpleSuggestWidget", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/contrib/suggest/browser/suggestWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/browser/defaultStyles"], function (require, exports, dom, simpleCompletionItem_1, simpleCompletionModel_1, simpleSuggestWidget_1, codicons_1, event_1, lifecycle_1, suggestWidget_1, instantiation_1, storage_1, colorRegistry_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestAddon = void 0;
    var ShellIntegrationOscPs;
    (function (ShellIntegrationOscPs) {
        // TODO: Pull from elsewhere
        ShellIntegrationOscPs[ShellIntegrationOscPs["VSCode"] = 633] = "VSCode";
    })(ShellIntegrationOscPs || (ShellIntegrationOscPs = {}));
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        VSCodeOscPt["Completions"] = "Completions";
        VSCodeOscPt["CompletionsBash"] = "CompletionsBash";
        VSCodeOscPt["CompletionsBashFirstWord"] = "CompletionsBashFirstWord";
    })(VSCodeOscPt || (VSCodeOscPt = {}));
    /**
     * A map of the pwsh result type enum's value to the corresponding icon to use in completions.
     *
     * | Value | Name              | Description
     * |-------|-------------------|------------
     * | 0     | Text              | An unknown result type, kept as text only
     * | 1     | History           | A history result type like the items out of get-history
     * | 2     | Command           | A command result type like the items out of get-command
     * | 3     | ProviderItem      | A provider item
     * | 4     | ProviderContainer | A provider container
     * | 5     | Property          | A property result type like the property items out of get-member
     * | 6     | Method            | A method result type like the method items out of get-member
     * | 7     | ParameterName     | A parameter name result type like the Parameters property out of get-command items
     * | 8     | ParameterValue    | A parameter value result type
     * | 9     | Variable          | A variable result type like the items out of get-childitem variable:
     * | 10    | Namespace         | A namespace
     * | 11    | Type              | A type name
     * | 12    | Keyword           | A keyword
     * | 13    | DynamicKeyword    | A dynamic keyword
     *
     * @see https://docs.microsoft.com/en-us/dotnet/api/system.management.automation.completionresulttype?view=powershellsdk-7.0.0
     */
    const pwshTypeToIconMap = {
        0: codicons_1.Codicon.symbolText,
        1: codicons_1.Codicon.history,
        2: codicons_1.Codicon.symbolMethod,
        3: codicons_1.Codicon.symbolFile,
        4: codicons_1.Codicon.folder,
        5: codicons_1.Codicon.symbolProperty,
        6: codicons_1.Codicon.symbolMethod,
        7: codicons_1.Codicon.symbolVariable,
        8: codicons_1.Codicon.symbolValue,
        9: codicons_1.Codicon.symbolVariable,
        10: codicons_1.Codicon.symbolNamespace,
        11: codicons_1.Codicon.symbolInterface,
        12: codicons_1.Codicon.symbolKeyword,
        13: codicons_1.Codicon.symbolKeyword
    };
    let SuggestAddon = class SuggestAddon extends lifecycle_1.Disposable {
        constructor(_terminalSuggestWidgetVisibleContextKey, _instantiationService) {
            super();
            this._terminalSuggestWidgetVisibleContextKey = _terminalSuggestWidgetVisibleContextKey;
            this._instantiationService = _instantiationService;
            this._enableWidget = true;
            this._cursorIndexDelta = 0;
            this._onBell = this._register(new event_1.Emitter());
            this.onBell = this._onBell.event;
            this._onAcceptedCompletion = this._register(new event_1.Emitter());
            this.onAcceptedCompletion = this._onAcceptedCompletion.event;
            // TODO: These aren't persisted across reloads
            // TODO: Allow triggering anywhere in the first word based on the cached completions
            this._cachedBashAliases = new Set();
            this._cachedBashBuiltins = new Set();
            this._cachedBashCommands = new Set();
            this._cachedBashKeywords = new Set();
        }
        activate(xterm) {
            this._terminal = xterm;
            this._register(xterm.parser.registerOscHandler(633 /* ShellIntegrationOscPs.VSCode */, data => {
                return this._handleVSCodeSequence(data);
            }));
            this._register(xterm.onData(e => {
                this._handleTerminalInput(e);
            }));
        }
        setPanel(panel) {
            this._panel = panel;
        }
        setScreen(screen) {
            this._screen = screen;
        }
        _handleVSCodeSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            const [command, ...args] = data.split(';');
            switch (command) {
                case "Completions" /* VSCodeOscPt.Completions */:
                    this._handleCompletionsSequence(this._terminal, data, command, args);
                    return true;
                case "CompletionsBash" /* VSCodeOscPt.CompletionsBash */:
                    this._handleCompletionsBashSequence(this._terminal, data, command, args);
                    return true;
                case "CompletionsBashFirstWord" /* VSCodeOscPt.CompletionsBashFirstWord */:
                    return this._handleCompletionsBashFirstWordSequence(this._terminal, data, command, args);
            }
            // Unrecognized sequence
            return false;
        }
        _handleCompletionsSequence(terminal, data, command, args) {
            // Nothing to handle if the terminal is not attached
            if (!terminal.element || !this._enableWidget) {
                return;
            }
            const replacementIndex = parseInt(args[0]);
            const replacementLength = parseInt(args[1]);
            if (!args[3]) {
                this._onBell.fire();
                return;
            }
            let completionList = JSON.parse(data.slice(command.length + args[0].length + args[1].length + args[2].length + 4 /*semi-colons*/));
            if (!Array.isArray(completionList)) {
                completionList = [completionList];
            }
            const completions = completionList.map((e) => {
                return new simpleCompletionItem_1.SimpleCompletionItem({
                    label: e.CompletionText,
                    icon: pwshTypeToIconMap[e.ResultType],
                    detail: e.ToolTip
                });
            });
            this._leadingLineContent = completions[0].completion.label.slice(0, replacementLength);
            this._cursorIndexDelta = 0;
            const model = new simpleCompletionModel_1.SimpleCompletionModel(completions, new simpleCompletionModel_1.LineContext(this._leadingLineContent, replacementIndex), replacementIndex, replacementLength);
            if (completions.length === 1) {
                const insertText = completions[0].completion.label.substring(replacementLength);
                if (insertText.length === 0) {
                    this._onBell.fire();
                    return;
                }
            }
            this._handleCompletionModel(model);
        }
        _handleCompletionsBashFirstWordSequence(terminal, data, command, args) {
            const type = args[0];
            const completionList = data.slice(command.length + type.length + 2 /*semi-colons*/).split(';');
            let set;
            switch (type) {
                case 'alias':
                    set = this._cachedBashAliases;
                    break;
                case 'builtin':
                    set = this._cachedBashBuiltins;
                    break;
                case 'command':
                    set = this._cachedBashCommands;
                    break;
                case 'keyword':
                    set = this._cachedBashKeywords;
                    break;
                default: return false;
            }
            set.clear();
            const distinctLabels = new Set();
            for (const label of completionList) {
                distinctLabels.add(label);
            }
            for (const label of distinctLabels) {
                set.add(new simpleCompletionItem_1.SimpleCompletionItem({
                    label,
                    icon: codicons_1.Codicon.symbolString,
                    detail: type
                }));
            }
            // Invalidate compound list cache
            this._cachedFirstWord = undefined;
            return true;
        }
        _handleCompletionsBashSequence(terminal, data, command, args) {
            // Nothing to handle if the terminal is not attached
            if (!terminal.element) {
                return;
            }
            let replacementIndex = parseInt(args[0]);
            const replacementLength = parseInt(args[1]);
            if (!args[2]) {
                this._onBell.fire();
                return;
            }
            const completionList = data.slice(command.length + args[0].length + args[1].length + args[2].length + 4 /*semi-colons*/).split(';');
            // TODO: Create a trigger suggest command which encapsulates sendSequence and uses cached if available
            let completions;
            // TODO: This 100 is a hack just for the prototype, this should get it based on some terminal input model
            if (replacementIndex !== 100 && completionList.length > 0) {
                completions = completionList.map(label => {
                    return new simpleCompletionItem_1.SimpleCompletionItem({
                        label: label,
                        icon: codicons_1.Codicon.symbolProperty
                    });
                });
            }
            else {
                replacementIndex = 0;
                if (!this._cachedFirstWord) {
                    this._cachedFirstWord = [
                        ...this._cachedBashAliases,
                        ...this._cachedBashBuiltins,
                        ...this._cachedBashCommands,
                        ...this._cachedBashKeywords
                    ];
                    this._cachedFirstWord.sort((a, b) => {
                        const aCode = a.completion.label.charCodeAt(0);
                        const bCode = b.completion.label.charCodeAt(0);
                        const isANonAlpha = aCode < 65 || aCode > 90 && aCode < 97 || aCode > 122 ? 1 : 0;
                        const isBNonAlpha = bCode < 65 || bCode > 90 && bCode < 97 || bCode > 122 ? 1 : 0;
                        if (isANonAlpha !== isBNonAlpha) {
                            return isANonAlpha - isBNonAlpha;
                        }
                        return a.completion.label.localeCompare(b.completion.label);
                    });
                }
                completions = this._cachedFirstWord;
            }
            if (completions.length === 0) {
                return;
            }
            this._leadingLineContent = completions[0].completion.label.slice(0, replacementLength);
            const model = new simpleCompletionModel_1.SimpleCompletionModel(completions, new simpleCompletionModel_1.LineContext(this._leadingLineContent, replacementIndex), replacementIndex, replacementLength);
            if (completions.length === 1) {
                const insertText = completions[0].completion.label.substring(replacementLength);
                if (insertText.length === 0) {
                    this._onBell.fire();
                    return;
                }
            }
            this._handleCompletionModel(model);
        }
        _getTerminalDimensions() {
            return {
                width: this._terminal._core._renderService.dimensions.css.cell.width,
                height: this._terminal._core._renderService.dimensions.css.cell.height,
            };
        }
        _handleCompletionModel(model) {
            if (model.items.length === 0 || !this._terminal?.element) {
                return;
            }
            if (model.items.length === 1) {
                this.acceptSelectedSuggestion({
                    item: model.items[0],
                    model: model
                });
                return;
            }
            const suggestWidget = this._ensureSuggestWidget(this._terminal);
            this._additionalInput = undefined;
            const dimensions = this._getTerminalDimensions();
            if (!dimensions.width || !dimensions.height) {
                return;
            }
            // TODO: What do frozen and auto do?
            const xtermBox = this._screen.getBoundingClientRect();
            const panelBox = this._panel.offsetParent.getBoundingClientRect();
            suggestWidget.showSuggestions(model, 0, false, false, {
                left: (xtermBox.left - panelBox.left) + this._terminal.buffer.active.cursorX * dimensions.width,
                top: (xtermBox.top - panelBox.top) + this._terminal.buffer.active.cursorY * dimensions.height,
                height: dimensions.height
            });
            // Flush the input queue if any characters were typed after a trigger character
            if (this._inputQueue) {
                const inputQueue = this._inputQueue;
                this._inputQueue = undefined;
                for (const data of inputQueue) {
                    this._handleTerminalInput(data);
                }
            }
        }
        _ensureSuggestWidget(terminal) {
            this._terminalSuggestWidgetVisibleContextKey.set(true);
            if (!this._suggestWidget) {
                this._suggestWidget = this._register(this._instantiationService.createInstance(simpleSuggestWidget_1.SimpleSuggestWidget, this._panel, this._instantiationService.createInstance(PersistedWidgetSize), {}));
                this._suggestWidget.list.style((0, defaultStyles_1.getListStyles)({
                    listInactiveFocusBackground: suggestWidget_1.editorSuggestWidgetSelectedBackground,
                    listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
                }));
                this._suggestWidget.onDidSelect(async (e) => this.acceptSelectedSuggestion(e));
                this._suggestWidget.onDidHide(() => this._terminalSuggestWidgetVisibleContextKey.set(false));
                this._suggestWidget.onDidShow(() => this._terminalSuggestWidgetVisibleContextKey.set(true));
            }
            return this._suggestWidget;
        }
        selectPreviousSuggestion() {
            this._suggestWidget?.selectPrevious();
        }
        selectPreviousPageSuggestion() {
            this._suggestWidget?.selectPreviousPage();
        }
        selectNextSuggestion() {
            this._suggestWidget?.selectNext();
        }
        selectNextPageSuggestion() {
            this._suggestWidget?.selectNextPage();
        }
        acceptSelectedSuggestion(suggestion) {
            if (!suggestion) {
                suggestion = this._suggestWidget?.getFocusedItem();
            }
            if (suggestion && this._leadingLineContent) {
                this._suggestWidget?.hide();
                // Send the completion
                this._onAcceptedCompletion.fire([
                    // Disable suggestions
                    '\x1b[24~y',
                    // Right arrow to the end of the additional input
                    '\x1b[C'.repeat(Math.max((this._additionalInput?.length ?? 0) - this._cursorIndexDelta, 0)),
                    // Backspace to remove additional input
                    '\x7F'.repeat(this._additionalInput?.length ?? 0),
                    // Backspace to remove the replacement
                    '\x7F'.repeat(suggestion.model.replacementLength),
                    // Write the completion
                    suggestion.item.completion.label,
                    // Enable suggestions
                    '\x1b[24~z',
                ].join(''));
            }
        }
        hideSuggestWidget() {
            this._suggestWidget?.hide();
        }
        handleNonXtermData(data) {
            this._handleTerminalInput(data);
        }
        _handleTerminalInput(data) {
            if (!this._terminal || !this._enableWidget || !this._terminalSuggestWidgetVisibleContextKey.get()) {
                // HACK: Buffer any input to be evaluated when the completions come in, this is needed
                // because conpty may "render" the completion request after input characters that
                // actually come after it. This can happen when typing quickly after a trigger
                // character, especially on a freshly launched session.
                if (data === '-') {
                    this._inputQueue = [];
                }
                else {
                    this._inputQueue?.push(data);
                }
                return;
            }
            let handled = false;
            let handledCursorDelta = 0;
            // Backspace
            if (data === '\x7f') {
                if (this._additionalInput && this._additionalInput.length > 0 && this._cursorIndexDelta > 0) {
                    handled = true;
                    this._additionalInput = this._additionalInput.substring(0, this._cursorIndexDelta - 1) + this._additionalInput.substring(this._cursorIndexDelta);
                    this._cursorIndexDelta--;
                    handledCursorDelta--;
                }
            }
            // Delete
            if (data === '\x1b[3~') {
                if (this._additionalInput && this._additionalInput.length > 0 && this._cursorIndexDelta < this._additionalInput.length - 1) {
                    handled = true;
                    this._additionalInput = this._additionalInput.substring(0, this._cursorIndexDelta) + this._additionalInput.substring(this._cursorIndexDelta + 1);
                }
            }
            // Left
            if (data === '\x1b[D') {
                // If left goes beyond where the completion was requested, hide
                if (this._cursorIndexDelta > 0) {
                    handled = true;
                    this._cursorIndexDelta--;
                    handledCursorDelta--;
                }
            }
            // Right
            if (data === '\x1b[C') {
                // If right requests beyond where the completion was requested (potentially accepting a shell completion), hide
                if (this._additionalInput?.length !== this._cursorIndexDelta) {
                    handled = true;
                    this._cursorIndexDelta++;
                    handledCursorDelta++;
                }
            }
            if (data.match(/^[a-z0-9]$/i)) {
                // TODO: There is a race here where the completions may come through after new character presses because of conpty's rendering!
                handled = true;
                if (this._additionalInput === undefined) {
                    this._additionalInput = '';
                }
                this._additionalInput += data;
                this._cursorIndexDelta++;
                handledCursorDelta++;
            }
            if (handled) {
                // typed -> moved cursor RIGHT -> update UI
                if (this._terminalSuggestWidgetVisibleContextKey.get()) {
                    this._suggestWidget?.setLineContext(new simpleCompletionModel_1.LineContext(this._leadingLineContent + (this._additionalInput ?? ''), this._additionalInput?.length ?? 0));
                }
                // Hide and clear model if there are no more items
                if (this._suggestWidget._completionModel?.items.length === 0) {
                    this._additionalInput = undefined;
                    this.hideSuggestWidget();
                    // TODO: Don't request every time; refine completions
                    // this._onAcceptedCompletion.fire('\x1b[24~e');
                    return;
                }
                // TODO: Expose on xterm.js
                const dimensions = this._getTerminalDimensions();
                if (!dimensions.width || !dimensions.height) {
                    return;
                }
                // TODO: What do frozen and auto do?
                const xtermBox = this._screen.getBoundingClientRect();
                const panelBox = this._panel.offsetParent.getBoundingClientRect();
                this._suggestWidget?.showSuggestions(this._suggestWidget._completionModel, 0, false, false, {
                    left: (xtermBox.left - panelBox.left) + (this._terminal.buffer.active.cursorX + handledCursorDelta) * dimensions.width,
                    top: (xtermBox.top - panelBox.top) + this._terminal.buffer.active.cursorY * dimensions.height,
                    height: dimensions.height
                });
            }
            else {
                this._additionalInput = undefined;
                this.hideSuggestWidget();
                // TODO: Don't request every time; refine completions
                // this._onAcceptedCompletion.fire('\x1b[24~e');
            }
        }
    };
    exports.SuggestAddon = SuggestAddon;
    exports.SuggestAddon = SuggestAddon = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SuggestAddon);
    let PersistedWidgetSize = class PersistedWidgetSize {
        constructor(_storageService) {
            this._storageService = _storageService;
            this._key = "terminal.integrated.suggestSize" /* TerminalStorageKeys.TerminalSuggestSize */;
        }
        restore() {
            const raw = this._storageService.get(this._key, 0 /* StorageScope.PROFILE */) ?? '';
            try {
                const obj = JSON.parse(raw);
                if (dom.Dimension.is(obj)) {
                    return dom.Dimension.lift(obj);
                }
            }
            catch {
                // ignore
            }
            return undefined;
        }
        store(size) {
            this._storageService.store(this._key, JSON.stringify(size), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        reset() {
            this._storageService.remove(this._key, 0 /* StorageScope.PROFILE */);
        }
    };
    PersistedWidgetSize = __decorate([
        __param(0, storage_1.IStorageService)
    ], PersistedWidgetSize);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdWdnZXN0QWRkb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvdGVybWluYWxTdWdnZXN0QWRkb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFXLHFCQUdWO0lBSEQsV0FBVyxxQkFBcUI7UUFDL0IsNEJBQTRCO1FBQzVCLHVFQUFZLENBQUE7SUFDYixDQUFDLEVBSFUscUJBQXFCLEtBQXJCLHFCQUFxQixRQUcvQjtJQUVELElBQVcsV0FJVjtJQUpELFdBQVcsV0FBVztRQUNyQiwwQ0FBMkIsQ0FBQTtRQUMzQixrREFBbUMsQ0FBQTtRQUNuQyxvRUFBcUQsQ0FBQTtJQUN0RCxDQUFDLEVBSlUsV0FBVyxLQUFYLFdBQVcsUUFJckI7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BcUJHO0lBQ0gsTUFBTSxpQkFBaUIsR0FBOEM7UUFDcEUsQ0FBQyxFQUFFLGtCQUFPLENBQUMsVUFBVTtRQUNyQixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxPQUFPO1FBQ2xCLENBQUMsRUFBRSxrQkFBTyxDQUFDLFlBQVk7UUFDdkIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsVUFBVTtRQUNyQixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxNQUFNO1FBQ2pCLENBQUMsRUFBRSxrQkFBTyxDQUFDLGNBQWM7UUFDekIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsWUFBWTtRQUN2QixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxjQUFjO1FBQ3pCLENBQUMsRUFBRSxrQkFBTyxDQUFDLFdBQVc7UUFDdEIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsY0FBYztRQUN6QixFQUFFLEVBQUUsa0JBQU8sQ0FBQyxlQUFlO1FBQzNCLEVB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
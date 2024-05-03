/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/config/fontMeasurements", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/services/webWorker", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom", "vs/editor/common/config/fontInfo", "vs/editor/common/editorCommon", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/model", "vs/editor/common/services/model", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/colorizer", "vs/editor/standalone/browser/standaloneCodeEditor", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/standaloneTheme", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget", "vs/css!./standalone-tokens"], function (require, exports, window_1, lifecycle_1, strings_1, uri_1, fontMeasurements_1, editorExtensions_1, codeEditorService_1, webWorker_1, editorOptions_1, editorZoom_1, fontInfo_1, editorCommon_1, languages, language_1, languageConfigurationRegistry_1, modesRegistry_1, nullTokenize_1, model_1, model_2, standaloneEnums, colorizer_1, standaloneCodeEditor_1, standaloneServices_1, standaloneTheme_1, actions_1, commands_1, contextkey_1, keybinding_1, markers_1, opener_1, multiDiffEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    exports.onDidCreateEditor = onDidCreateEditor;
    exports.onDidCreateDiffEditor = onDidCreateDiffEditor;
    exports.getEditors = getEditors;
    exports.getDiffEditors = getDiffEditors;
    exports.createDiffEditor = createDiffEditor;
    exports.createMultiFileDiffEditor = createMultiFileDiffEditor;
    exports.addCommand = addCommand;
    exports.addEditorAction = addEditorAction;
    exports.addKeybindingRule = addKeybindingRule;
    exports.addKeybindingRules = addKeybindingRules;
    exports.createModel = createModel;
    exports.setModelLanguage = setModelLanguage;
    exports.setModelMarkers = setModelMarkers;
    exports.removeAllMarkers = removeAllMarkers;
    exports.getModelMarkers = getModelMarkers;
    exports.onDidChangeMarkers = onDidChangeMarkers;
    exports.getModel = getModel;
    exports.getModels = getModels;
    exports.onDidCreateModel = onDidCreateModel;
    exports.onWillDisposeModel = onWillDisposeModel;
    exports.onDidChangeModelLanguage = onDidChangeModelLanguage;
    exports.createWebWorker = createWebWorker;
    exports.colorizeElement = colorizeElement;
    exports.colorize = colorize;
    exports.colorizeModelLine = colorizeModelLine;
    exports.tokenize = tokenize;
    exports.defineTheme = defineTheme;
    exports.setTheme = setTheme;
    exports.remeasureFonts = remeasureFonts;
    exports.registerCommand = registerCommand;
    exports.registerLinkOpener = registerLinkOpener;
    exports.registerEditorOpener = registerEditorOpener;
    exports.createMonacoEditorAPI = createMonacoEditorAPI;
    /**
     * Create a new editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function create(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneEditor, domElement, options);
    }
    /**
     * Emitted when an editor is created.
     * Creating a diff editor might cause this listener to be invoked with the two editors.
     * @event
     */
    function onDidCreateEditor(listener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.onCodeEditorAdd((editor) => {
            listener(editor);
        });
    }
    /**
     * Emitted when an diff editor is created.
     * @event
     */
    function onDidCreateDiffEditor(listener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.onDiffEditorAdd((editor) => {
            listener(editor);
        });
    }
    /**
     * Get all the created editors.
     */
    function getEditors() {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.listCodeEditors();
    }
    /**
     * Get all the created diff editors.
     */
    function getDiffEditors() {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.listDiffEditors();
    }
    /**
     * Create a new diff editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function createDiffEditor(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneDiffEditor2, domElement, options);
    }
    function createMultiFileDiffEditor(domElement, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return new multiDiffEditorWidget_1.MultiDiffEditorWidget(domElement, {}, instantiationService);
    }
    /**
     * Add a command.
     */
    function addCommand(descriptor) {
        if ((typeof descriptor.id !== 'string') || (typeof descriptor.run !== 'function')) {
            throw new Error('Invalid command descriptor, `id` and `run` are required properties!');
        }
        return commands_1.CommandsRegistry.registerCommand(descriptor.id, descriptor.run);
    }
    /**
     * Add an action to all editors.
     */
    function addEditorAction(descriptor) {
        if ((typeof descriptor.id !== 'string') || (typeof descriptor.label !== 'string') || (typeof descriptor.run !== 'function')) {
            throw new Error('Invalid action descriptor, `id`, `label` and `run` are required properties!');
        }
        const precondition = contextkey_1.ContextKeyExpr.deserialize(descriptor.precondition);
        const run = (accessor, ...args) => {
            return editorExtensions_1.EditorCommand.runEditorCommand(accessor, args, precondition, (accessor, editor, args) => Promise.resolve(descriptor.run(editor, ...args)));
        };
        const toDispose = new lifecycle_1.DisposableStore();
        // Register the command
        toDispose.add(commands_1.CommandsRegistry.registerCommand(descriptor.id, run));
        // Register the context menu item
        if (descriptor.contextMenuGroupId) {
            const menuItem = {
                command: {
                    id: descriptor.id,
                    title: descriptor.label
                },
                when: precondition,
                group: descriptor.contextMenuGroupId,
                order: descriptor.contextMenuOrder || 0
            };
            toDispose.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, menuItem));
        }
        // Register the keybindings
        if (Array.isArray(descriptor.keybindings)) {
            const keybindingService = standaloneServices_1.StandaloneServices.get(keybinding_1.IKeybindingService);
            if (!(keybindingService instanceof standaloneServices_1.StandaloneKeybindingService)) {
                console.warn('Cannot add keybinding because the editor is configured with an unrecognized KeybindingService');
            }
            else {
                const keybindingsWhen = contextkey_1.ContextKeyExpr.and(precondition, contextkey_1.ContextKeyExpr.deserialize(descriptor.keybindingContext));
                toDispose.add(keybindingService.addDynamicKeybindings(descriptor.keybindings.map((keybinding) => {
                    return {
                        keybinding,
                        command: descriptor.id,
                        when: keybindingsWhen
                    };
                })));
            }
        }
        return toDispose;
    }
    /**
     * Add a keybinding rule.
     */
    function addKeybindingRule(rule) {
        return addKeybindingRules([rule]);
    }
    /**
     * Add keybinding rules.
     */
    function addKeybindingRules(rules) {
        const keybindingService = standaloneServices_1.StandaloneServices.get(keybinding_1.IKeybindingService);
        if (!(keybindingService instanceof standaloneServices_1.StandaloneKeybindingService)) {
            console.warn('Cannot add keybinding because the editor is configured with an unrecognized KeybindingService');
            return lifecycle_1.Disposable.None;
        }
        return keybindingService.addDynamicKeybindings(rules.map((rule) => {
            return {
                keybinding: rule.keybinding,
                command: rule.command,
                commandArgs: rule.commandArgs,
                when: contextkey_1.ContextKeyExpr.deserialize(rule.when),
            };
        }));
    }
    /**
     * Create a new editor model.
     * You can specify the language that should be set for this model or let the language be inferred from the `uri`.
     */
    function createModel(value, language, uri) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const languageId = languageService.getLanguageIdByMimeType(language) || language;
        return (0, standaloneCodeEditor_1.createTextModel)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), languageService, value, languageId, uri);
    }
    /**
     * Change the language for a model.
     */
    function setModelLanguage(model, mimeTypeOrLanguageId) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const languageId = languageService.getLanguageIdByMimeType(mimeTypeOrLanguageId) || mimeTypeOrLanguageId || modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
        model.setLanguage(languageService.createById(languageId));
    }
    /**
     * Set the markers for a model.
     */
    function setModelMarkers(model, owner, markers) {
        if (model) {
            const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
            markerService.changeOne(owner, model.uri, markers);
        }
    }
    /**
     * Remove all markers of an owner.
     */
    function removeAllMarkers(owner) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        markerService.changeAll(owner, []);
    }
    /**
     * Get markers for owner and/or resource
     *
     * @returns list of markers
     */
    function getModelMarkers(filter) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.read(filter);
    }
    /**
     * Emitted when markers change for a model.
     * @event
     */
    function onDidChangeMarkers(listener) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.onMarkerChanged(listener);
    }
    /**
     * Get the model that has `uri` if it exists.
     */
    function getModel(uri) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModel(uri);
    }
    /**
     * Get all the created models.
     */
    function getModels() {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModels();
    }
    /**
     * Emitted when a model is created.
     * @event
     */
    function onDidCreateModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelAdded(listener);
    }
    /**
     * Emitted right before a model is disposed.
     * @event
     */
    function onWillDisposeModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelRemoved(listener);
    }
    /**
     * Emitted when a different language is set to a model.
     * @event
     */
    function onDidChangeModelLanguage(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelLanguageChanged((e) => {
            listener({
                model: e.model,
                oldLanguage: e.oldLanguageId
            });
        });
    }
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(opts) {
        return (0, webWorker_1.createWebWorker)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), standaloneServices_1.StandaloneServices.get(languageConfigurationRegistry_1.ILanguageConfigurationService), opts);
    }
    /**
     * Colorize the contents of `domNode` using attribute `data-lang`.
     */
    function colorizeElement(domNode, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        return colorizer_1.Colorizer.colorizeElement(themeService, languageService, domNode, options).then(() => {
            themeService.registerEditorContainer(domNode);
        });
    }
    /**
     * Colorize `text` using language `languageId`.
     */
    function colorize(text, languageId, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(window_1.mainWindow.document.body);
        return colorizer_1.Colorizer.colorize(languageService, text, languageId, options);
    }
    /**
     * Colorize a line in a model.
     */
    function colorizeModelLine(model, lineNumber, tabSize = 4) {
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(window_1.mainWindow.document.body);
        return colorizer_1.Colorizer.colorizeModelLine(model, lineNumber, tabSize);
    }
    /**
     * @internal
     */
    function getSafeTokenizationSupport(language) {
        const tokenizationSupport = languages.TokenizationRegistry.get(language);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(language, state)
        };
    }
    /**
     * Tokenize `text` using language `languageId`
     */
    function tokenize(text, languageId) {
        // Needed in order to get the mode registered for subsequent look-ups
        languages.TokenizationRegistry.getOrCreate(languageId);
        const tokenizationSupport = getSafeTokenizationSupport(languageId);
        const lines = (0, strings_1.splitLines)(text);
        const result = [];
        let state = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            const tokenizationResult = tokenizationSupport.tokenize(line, true, state);
            result[i] = tokenizationResult.tokens;
            state = tokenizationResult.endState;
        }
        return result;
    }
    /**
     * Define a new theme or update an existing theme.
     */
    function defineTheme(themeName, themeData) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.defineTheme(themeName, themeData);
    }
    /**
     * Switches to a theme.
     */
    function setTheme(themeName) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.setTheme(themeName);
    }
    /**
     * Clears all cached font measurements and triggers re-measurement.
     */
    function remeasureFonts() {
        fontMeasurements_1.FontMeasurements.clearAllFontInfos();
    }
    /**
     * Register a command.
     */
    function registerCommand(id, handler) {
        return commands_1.CommandsRegistry.registerCommand({ id, handler });
    }
    /**
     * Registers a handler that is called when a link is opened in any editor. The handler callback should return `true` if the link was handled and `false` otherwise.
     * The handler that was registered last will be called first when a link is opened.
     *
     * Returns a disposable that can unregister the opener again.
     */
    function registerLinkOpener(opener) {
        const openerService = standaloneServices_1.StandaloneServices.get(opener_1.IOpenerService);
        return openerService.registerOpener({
            async open(resource) {
                if (typeof resource === 'string') {
                    resource = uri_1.URI.parse(resource);
                }
                return opener.open(resource);
            }
        });
    }
    /**
     * Registers a handler that is called when a resource other than the current model should be opened in the editor (e.g. "go to definition").
     * The handler callback should return `true` if the request was handled and `false` otherwise.
     *
     * Returns a disposable that can unregister the opener again.
     *
     * If no handler is registered the default behavior is to do nothing for models other than the currently attached one.
     */
    function registerEditorOpener(opener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.registerCodeEditorOpenHandler(async (input, source, sideBySide) => {
            if (!source) {
                return null;
            }
            const selection = input.options?.selection;
            let selectionOrPosition;
            if (selection && typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                selectionOrPosition = selection;
            }
            else if (selection) {
                selectionOrPosition = { lineNumber: selection.startLineNumber, column: selection.startColumn };
            }
            if (await opener.openCodeEditor(source, input.resource, selectionOrPosition)) {
                return source; // return source editor to indicate that this handler has successfully handled the opening
            }
            return null; // fallback to other registered handlers
        });
    }
    /**
     * @internal
     */
    function createMonacoEditorAPI() {
        return {
            // methods
            create: create,
            getEditors: getEditors,
            getDiffEditors: getDiffEditors,
            onDidCreateEditor: onDidCreateEditor,
            onDidCreateDiffEditor: onDidCreateDiffEditor,
            createDiffEditor: createDiffEditor,
            addCommand: addCommand,
            addEditorAction: addEditorAction,
            addKeybindingRule: addKeybindingRule,
            addKeybindingRules: addKeybindingRules,
            createModel: createModel,
            setModelLanguage: setModelLanguage,
            setModelMarkers: setModelMarkers,
            getModelMarkers: getModelMarkers,
            removeAllMarkers: removeAllMarkers,
            onDidChangeMarkers: onDidChangeMarkers,
            getModels: getModels,
            getModel: getModel,
            onDidCreateModel: onDidCreateModel,
            onWillDisposeModel: onWillDisposeModel,
            onDidChangeModelLanguage: onDidChangeModelLanguage,
            createWebWorker: createWebWorker,
            colorizeElement: colorizeElement,
            colorize: colorize,
            colorizeModelLine: colorizeModelLine,
            tokenize: tokenize,
            defineTheme: defineTheme,
            setTheme: setTheme,
            remeasureFonts: remeasureFonts,
            registerCommand: registerCommand,
            registerLinkOpener: registerLinkOpener,
            registerEditorOpener: registerEditorOpener,
            // enums
            AccessibilitySupport: standaloneEnums.AccessibilitySupport,
            ContentWidgetPositionPreference: standaloneEnums.ContentWidgetPositionPreference,
            CursorChangeReason: standaloneEnums.CursorChangeReason,
            DefaultEndOfLine: standaloneEnums.DefaultEndOfLine,
            EditorAutoIndentStrategy: standaloneEnums.EditorAutoIndentStrategy,
            EditorOption: standaloneEnums.EditorOption,
            EndOfLinePreference: standaloneEnums.EndOfLinePreference,
            EndOfLineSequence: standaloneEnums.EndOfLineSequence,
            MinimapPosition: standaloneEnums.MinimapPosition,
            MinimapSectionHeaderStyle: standaloneEnums.MinimapSectionHeaderStyle,
            MouseTargetType: standaloneEnums.MouseTargetType,
            OverlayWidgetPositionPreference: standaloneEnums.OverlayWidgetPositionPreference,
            OverviewRulerLane: standaloneEnums.OverviewRulerLane,
            GlyphMarginLane: standaloneEnums.GlyphMarginLane,
            RenderLineNumbersType: standaloneEnums.RenderLineNumbersType,
            RenderMinimap: standaloneEnums.RenderMinimap,
            ScrollbarVisibility: standaloneEnums.ScrollbarVisibility,
            ScrollType: standaloneEnums.ScrollType,
            TextEditorCursorBlinkingStyle: standaloneEnums.TextEditorCursorBlinkingStyle,
            TextEditorCursorStyle: standaloneEnums.TextEditorCursorStyle,
            TrackedRangeStickiness: standaloneEnums.TrackedRangeStickiness,
            WrappingIndent: standaloneEnums.WrappingIndent,
            InjectedTextCursorStops: standaloneEnums.InjectedTextCursorStops,
            PositionAffinity: standaloneEnums.PositionAffinity,
            ShowLightbulbIconMode: standaloneEnums.ShowLightbulbIconMode,
            // classes
            ConfigurationChangedEvent: editorOptions_1.ConfigurationChangedEvent,
            BareFontInfo: fontInfo_1.BareFontInfo,
            FontInfo: fontInfo_1.FontInfo,
            TextModelResolvedOptions: model_1.TextModelResolvedOptions,
            FindMatch: model_1.FindMatch,
            ApplyUpdateResult: editorOptions_1.ApplyUpdateResult,
            EditorZoom: editorZoom_1.EditorZoom,
            createMultiFileDiffEditor: createMultiFileDiffEditor,
            // vars
            EditorType: editorCommon_1.EditorType,
            EditorOptions: editorOptions_1.EditorOptions
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9zdGFuZGFsb25lRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBNkNoRyx3QkFHQztJQU9ELDhDQUtDO0lBTUQsc0RBS0M7SUFLRCxnQ0FHQztJQUtELHdDQUdDO0lBT0QsNENBR0M7SUFFRCw4REFHQztJQW1CRCxnQ0FLQztJQUtELDBDQStDQztJQWVELDhDQUVDO0lBS0QsZ0RBZUM7SUFNRCxrQ0FVQztJQUtELDRDQUlDO0lBS0QsMENBS0M7SUFLRCw0Q0FHQztJQU9ELDBDQUdDO0lBTUQsZ0RBR0M7SUFLRCw0QkFHQztJQUtELDhCQUdDO0lBTUQsNENBR0M7SUFNRCxnREFHQztJQU1ELDREQVFDO0lBTUQsMENBRUM7SUFLRCwwQ0FNQztJQUtELDRCQUtDO0lBS0QsOENBSUM7SUFtQkQsNEJBZ0JDO0lBS0Qsa0NBR0M7SUFLRCw0QkFHQztJQUtELHdDQUVDO0lBS0QsMENBRUM7SUFZRCxnREFVQztJQXlCRCxvREFrQkM7SUFLRCxzREFvRkM7SUE5aEJEOzs7O09BSUc7SUFDSCxTQUFnQixNQUFNLENBQUMsVUFBdUIsRUFBRSxPQUE4QyxFQUFFLFFBQWtDO1FBQ2pJLE1BQU0sb0JBQW9CLEdBQUcsdUNBQWtCLENBQUMsVUFBVSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzRSxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1Q0FBZ0IsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxRQUEyQztRQUM1RSxNQUFNLGlCQUFpQixHQUFHLHVDQUFrQixDQUFDLEdBQUcsQ0FB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
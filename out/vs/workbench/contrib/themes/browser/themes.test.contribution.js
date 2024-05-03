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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor", "vs/workbench/services/textMate/browser/textMateTokenizationFeature", "vs/editor/common/languages", "vs/editor/common/encodedTokenAttributes", "vs/workbench/services/textMate/common/TMHelper", "vs/base/common/color", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/network", "vs/base/common/strings"], function (require, exports, uri_1, language_1, commands_1, instantiation_1, workbenchThemeService_1, editorService_1, editor_1, textMateTokenizationFeature_1, languages_1, encodedTokenAttributes_1, TMHelper_1, color_1, files_1, resources_1, network_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ThemeDocument {
        constructor(theme) {
            this._theme = theme;
            this._cache = Object.create(null);
            this._defaultColor = '#000000';
            for (let i = 0, len = this._theme.tokenColors.length; i < len; i++) {
                const rule = this._theme.tokenColors[i];
                if (!rule.scope) {
                    this._defaultColor = rule.settings.foreground;
                }
            }
        }
        _generateExplanation(selector, color) {
            return `${selector}: ${color_1.Color.Format.CSS.formatHexA(color, true).toUpperCase()}`;
        }
        explainTokenColor(scopes, color) {
            const matchingRule = this._findMatchingThemeRule(scopes);
            if (!matchingRule) {
                const expected = color_1.Color.fromHex(this._defaultColor);
                // No matching rule
                if (!color.equals(expected)) {
                    throw new Error(`[${this._theme.label}]: Unexpected color ${color_1.Color.Format.CSS.formatHexA(color)} for ${scopes}. Expected default ${color_1.Color.Format.CSS.formatHexA(expected)}`);
                }
                return this._generateExplanation('default', color);
            }
            const expected = color_1.Color.fromHex(matchingRule.settings.foreground);
            if (!color.equals(expected)) {
                throw new Error(`[${this._theme.label}]: Unexpected color ${color_1.Color.Format.CSS.formatHexA(color)} for ${scopes}. Expected ${color_1.Color.Format.CSS.formatHexA(expected)} coming in from ${matchingRule.rawSelector}`);
            }
            return this._generateExplanation(matchingRule.rawSelector, color);
        }
        _findMatchingThemeRule(scopes) {
            if (!this._cache[scopes]) {
                this._cache[scopes] = (0, TMHelper_1.findMatchingThemeRule)(this._theme, scopes.split(' '));
            }
            return this._cache[scopes];
        }
    }
    let Snapper = class Snapper {
        constructor(languageService, themeService, textMateService) {
            this.languageService = languageService;
            this.themeService = themeService;
            this.textMateService = textMateService;
        }
        _themedTokenize(grammar, lines) {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            let state = null;
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = lines.length; i < len; i++) {
                const line = lines[i];
                const tokenizationResult = grammar.tokenizeLine2(line, state);
                for (let j = 0, lenJ = tokenizationResult.tokens.length >>> 1; j < lenJ; j++) {
                    const startOffset = tokenizationResult.tokens[(j << 1)];
                    const metadata = tokenizationResult.tokens[(j << 1) + 1];
                    const endOffset = j + 1 < lenJ ? tokenizationResult.tokens[((j + 1) << 1)] : line.length;
                    const tokenText = line.substring(startOffset, endOffset);
                    const color = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
                    result[resultLen++] = {
                        text: tokenText,
                        color: colorMap[color]
                    };
                }
                state = tokenizationResult.ruleStack;
            }
            return result;
        }
        _tokenize(grammar, lines) {
            let state = null;
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = lines.length; i < len; i++) {
                const line = lines[i];
                const tokenizationResult = grammar.tokenizeLine(line, state);
                let lastScopes = null;
                for (let j = 0, lenJ = tokenizationResult.tokens.length; j < lenJ; j++) {
                    const token = tokenizationResult.tokens[j];
                    const tokenText = line.substring(token.startIndex, token.endIndex);
                    const tokenScopes = token.scopes.join(' ');
                    if (lastScopes === tokenScopes) {
                        result[resultLen - 1].c += tokenText;
                    }
                    else {
                        lastScopes = tokenScopes;
                        result[resultLen++] = {
                            c: tokenText,
                            t: tokenScopes,
                            r: {
                                dark_plus: undefined,
                                light_plus: undefined,
                                dark_vs: undefined,
                                light_vs: undefined,
                                hc_black: undefined,
                            }
                        };
                    }
                }
                state = tokenizationResult.ruleStack;
            }
            return result;
        }
        async _getThemesResult(grammar, lines) {
            const currentTheme = this.themeService.getColorTheme();
            const getThemeName = (id) => {
                const part = 'vscode-theme-defaults-themes-';
                const startIdx = id.indexOf(part);
                if (startIdx !== -1) {
                    return id.substring(startIdx + part.length, id.length - 5);
                }
                return undefined;
            };
            const result = {};
            const themeDatas = await this.themeService.getColorThemes();
            const defaultThemes = themeDatas.filter(themeData => !!getThemeName(themeData.id));
            for (const defaultTheme of defaultThemes) {
                const themeId = defaultTheme.id;
                const success = await this.themeService.setColorTheme(themeId, undefined);
                if (success) {
                    const themeName = getThemeName(themeId);
                    result[themeName] = {
                        document: new ThemeDocument(this.themeService.getColorTheme()),
                        tokens: this._themedTokenize(grammar, lines)
                    };
                }
            }
            await this.themeService.setColorTheme(currentTheme.id, undefined);
            return result;
        }
        _enrichResult(result, themesResult) {
            const index = {};
            const themeNames = Object.keys(themesResult);
            for (const themeName of themeNames) {
                index[themeName] = 0;
            }
            for (let i = 0, len = result.length; i < len; i++) {
                const token = result[i];
                for (const themeName of themeNames) {
                    const themedToken = themesResult[themeName].tokens[index[themeName]];
                    themedToken.text = themedToken.text.substr(token.c.length);
                    token.r[themeName] = themesResult[themeName].document.explainTokenColor(token.t, themedToken.color);
                    if (themedToken.text.length === 0) {
                        index[themeName]++;
                    }
                }
            }
        }
        captureSyntaxTokens(fileName, content) {
            const languageId = this.languageService.guessLanguageIdByFilepathOrFirstLine(uri_1.URI.file(fileName));
            return this.textMateService.createTokenizer(languageId).then((grammar) => {
                if (!grammar) {
                    return [];
                }
                const lines = (0, strings_1.splitLines)(content);
                const result = this._tokenize(grammar, lines);
                return this._getThemesResult(grammar, lines).then((themesResult) => {
                    this._enrichResult(result, themesResult);
                    return result.filter(t => t.c.length > 0);
                });
            });
        }
    };
    Snapper = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, textMateTokenizationFeature_1.ITextMateTokenizationService)
    ], Snapper);
    commands_1.CommandsRegistry.registerCommand('_workbench.captureSyntaxTokens', function (accessor, resource) {
        const process = (resource) => {
            const fileService = accessor.get(files_1.IFileService);
            const fileName = (0, resources_1.basename)(resource);
            const snapper = accessor.get(instantiation_1.IInstantiationService).createInstance(Snapper);
            return fileService.readFile(resource).then(content => {
                return snapper.captureSyntaxTokens(fileName, content.value.toString());
            });
        };
        if (!resource) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const file = editorService.activeEditor ? editor_1.EditorResourceAccessor.getCanonicalUri(editorService.activeEditor, { filterByScheme: network_1.Schemas.file }) : null;
            if (file) {
                process(file).then(result => {
                    console.log(result);
                });
            }
            else {
                console.log('No file editor active');
            }
        }
        else {
            return process(resource);
        }
        return undefined;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLnRlc3QuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90aGVtZXMvYnJvd3Nlci90aGVtZXMudGVzdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLE1BQU0sYUFBYTtRQUtsQixZQUFZLEtBQTJCO1lBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztZQUMvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFXLENBQUM7Z0JBQ2hELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsS0FBWTtZQUMxRCxPQUFPLEdBQUcsUUFBUSxLQUFLLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUNqRixDQUFDO1FBRU0s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
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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/base/common/network", "vs/platform/product/common/productService", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, lifecycle_1, strings_1, uri_1, configuration_1, network_1, productService_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWordLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
    })(Constants || (Constants = {}));
    let TerminalWordLinkDetector = class TerminalWordLinkDetector extends lifecycle_1.Disposable {
        static { this.id = 'word'; }
        constructor(xterm, _configurationService, _productService) {
            super();
            this.xterm = xterm;
            this._configurationService = _configurationService;
            this._productService = _productService;
            // Word links typically search the workspace so it makes sense that their maximum link length is
            // quite small.
            this.maxLinkLength = 100;
            this._refreshSeparatorCodes();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.wordSeparators" /* TerminalSettingId.WordSeparators */)) {
                    this._refreshSeparatorCodes();
                }
            }));
        }
        detect(lines, startLine, endLine) {
            const links = [];
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            // Parse out all words from the wrapped line
            const words = this._parseWords(text);
            // Map the words to ITerminalLink objects
            for (const word of words) {
                if (word.text === '') {
                    continue;
                }
                if (word.text.length > 0 && word.text.charAt(word.text.length - 1) === ':') {
                    word.text = word.text.slice(0, -1);
                    word.endIndex--;
                }
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: word.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: word.endIndex + 1,
                    endLineNumber: 1
                }, startLine);
                // Support this product's URL protocol
                if ((0, network_1.matchesScheme)(word.text, this._productService.urlProtocol)) {
                    const uri = uri_1.URI.parse(word.text);
                    if (uri) {
                        links.push({
                            text: word.text,
                            uri,
                            bufferRange,
                            type: "Url" /* TerminalBuiltinLinkType.Url */
                        });
                    }
                    continue;
                }
                // Search links
                links.push({
                    text: word.text,
                    bufferRange,
                    type: "Search" /* TerminalBuiltinLinkType.Search */,
                    contextLine: text
                });
            }
            return links;
        }
        _parseWords(text) {
            const words = [];
            const splitWords = text.split(this._separatorRegex);
            let runningIndex = 0;
            for (let i = 0; i < splitWords.length; i++) {
                words.push({
                    text: splitWords[i],
                    startIndex: runningIndex,
                    endIndex: runningIndex + splitWords[i].length
                });
                runningIndex += splitWords[i].length + 1;
            }
            return words;
        }
        _refreshSeparatorCodes() {
            const separators = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).wordSeparators;
            let powerlineSymbols = '';
            for (let i = 0xe0b0; i <= 0xe0bf; i++) {
                powerlineSymbols += String.fromCharCode(i);
            }
            this._separatorRegex = new RegExp(`[${(0, strings_1.escapeRegExpCharacters)(separators)}${powerlineSymbols}]`, 'g');
        }
    };
    exports.TerminalWordLinkDetector = TerminalWordLinkDetector;
    exports.TerminalWordLinkDetector = TerminalWordLinkDetector = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService)
    ], TerminalWordLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxXb3JkTGlua0RldGVjdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbFdvcmRMaW5rRGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLElBQVcsU0FLVjtJQUxELFdBQVcsU0FBUztRQUNuQjs7V0FFRztRQUNILDhEQUFvQixDQUFBO0lBQ3JCLENBQUMsRUFMVSxTQUFTLEtBQVQsU0FBUyxRQUtuQjtJQVFNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7aUJBQ2hELE9BQUUsR0FBRyxNQUFNLEFBQVQsQ0FBVTtRQVFuQixZQUNVLEtBQWUsRUFDRCxxQkFBNkQsRUFDbkUsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFKQyxVQUFLLEdBQUwsS0FBSyxDQUFVO1lBQ2dCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDbEQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBVG5FLGdHQUFnRztZQUNoRyxlQUFlO1lBQ04sa0JBQWEsR0FBRyxHQUFHLENBQUM7WUFXNUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RFLElBQUksQ0FBQyxDQUFDLG9CQUFvQiw2RUFBa0MsRUFBRSxDQUFDO29CQUM5RCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQW9CLEVBQUUsU0FB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
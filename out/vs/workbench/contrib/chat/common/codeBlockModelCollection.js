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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/workbench/contrib/chat/common/chatViewModel", "./annotations"], function (require, exports, lifecycle_1, map_1, network_1, uri_1, range_1, language_1, resolverService_1, chatViewModel_1, annotations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeBlockModelCollection = void 0;
    let CodeBlockModelCollection = class CodeBlockModelCollection extends lifecycle_1.Disposable {
        constructor(languageService, textModelService) {
            super();
            this.languageService = languageService;
            this.textModelService = textModelService;
            this._models = new map_1.ResourceMap();
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        get(sessionId, chat, codeBlockIndex) {
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const entry = this._models.get(uri);
            if (!entry) {
                return;
            }
            return { model: entry.model.then(ref => ref.object), vulns: entry.vulns };
        }
        getOrCreate(sessionId, chat, codeBlockIndex) {
            const existing = this.get(sessionId, chat, codeBlockIndex);
            if (existing) {
                return existing;
            }
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const ref = this.textModelService.createModelReference(uri);
            this._models.set(uri, { model: ref, vulns: [] });
            return { model: ref.then(ref => ref.object), vulns: [] };
        }
        clear() {
            this._models.forEach(async (entry) => (await entry.model).dispose());
            this._models.clear();
        }
        async update(sessionId, chat, codeBlockIndex, content) {
            const entry = this.getOrCreate(sessionId, chat, codeBlockIndex);
            const extractedVulns = (0, annotations_1.extractVulnerabilitiesFromText)(content.text);
            const newText = extractedVulns.newText;
            this.setVulns(sessionId, chat, codeBlockIndex, extractedVulns.vulnerabilities);
            const textModel = (await entry.model).textEditorModel;
            if (content.languageId) {
                const vscodeLanguageId = this.languageService.getLanguageIdByLanguageName(content.languageId);
                if (vscodeLanguageId && vscodeLanguageId !== textModel.getLanguageId()) {
                    textModel.setLanguage(vscodeLanguageId);
                }
            }
            const currentText = textModel.getValue(1 /* EndOfLinePreference.LF */);
            if (newText === currentText) {
                return;
            }
            if (newText.startsWith(currentText)) {
                const text = newText.slice(currentText.length);
                const lastLine = textModel.getLineCount();
                const lastCol = textModel.getLineMaxColumn(lastLine);
                textModel.applyEdits([{ range: new range_1.Range(lastLine, lastCol, lastLine, lastCol), text }]);
            }
            else {
                // console.log(`Failed to optimize setText`);
                textModel.setValue(newText);
            }
        }
        setVulns(sessionId, chat, codeBlockIndex, vulnerabilities) {
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const entry = this._models.get(uri);
            if (entry) {
                entry.vulns = vulnerabilities;
            }
        }
        getUri(sessionId, chat, index) {
            const metadata = this.getUriMetaData(chat);
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeChatCodeBlock,
                authority: sessionId,
                path: `/${chat.id}/${index}`,
                fragment: metadata ? JSON.stringify(metadata) : undefined,
            });
        }
        getUriMetaData(chat) {
            if (!(0, chatViewModel_1.isResponseVM)(chat)) {
                return undefined;
            }
            return {
                references: chat.contentReferences.map(ref => {
                    const uriOrLocation = 'variableName' in ref.reference ?
                        ref.reference.value :
                        ref.reference;
                    if (!uriOrLocation) {
                        return;
                    }
                    if (uri_1.URI.isUri(uriOrLocation)) {
                        return {
                            uri: uriOrLocation.toJSON()
                        };
                    }
                    return {
                        uri: uriOrLocation.uri.toJSON(),
                        range: uriOrLocation.range,
                    };
                })
            };
        }
    };
    exports.CodeBlockModelCollection = CodeBlockModelCollection;
    exports.CodeBlockModelCollection = CodeBlockModelCollection = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, resolverService_1.ITextModelService)
    ], CodeBlockModelCollection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrTW9kZWxDb2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jb2RlQmxvY2tNb2RlbENvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFPdkQsWUFDbUIsZUFBa0QsRUFDakQsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSDJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBUHZELFlBQU8sR0FBRyxJQUFJLGlCQUFXLEVBR3RDLENBQUM7UUFPTCxDQUFDO1FBRWUsT0FBTztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztRQUVELEdBQUcsQ0FBQyxTQUFpQixFQUFFLElBQW9ELEVBQUUsY0FBc0I7WUFDbEcsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVB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
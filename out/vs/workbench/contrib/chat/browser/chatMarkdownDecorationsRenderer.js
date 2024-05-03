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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errorMessage", "vs/base/common/marshalling", "vs/base/common/uri", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/chatParserTypes", "../common/annotations"], function (require, exports, dom, errorMessage_1, marshalling_1, uri_1, keybinding_1, label_1, log_1, chatParserTypes_1, annotations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatMarkdownDecorationsRenderer = void 0;
    const variableRefUrl = 'http://_vscodedecoration_';
    let ChatMarkdownDecorationsRenderer = class ChatMarkdownDecorationsRenderer {
        constructor(keybindingService, labelService, logService) {
            this.keybindingService = keybindingService;
            this.labelService = labelService;
            this.logService = logService;
        }
        convertParsedRequestToMarkdown(parsedRequest) {
            let result = '';
            for (const part of parsedRequest.parts) {
                if (part instanceof chatParserTypes_1.ChatRequestTextPart) {
                    result += part.text;
                }
                else {
                    const uri = part instanceof chatParserTypes_1.ChatRequestDynamicVariablePart && part.data.map(d => d.value).find((d) => d instanceof uri_1.URI)
                        || undefined;
                    const title = uri ? encodeURIComponent(this.labelService.getUriLabel(uri, { relative: true })) :
                        part instanceof chatParserTypes_1.ChatRequestAgentPart ? part.agent.id :
                            '';
                    result += `[${part.text}](${variableRefUrl}?${title})`;
                }
            }
            return result;
        }
        walkTreeAndAnnotateReferenceLinks(element) {
            element.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('data-href');
                if (href) {
                    if (href.startsWith(variableRefUrl)) {
                        const title = decodeURIComponent(href.slice(variableRefUrl.length + 1));
                        a.parentElement.replaceChild(this.renderResourceWidget(a.textContent, title), a);
                    }
                    else if (href.startsWith(annotations_1.contentRefUrl)) {
                        this.renderFileWidget(href, a);
                    }
                    else if (href.startsWith('command:')) {
                        this.injectKeybindingHint(a, href, this.keybindingService);
                    }
                }
            });
        }
        renderFileWidget(href, a) {
            // TODO this can be a nicer FileLabel widget with an icon. Do a simple link for now.
            const fullUri = uri_1.URI.parse(href);
            let location;
            try {
                location = (0, marshalling_1.revive)(JSON.parse(fullUri.fragment));
            }
            catch (err) {
                this.logService.error('Invalid chat widget render data JSON', (0, errorMessage_1.toErrorMessage)(err));
                return;
            }
            if (!location.uri || !uri_1.URI.isUri(location.uri)) {
                this.logService.error(`Invalid chat widget render data: ${fullUri.fragment}`);
                return;
            }
            const fragment = location.range ? `${location.range.startLineNumber}-${location.range.endLineNumber}` : '';
            a.setAttribute('data-href', location.uri.with({ fragment }).toString());
            const label = this.labelService.getUriLabel(location.uri, { relative: true });
            a.title = location.range ?
                `${label}#${location.range.startLineNumber}-${location.range.endLineNumber}` :
                label;
        }
        renderResourceWidget(name, title) {
            const container = dom.$('span.chat-resource-widget');
            const alias = dom.$('span', undefined, name);
            alias.title = title;
            container.appendChild(alias);
            return container;
        }
        injectKeybindingHint(a, href, keybindingService) {
            const command = href.match(/command:([^\)]+)/)?.[1];
            if (command) {
                const kb = keybindingService.lookupKeybinding(command);
                if (kb) {
                    const keybinding = kb.getLabel();
                    if (keybinding) {
                        a.textContent = `${a.textContent} (${keybinding})`;
                    }
                }
            }
        }
    };
    exports.ChatMarkdownDecorationsRenderer = ChatMarkdownDecorationsRenderer;
    exports.ChatMarkdownDecorationsRenderer = ChatMarkdownDecorationsRenderer = __decorate([
        __param(0, keybinding_1.IKeybindingService),
        __param(1, label_1.ILabelService),
        __param(2, log_1.ILogService)
    ], ChatMarkdownDecorationsRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1hcmtkb3duRGVjb3JhdGlvbnNSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRNYXJrZG93bkRlY29yYXRpb25zUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sY0FBYyxHQUFHLDJCQUEyQixDQUFDO0lBRTVDLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQStCO1FBQzNDLFlBQ3NDLGlCQUFxQyxFQUMxQyxZQUEyQixFQUM3QixVQUF1QjtZQUZoQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzFDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzdCLGVBQVUsR0FBVixVQUFVLENBQWE7UUFDbEQsQ0FBQztRQUVMLDhCQUE4QixDQUFDLGFBQWlDO1lBQy9ELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixLQUFLLE1BQU0sSUFBSSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxJQUFJLFlBQVkscUNBQW1CLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3JCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEdBQUcsR0FBRyxJQUFJLFlBQVksZ0RBQThCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVksU0FBRyxDQUFDOzJCQUM3SCxTQUFTLENBQUM7b0JBQ2QsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMs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
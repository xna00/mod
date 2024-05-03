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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, event_1, lifecycle_1, nls_1, log_1, extensions_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickFixService = void 0;
    let TerminalQuickFixService = class TerminalQuickFixService {
        get providers() { return this._providers; }
        constructor(_logService) {
            this._logService = _logService;
            this._selectors = new Map();
            this._providers = new Map();
            this._onDidRegisterProvider = new event_1.Emitter();
            this.onDidRegisterProvider = this._onDidRegisterProvider.event;
            this._onDidRegisterCommandSelector = new event_1.Emitter();
            this.onDidRegisterCommandSelector = this._onDidRegisterCommandSelector.event;
            this._onDidUnregisterProvider = new event_1.Emitter();
            this.onDidUnregisterProvider = this._onDidUnregisterProvider.event;
            this.extensionQuickFixes = new Promise((r) => quickFixExtensionPoint.setHandler(fixes => {
                r(fixes.filter(c => (0, extensions_1.isProposedApiEnabled)(c.description, 'terminalQuickFixProvider')).map(c => {
                    if (!c.value) {
                        return [];
                    }
                    return c.value.map(fix => { return { ...fix, extensionIdentifier: c.description.identifier.value }; });
                }).flat());
            }));
            this.extensionQuickFixes.then(selectors => {
                for (const selector of selectors) {
                    this.registerCommandSelector(selector);
                }
            });
        }
        registerCommandSelector(selector) {
            this._selectors.set(selector.id, selector);
            this._onDidRegisterCommandSelector.fire(selector);
        }
        registerQuickFixProvider(id, provider) {
            // This is more complicated than it looks like it should be because we need to return an
            // IDisposable synchronously but we must await ITerminalContributionService.quickFixes
            // asynchronously before actually registering the provider.
            let disposed = false;
            this.extensionQuickFixes.then(() => {
                if (disposed) {
                    return;
                }
                this._providers.set(id, provider);
                const selector = this._selectors.get(id);
                if (!selector) {
                    this._logService.error(`No registered selector for ID: ${id}`);
                    return;
                }
                this._onDidRegisterProvider.fire({ selector, provider });
            });
            return (0, lifecycle_1.toDisposable)(() => {
                disposed = true;
                this._providers.delete(id);
                const selector = this._selectors.get(id);
                if (selector) {
                    this._selectors.delete(id);
                    this._onDidUnregisterProvider.fire(selector.id);
                }
            });
        }
    };
    exports.TerminalQuickFixService = TerminalQuickFixService;
    exports.TerminalQuickFixService = TerminalQuickFixService = __decorate([
        __param(0, log_1.ILogService)
    ], TerminalQuickFixService);
    const quickFixExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'terminalQuickFixes',
        defaultExtensionKind: ['workspace'],
        activationEventsGenerator: (terminalQuickFixes, result) => {
            for (const quickFixContrib of terminalQuickFixes ?? []) {
                result.push(`onTerminalQuickFixRequest:${quickFixContrib.id}`);
            }
        },
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes', 'Contributes terminal quick fixes.'),
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'commandLineMatcher', 'outputMatcher', 'commandExitResult'],
                defaultSnippets: [{
                        body: {
                            id: '$1',
                            commandLineMatcher: '$2',
                            outputMatcher: '$3',
                            exitStatus: '$4'
                        }
                    }],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.id', "The ID of the quick fix provider"),
                        type: 'string',
                    },
                    commandLineMatcher: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.commandLineMatcher', "A regular expression or string to test the command line against"),
                        type: 'string',
                    },
                    outputMatcher: {
                        markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.outputMatcher', "A regular expression or string to match a single line of the output against, which provides groups to be referenced in terminalCommand and uri.\n\nFor example:\n\n `lineMatcher: /git push --set-upstream origin (?<branchName>[^\s]+)/;`\n\n`terminalCommand: 'git push --set-upstream origin ${group:branchName}';`\n"),
                        type: 'object',
                        required: ['lineMatcher', 'anchor', 'offset', 'length'],
                        properties: {
                            lineMatcher: {
                                description: 'A regular expression or string to test the command line against',
                                type: 'string'
                            },
                            anchor: {
                                description: 'Where the search should begin in the buffer',
                                enum: ['top', 'bottom']
                            },
                            offset: {
                                description: 'The number of lines vertically from the anchor in the buffer to start matching against',
                                type: 'number'
                            },
                            length: {
                                description: 'The number of rows to match against, this should be as small as possible for performance reasons',
                                type: 'number'
                            }
                        }
                    },
                    commandExitResult: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.commandExitResult', "The command exit result to match on"),
                        enum: ['success', 'error'],
                        enumDescriptions: [
                            'The command exited with an exit code of zero.',
                            'The command exited with a non-zero exit code.'
                        ]
                    },
                    kind: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.kind', "The kind of the resulting quick fix. This changes how the quick fix is presented. Defaults to {0}.", '`"fix"`'),
                        enum: ['default', 'explain'],
                        enumDescriptions: [
                            'A high confidence quick fix.',
                            'An explanation of the problem.'
                        ]
                    }
                },
            }
        },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxRdWlja0ZpeFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9xdWlja0ZpeC9icm93c2VyL3Rlcm1pbmFsUXVpY2tGaXhTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQU1uQyxJQUFJLFNBQVMsS0FBNkMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQVduRixZQUNjLFdBQXlDO1lBQXhCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBZi9DLGVBQVUsR0FBMEMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUU5RCxlQUFVLEdBQTJDLElBQUksR0FBRyxFQUFFLENBQUM7WUFHdEQsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQXFDLENBQUM7WUFDbEYsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUNsRCxrQ0FBNkIsR0FBRyxJQUFJLGVBQU8sRUFBNEIsQ0FBQztZQUNoRixpQ0FBNEIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUFDO1lBQ2hFLDZCQUF3QixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDekQsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQU90RSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdkYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUs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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/theme/common/tokenClassificationRegistry"], function (require, exports, nls, extensionsRegistry_1, tokenClassificationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenClassificationExtensionPoints = void 0;
    const tokenClassificationRegistry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
    const tokenTypeExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'semanticTokenTypes',
        jsonSchema: {
            description: nls.localize('contributes.semanticTokenTypes', 'Contributes semantic token types.'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: nls.localize('contributes.semanticTokenTypes.id', 'The identifier of the semantic token type'),
                        pattern: tokenClassificationRegistry_1.typeAndModifierIdPattern,
                        patternErrorMessage: nls.localize('contributes.semanticTokenTypes.id.format', 'Identifiers should be in the form letterOrDigit[_-letterOrDigit]*'),
                    },
                    superType: {
                        type: 'string',
                        description: nls.localize('contributes.semanticTokenTypes.superType', 'The super type of the semantic token type'),
                        pattern: tokenClassificationRegistry_1.typeAndModifierIdPattern,
                        patternErrorMessage: nls.localize('contributes.semanticTokenTypes.superType.format', 'Super types should be in the form letterOrDigit[_-letterOrDigit]*'),
                    },
                    description: {
                        type: 'string',
                        description: nls.localize('contributes.color.description', 'The description of the semantic token type'),
                    }
                }
            }
        }
    });
    const tokenModifierExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'semanticTokenModifiers',
        jsonSchema: {
            description: nls.localize('contributes.semanticTokenModifiers', 'Contributes semantic token modifiers.'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: nls.localize('contributes.semanticTokenModifiers.id', 'The identifier of the semantic token modifier'),
                        pattern: tokenClassificationRegistry_1.typeAndModifierIdPattern,
                        patternErrorMessage: nls.localize('contributes.semanticTokenModifiers.id.format', 'Identifiers should be in the form letterOrDigit[_-letterOrDigit]*')
                    },
                    description: {
                        description: nls.localize('contributes.semanticTokenModifiers.description', 'The description of the semantic token modifier')
                    }
                }
            }
        }
    });
    const tokenStyleDefaultsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'semanticTokenScopes',
        jsonSchema: {
            description: nls.localize('contributes.semanticTokenScopes', 'Contributes semantic token scope maps.'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    language: {
                        description: nls.localize('contributes.semanticTokenScopes.languages', 'Lists the languge for which the defaults are.'),
                        type: 'string'
                    },
                    scopes: {
                        description: nls.localize('contributes.semanticTokenScopes.scopes', 'Maps a semantic token (described by semantic token selector) to one or more textMate scopes used to represent that token.'),
                        type: 'object',
                        additionalProperties: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        }
    });
    class TokenClassificationExtensionPoints {
        constructor() {
            function validateTypeOrModifier(contribution, extensionPoint, collector) {
                if (typeof contribution.id !== 'string' || contribution.id.length === 0) {
                    collector.error(nls.localize('invalid.id', "'configuration.{0}.id' must be defined and can not be empty", extensionPoint));
                    return false;
                }
                if (!contribution.id.match(tokenClassificationRegistry_1.typeAndModifierIdPattern)) {
                    collector.error(nls.localize('invalid.id.format', "'configuration.{0}.id' must follow the pattern letterOrDigit[-_letterOrDigit]*", extensionPoint));
                    return false;
                }
                const superType = contribution.superType;
                if (superType && !superType.match(tokenClassificationRegistry_1.typeAndModifierIdPattern)) {
                    collector.error(nls.localize('invalid.superType.format', "'configuration.{0}.superType' must follow the pattern letterOrDigit[-_letterOrDigit]*", extensionPoint));
                    return false;
                }
                if (typeof contribution.description !== 'string' || contribution.id.length === 0) {
                    collector.error(nls.localize('invalid.description', "'configuration.{0}.description' must be defined and can not be empty", extensionPoint));
                    return false;
                }
                return true;
            }
            tokenTypeExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.semanticTokenTypeConfiguration', "'configuration.semanticTokenType' must be an array"));
                        return;
                    }
                    for (const contribution of extensionValue) {
                        if (validateTypeOrModifier(contribution, 'semanticTokenType', collector)) {
                            tokenClassificationRegistry.registerTokenType(contribution.id, contribution.description, contribution.superType);
                        }
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const contribution of extensionValue) {
                        tokenClassificationRegistry.deregisterTokenType(contribution.id);
                    }
                }
            });
            tokenModifierExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.semanticTokenModifierConfiguration', "'configuration.semanticTokenModifier' must be an array"));
                        return;
                    }
                    for (const contribution of extensionValue) {
                        if (validateTypeOrModifier(contribution, 'semanticTokenModifier', collector)) {
                            tokenClassificationRegistry.registerTokenModifier(contribution.id, contribution.description);
                        }
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const contribution of extensionValue) {
                        tokenClassificationRegistry.deregisterTokenModifier(contribution.id);
                    }
                }
            });
            tokenStyleDefaultsExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.semanticTokenScopes.configuration', "'configuration.semanticTokenScopes' must be an array"));
                        return;
                    }
                    for (const contribution of extensionValue) {
                        if (contribution.language && typeof contribution.language !== 'string') {
                            collector.error(nls.localize('invalid.semanticTokenScopes.language', "'configuration.semanticTokenScopes.language' must be a string"));
                            continue;
                        }
                        if (!contribution.scopes || typeof contribution.scopes !== 'object') {
                            collector.error(nls.localize('invalid.semanticTokenScopes.scopes', "'configuration.semanticTokenScopes.scopes' must be defined as an object"));
                            continue;
                        }
                        for (const selectorString in contribution.scopes) {
                            const tmScopes = contribution.scopes[selectorString];
                            if (!Array.isArray(tmScopes) || tmScopes.some(l => typeof l !== 'string')) {
                                collector.error(nls.localize('invalid.semanticTokenScopes.scopes.value', "'configuration.semanticTokenScopes.scopes' values must be an array of strings"));
                                continue;
                            }
                            try {
                                const selector = tokenClassificationRegistry.parseTokenSelector(selectorString, contribution.language);
                                tokenClassificationRegistry.registerTokenStyleDefault(selector, { scopesToProbe: tmScopes.map(s => s.split(' ')) });
                            }
                            catch (e) {
                                collector.error(nls.localize('invalid.semanticTokenScopes.scopes.selector', "configuration.semanticTokenScopes.scopes': Problems parsing selector {0}.", selectorString));
                                // invalid selector, ignore
                            }
                        }
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const contribution of extensionValue) {
                        for (const selectorString in contribution.scopes) {
                            const tmScopes = contribution.scopes[selectorString];
                            try {
                                const selector = tokenClassificationRegistry.parseTokenSelector(selectorString, contribution.language);
                                tokenClassificationRegistry.registerTokenStyleDefault(selector, { scopesToProbe: tmScopes.map(s => s.split(' ')) });
                            }
                            catch (e) {
                                // invalid selector, ignore
                            }
                        }
                    }
                }
            });
        }
    }
    exports.TokenClassificationExtensionPoints = TokenClassificationExtensionPoints;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5DbGFzc2lmaWNhdGlvbkV4dGVuc2lvblBvaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi90b2tlbkNsYXNzaWZpY2F0aW9uRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxNQUFNLDJCQUEyQixHQUFpQyxJQUFBLDREQUE4QixHQUFFLENBQUM7SUFFbkcsTUFBTSxpQkFBaUIsR0FBRyx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBNkI7UUFDL0YsY0FBYyxFQUFFLG9CQUFvQjtRQUNwQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRSxtQ0FBbUMsQ0FBQztZQUNoRyxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxVQUFVLEVBQUU7b0JBQ1gsRUFBRSxFQUFFO3dCQUNILElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1DQUFtQyxFQUFFLDJDQUEyQyxDQUFDO3dCQUMzRyxPQUFPLEVBQUUsc0RBQXdCO3dCQUNqQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDBDQUEwQyxFQUFFLG1FQUFtRSxDQUFDO3FCQUNsSjtvQkFDRCxTQUFTLEVBQUU7d0JBQ1YsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMENBQTBDLEVBQUUsMkNBQTJDLENBQUM7d0JBQ2xILE9BQU8sRUFBRSxzREFBd0I7d0JBQ2pDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaURBQWlELEVBQUUsbUVBQW1FLENBQUM7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
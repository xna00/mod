/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, nls_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsConfigurationInitialContent = exports.ExtensionsConfigurationSchema = exports.ExtensionsConfigurationSchemaId = void 0;
    exports.ExtensionsConfigurationSchemaId = 'vscode://schemas/extensions';
    exports.ExtensionsConfigurationSchema = {
        id: exports.ExtensionsConfigurationSchemaId,
        allowComments: true,
        allowTrailingCommas: true,
        type: 'object',
        title: (0, nls_1.localize)('app.extensions.json.title', "Extensions"),
        additionalProperties: false,
        properties: {
            recommendations: {
                type: 'array',
                description: (0, nls_1.localize)('app.extensions.json.recommendations', "List of extensions which should be recommended for users of this workspace. The identifier of an extension is always '${publisher}.${name}'. For example: 'vscode.csharp'."),
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                    errorMessage: (0, nls_1.localize)('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                },
            },
            unwantedRecommendations: {
                type: 'array',
                description: (0, nls_1.localize)('app.extensions.json.unwantedRecommendations', "List of extensions recommended by VS Code that should not be recommended for users of this workspace. The identifier of an extension is always '${publisher}.${name}'. For example: 'vscode.csharp'."),
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                    errorMessage: (0, nls_1.localize)('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                },
            },
        }
    };
    exports.ExtensionsConfigurationInitialContent = [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=827846 to learn about workspace recommendations.',
        '\t// Extension identifier format: ${publisher}.${name}. Example: vscode.csharp',
        '',
        '\t// List of extensions which should be recommended for users of this workspace.',
        '\t"recommendations": [',
        '\t\t',
        '\t],',
        '\t// List of extensions recommended by VS Code that should not be recommended for users of this workspace.',
        '\t"unwantedRecommendations": [',
        '\t\t',
        '\t]',
        '}'
    ].join('\n');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0ZpbGVUZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uc0ZpbGVUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSwrQkFBK0IsR0FBRyw2QkFBNkIsQ0FBQztJQUNoRSxRQUFBLDZCQUE2QixHQUFnQjtRQUN6RCxFQUFFLEVBQUUsdUNBQStCO1FBQ25DLGFBQWEsRUFBRSxJQUFJO1FBQ25CLG1CQUFtQixFQUFFLElBQUk7UUFDekIsSUFBSSxFQUFFLFFBQVE7UUFDZCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsWUFBWSxDQUFDO1FBQzFELG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsVUFBVSxFQUFFO1lBQ1gsZUFBZSxFQUFFO2dCQUNoQixJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMscUNBQXFDLEVBQUUsNEtBQTRLLENBQUM7Z0JBQzFPLEtBQUssRUFBRTtvQkFDTixJQUFJLEVBQUUsUUFBUTtvQkFDZCxPQUFPLEVBQUUsa0RBQTRCO29CQUNyQyxZQUFZLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUNBQXVDLEVBQUUsbUVBQW1FLENBQUM7aUJBQ3BJO2FBQ0Q7WUFDRCx1QkFBdUIsRUFBRTtnQkFDeEIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZDQUE2QyxFQUFFLHNNQUFzTSxDQUFDO2dCQUM1USxLQUFLLEVBQUU7b0JBQ04sSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxFQUFFLGtEQUE0QjtvQkFDckMsWUFBWSxFQUFFLElBQUEsY0FBUSxFQUFDLHVDQUF1QyxFQUFFLG1FQUFtRSxDQUFDO2lCQUNwSTthQUNEO1NBQ0Q7S0FDRCxDQUFDO0lBRVcsUUFBQSxxQ0FBcUMsR0FBVztRQUM1RCxHQUFHO1FBQ0gsbUdBQW1HO1FBQ25HLGdGQUFnRjtRQUNoRixFQUFFO1FBQ0Ysa0ZBQWtGO1FBQ2xGLHdCQUF3QjtRQUN4QixNQUFNO1FBQ04sTUFBTTtRQUNOLDRHQUE0RztRQUM1RyxnQ0FBZ0M7UUFDaEMsTUFBTTtRQUNOLEtBQUs7UUFDTCxHQUFHO0tBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMifQ==
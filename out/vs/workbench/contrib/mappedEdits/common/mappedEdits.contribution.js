/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/platform/commands/common/commands"], function (require, exports, cancellation_1, languageFeatures_1, resolverService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    commands_1.CommandsRegistry.registerCommand('_executeMappedEditsProvider', async (accessor, documentUri, codeBlocks, context) => {
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const langFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const document = await modelService.createModelReference(documentUri);
        let result = null;
        try {
            const providers = langFeaturesService.mappedEditsProvider.ordered(document.object.textEditorModel);
            if (providers.length > 0) {
                const mostRelevantProvider = providers[0];
                const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                result = await mostRelevantProvider.provideMappedEdits(document.object.textEditorModel, codeBlocks, context, cancellationTokenSource.token);
            }
        }
        finally {
            document.dispose();
        }
        return result;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGVkRWRpdHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXBwZWRFZGl0cy9jb21tb24vbWFwcGVkRWRpdHMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLDJCQUFnQixDQUFDLGVBQWUsQ0FDL0IsNkJBQTZCLEVBQzdCLEtBQUssRUFDSixRQUEwQixFQUMxQixXQUFnQixFQUNoQixVQUFvQixFQUNwQixPQUFxQyxFQUNLLEVBQUU7UUFFNUMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBaUIsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQ0FBd0IsQ0FBQyxDQUFDO1FBRW5FLE1BQU0sUUFBUSxHQUFHLE1BQU0sWUFBWSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXRFLElBQUksTUFBTSxHQUFtQyxJQUFJLENBQUM7UUFFbEQsSUFBSSxDQUFDO1lBQ0osTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFbkcsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMxQixNQUFNLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFMUMsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7Z0JBRTlELE1BQU0sR0FBRyxNQUFNLG9CQUFvQixDQUFDLGtCQUFrQixDQUNyRCxRQUFRLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFDL0IsVUFBVSxFQUNWLE9BQU8sRUFDUCx1QkFBdUIsQ0FBQyxLQUFLLENBQzdCLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztnQkFBUyxDQUFDO1lBQ1YsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMsQ0FDRCxDQUFDIn0=
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey"], function (require, exports, cancellation_1, errors_1, types_1, uri_1, position_1, languages, languageFeatures_1, resolverService_1, commands_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = void 0;
    exports.provideSignatureHelp = provideSignatureHelp;
    exports.Context = {
        Visible: new contextkey_1.RawContextKey('parameterHintsVisible', false),
        MultipleSignatures: new contextkey_1.RawContextKey('parameterHintsMultipleSignatures', false),
    };
    async function provideSignatureHelp(registry, model, position, context, token) {
        const supports = registry.ordered(model);
        for (const support of supports) {
            try {
                const result = await support.provideSignatureHelp(model, position, token, context);
                if (result) {
                    return result;
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
        }
        return undefined;
    }
    commands_1.CommandsRegistry.registerCommand('_executeSignatureHelpProvider', async (accessor, ...args) => {
        const [uri, position, triggerCharacter] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        (0, types_1.assertType)(typeof triggerCharacter === 'string' || !triggerCharacter);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const result = await provideSignatureHelp(languageFeaturesService.signatureHelpProvider, ref.object.textEditorModel, position_1.Position.lift(position), {
                triggerKind: languages.SignatureHelpTriggerKind.Invoke,
                isRetrigger: false,
                triggerCharacter,
            }, cancellation_1.CancellationToken.None);
            if (!result) {
                return undefined;
            }
            setTimeout(() => result.dispose(), 0);
            return result.value;
        }
        finally {
            ref.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZVNpZ25hdHVyZUhlbHAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3BhcmFtZXRlckhpbnRzL2Jyb3dzZXIvcHJvdmlkZVNpZ25hdHVyZUhlbHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxvREFxQkM7SUExQlksUUFBQSxPQUFPLEdBQUc7UUFDdEIsT0FBTyxFQUFFLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxLQUFLLENBQUM7UUFDbkUsa0JBQWtCLEVBQUUsSUFBSSwwQkFBYSxDQUFVLGtDQUFrQyxFQUFFLEtBQUssQ0FBQztLQUN6RixDQUFDO0lBRUssS0FBSyxVQUFVLG9CQUFvQixDQUN6QyxRQUFrRSxFQUNsRSxLQUFpQixFQUNqQixRQUFrQixFQUNsQixPQUF1QyxFQUN2QyxLQUF3QjtRQUd4QixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXpDLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNuRixJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxJQUFBLGtDQUF5QixFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELDJCQUFnQixDQUFDLGVBQWUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBK0IsRUFBRSxFQUFFO1FBQ3hILE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQy9DLElBQUEsa0JBQVUsRUFBQyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBQSxrQkFBVSxFQUFDLG1CQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBQSxrQkFBVSxFQUFDLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUV0RSxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztRQUV2RSxNQUFNLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQWlCLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1RSxJQUFJLENBQUM7WUFFSixNQUFNLE1BQU0sR0FBRyxNQUFNLG9CQUFvQixDQUFDLHVCQUF1QixDQUFDLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLG1CQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM3SSxXQUFXLEVBQUUsU0FBUyxDQUFDLHdCQUF3QixDQUFDLE1BQU07Z0JBQ3RELFdBQVcsRUFBRSxLQUFLO2dCQUNsQixnQkFBZ0I7YUFDaEIsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBRXJCLENBQUM7Z0JBQVMsQ0FBQztZQUNWLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNmLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQyJ9
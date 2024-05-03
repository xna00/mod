/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/services/resolverService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/platform/commands/common/commands"], function (require, exports, cancellation_1, types_1, uri_1, resolverService_1, outlineModel_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    commands_1.CommandsRegistry.registerCommand('_executeDocumentSymbolProvider', async function (accessor, ...args) {
        const [resource] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        const outlineService = accessor.get(outlineModel_1.IOutlineModelService);
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const reference = await modelService.createModelReference(resource);
        try {
            return (await outlineService.getOrCreate(reference.object.textEditorModel, cancellation_1.CancellationToken.None)).getTopLevelSymbols();
        }
        finally {
            reference.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTeW1ib2xzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kb2N1bWVudFN5bWJvbHMvYnJvd3Nlci9kb2N1bWVudFN5bWJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssV0FBVyxRQUFRLEVBQUUsR0FBRyxJQUFJO1FBQ25HLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDeEIsSUFBQSxrQkFBVSxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUVoQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUM7UUFDMUQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBaUIsQ0FBQyxDQUFDO1FBRXJELE1BQU0sU0FBUyxHQUFHLE1BQU0sWUFBWSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQztZQUNKLE9BQU8sQ0FBQyxNQUFNLGNBQWMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFILENBQUM7Z0JBQVMsQ0FBQztZQUNWLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUMifQ==
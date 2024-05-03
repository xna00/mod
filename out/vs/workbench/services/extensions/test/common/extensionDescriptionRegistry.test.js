/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionDescriptionRegistry"], function (require, exports, assert, uri_1, extensions_1, extensionDescriptionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionDescriptionRegistry', () => {
        test('allow removing and adding the same extension at a different version', () => {
            const idA = new extensions_1.ExtensionIdentifier('a');
            const extensionA1 = desc(idA, '1.0.0');
            const extensionA2 = desc(idA, '2.0.0');
            const basicActivationEventsReader = {
                readActivationEvents: (extensionDescription) => {
                    return extensionDescription.activationEvents ?? [];
                }
            };
            const registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(basicActivationEventsReader, [extensionA1]);
            registry.deltaExtensions([extensionA2], [idA]);
            assert.deepStrictEqual(registry.getAllExtensionDescriptions(), [extensionA2]);
        });
        function desc(id, version, activationEvents = ['*']) {
            return {
                name: id.value,
                publisher: 'test',
                version: '0.0.0',
                engines: { vscode: '^1.0.0' },
                identifier: id,
                extensionLocation: uri_1.URI.parse(`nothing://nowhere`),
                isBuiltin: false,
                isUnderDevelopment: false,
                isUserBuiltin: false,
                activationEvents,
                main: 'index.js',
                targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
                extensionDependencies: []
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRGVzY3JpcHRpb25SZWdpc3RyeS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy90ZXN0L2NvbW1vbi9leHRlbnNpb25EZXNjcmlwdGlvblJlZ2lzdHJ5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtRQUMxQyxJQUFJLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQ2hGLE1BQU0sR0FBRyxHQUFHLElBQUksZ0NBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRXZDLE1BQU0sMkJBQTJCLEdBQTRCO2dCQUM1RCxvQkFBb0IsRUFBRSxDQUFDLG9CQUEyQyxFQUFZLEVBQUU7b0JBQy9FLE9BQU8sb0JBQW9CLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDO2dCQUNwRCxDQUFDO2FBQ0QsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLElBQUksMkRBQTRCLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzlGLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFL0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLElBQUksQ0FBQyxFQUF1QixFQUFFLE9BQWUsRUFBRSxtQkFBNkIsQ0FBQyxHQUFHLENBQUM7WUFDekYsT0FBTztnQkFDTixJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2QsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO2dCQUM3QixVQUFVLEVBQUUsRUFBRTtnQkFDZCxpQkFBaUIsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDO2dCQUNqRCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLGdCQUFnQjtnQkFDaEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLGNBQWMsNENBQTBCO2dCQUN4QyxxQkFBcUIsRUFBRSxFQUFFO2FBQ3pCLENBQUM7UUFDSCxDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUMifQ==
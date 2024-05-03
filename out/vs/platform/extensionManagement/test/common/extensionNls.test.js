/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/objects", "vs/base/test/common/utils", "vs/platform/extensionManagement/common/extensionNls", "vs/platform/log/common/log"], function (require, exports, assert, objects_1, utils_1, extensionNls_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const manifest = {
        name: 'test',
        publisher: 'test',
        version: '1.0.0',
        engines: {
            vscode: '*'
        },
        contributes: {
            commands: [
                {
                    command: 'test.command',
                    title: '%test.command.title%',
                    category: '%test.command.category%'
                },
            ],
            authentication: [
                {
                    id: 'test.authentication',
                    label: '%test.authentication.label%',
                }
            ],
            configuration: {
                // to ensure we test another "title" property
                title: '%test.configuration.title%',
                properties: {
                    'test.configuration': {
                        type: 'string',
                        description: 'not important',
                    }
                }
            }
        }
    };
    suite('Localize Manifest', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('replaces template strings', function () {
            const localizedManifest = (0, extensionNls_1.localizeManifest)(store.add(new log_1.NullLogger()), (0, objects_1.deepClone)(manifest), {
                'test.command.title': 'Test Command',
                'test.command.category': 'Test Category',
                'test.authentication.label': 'Test Authentication',
                'test.configuration.title': 'Test Configuration',
            });
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].title, 'Test Command');
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].category, 'Test Category');
            assert.strictEqual(localizedManifest.contributes?.authentication?.[0].label, 'Test Authentication');
            assert.strictEqual((localizedManifest.contributes?.configuration).title, 'Test Configuration');
        });
        test('replaces template strings with fallback if not found in translations', function () {
            const localizedManifest = (0, extensionNls_1.localizeManifest)(store.add(new log_1.NullLogger()), (0, objects_1.deepClone)(manifest), {}, {
                'test.command.title': 'Test Command',
                'test.command.category': 'Test Category',
                'test.authentication.label': 'Test Authentication',
                'test.configuration.title': 'Test Configuration',
            });
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].title, 'Test Command');
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].category, 'Test Category');
            assert.strictEqual(localizedManifest.contributes?.authentication?.[0].label, 'Test Authentication');
            assert.strictEqual((localizedManifest.contributes?.configuration).title, 'Test Configuration');
        });
        test('replaces template strings - command title & categories become ILocalizedString', function () {
            const localizedManifest = (0, extensionNls_1.localizeManifest)(store.add(new log_1.NullLogger()), (0, objects_1.deepClone)(manifest), {
                'test.command.title': 'Befehl test',
                'test.command.category': 'Testkategorie',
                'test.authentication.label': 'Testauthentifizierung',
                'test.configuration.title': 'Testkonfiguration',
            }, {
                'test.command.title': 'Test Command',
                'test.command.category': 'Test Category',
                'test.authentication.label': 'Test Authentication',
                'test.configuration.title': 'Test Configuration',
            });
            const title = localizedManifest.contributes?.commands?.[0].title;
            const category = localizedManifest.contributes?.commands?.[0].category;
            assert.strictEqual(title.value, 'Befehl test');
            assert.strictEqual(title.original, 'Test Command');
            assert.strictEqual(category.value, 'Testkategorie');
            assert.strictEqual(category.original, 'Test Category');
            // Everything else stays as a string.
            assert.strictEqual(localizedManifest.contributes?.authentication?.[0].label, 'Testauthentifizierung');
            assert.strictEqual((localizedManifest.contributes?.configuration).title, 'Testkonfiguration');
        });
        test('replaces template strings - is best effort #164630', function () {
            const manifestWithTypo = {
                name: 'test',
                publisher: 'test',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                },
                contributes: {
                    authentication: [
                        {
                            id: 'test.authentication',
                            // This not existing in the bundle shouldn't cause an error.
                            label: '%doesnotexist%',
                        }
                    ],
                    commands: [
                        {
                            command: 'test.command',
                            title: '%test.command.title%',
                            category: '%test.command.category%'
                        },
                    ],
                }
            };
            const localizedManifest = (0, extensionNls_1.localizeManifest)(store.add(new log_1.NullLogger()), (0, objects_1.deepClone)(manifestWithTypo), {
                'test.command.title': 'Test Command',
                'test.command.category': 'Test Category'
            });
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].title, 'Test Command');
            assert.strictEqual(localizedManifest.contributes?.commands?.[0].category, 'Test Category');
            assert.strictEqual(localizedManifest.contributes?.authentication?.[0].label, '%doesnotexist%');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTmxzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvdGVzdC9jb21tb24vZXh0ZW5zaW9uTmxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsTUFBTSxRQUFRLEdBQXVCO1FBQ3BDLElBQUksRUFBRSxNQUFNO1FBQ1osU0FBUyxFQUFFLE1BQU07UUFDakIsT0FBTyxFQUFFLE9BQU87UUFDaEIsT0FBTyxFQUFFO1lBQ1IsTUFBTSxFQUFFLEdBQUc7U0FDWDtRQUNELFdBQVcsRUFBRTtZQUNaLFFBQVEsRUFBRTtnQkFDVDtvQkFDQyxPQUFPLEVBQUUsY0FBYztvQkFDdkIsS0FBSyxFQUFFLHNCQUFzQjtvQkFDN0IsUUFBUSxFQUFFLHlCQUF5QjtpQkFDbkM7YUFDRDtZQUNELGNBQWMsRUFBRTtnQkFDZjtvQkFDQyxFQUFFLEVBQUUscUJBQXFCO29CQUN6QixLQUFLLEVBQUUsNkJBQTZCO2lCQUNwQzthQUNEO1lBQ0QsYUFBYSxFQUFFO2dCQUNkLDZDQUE2QztnQkFDN0MsS0FBSyxFQUFFLDRCQUE0QjtnQkFDbkMsVUFBVSxFQUFFO29CQUNYLG9CQUFvQixFQUFFO3dCQUNyQixJQUFJLEVBQUUsUUFBUTt3QkFDZCxXQUFXLEVBQUUsZUFBZTtxQkFDNUI7aUJBQ0Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQztJQUVGLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQ3hELElBQUksQ0FBQywyQkFBMkIsRUFBRTtZQUNqQyxNQUFNLGlCQUFpQixHQUFHLElBQUEsK0JBQWdCLEVBQ3pDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxnQkFBVSxF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
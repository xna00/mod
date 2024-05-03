/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/preferences/browser/keybindingsEditorContribution"], function (require, exports, assert, utils_1, keybindingsEditorContribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsEditorContribution', () => {
        function assertUserSettingsFuzzyEquals(a, b, expected) {
            const actual = keybindingsEditorContribution_1.KeybindingEditorDecorationsRenderer._userSettingsFuzzyEquals(a, b);
            const message = expected ? `${a} == ${b}` : `${a} != ${b}`;
            assert.strictEqual(actual, expected, 'fuzzy: ' + message);
        }
        function assertEqual(a, b) {
            assertUserSettingsFuzzyEquals(a, b, true);
        }
        function assertDifferent(a, b) {
            assertUserSettingsFuzzyEquals(a, b, false);
        }
        test('_userSettingsFuzzyEquals', () => {
            assertEqual('a', 'a');
            assertEqual('a', 'A');
            assertEqual('ctrl+a', 'CTRL+A');
            assertEqual('ctrl+a', ' CTRL+A ');
            assertEqual('ctrl+shift+a', 'shift+ctrl+a');
            assertEqual('ctrl+shift+a ctrl+alt+b', 'shift+ctrl+a alt+ctrl+b');
            assertDifferent('ctrl+[KeyA]', 'ctrl+a');
            // issue #23335
            assertEqual('cmd+shift+p', 'shift+cmd+p');
            assertEqual('cmd+shift+p', 'shift-cmd-p');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JDb250cmlidXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcHJlZmVyZW5jZXMvdGVzdC9icm93c2VyL2tleWJpbmRpbmdzRWRpdG9yQ29udHJpYnV0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUUzQyxTQUFTLDZCQUE2QixDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsUUFBaUI7WUFDN0UsTUFBTSxNQUFNLEdBQUcsbUVBQW1DLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFDLENBQVMsRUFBRSxDQUFTO1lBQ3hDLDZCQUE2QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELFNBQVMsZUFBZSxDQUFDLENBQVMsRUFBRSxDQUFTO1lBQzVDLDZCQUE2QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDckMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN0QixXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEMsV0FBVyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVsQyxXQUFXLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzVDLFdBQVcsQ0FBQyx5QkFBeUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBRWxFLGVBQWUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFekMsZUFBZTtZQUNmLFdBQVcsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDMUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9
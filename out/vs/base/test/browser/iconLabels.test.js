/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/test/common/utils"], function (require, exports, assert, iconLabels_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('renderLabelWithIcons', () => {
        test('no icons', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)(' hello World .');
            assert.strictEqual(elementsToString(result), ' hello World .');
        });
        test('icons only', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)('$(alert)');
            assert.strictEqual(elementsToString(result), '<span class="codicon codicon-alert"></span>');
        });
        test('icon and non-icon strings', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)(` $(alert) Unresponsive`);
            assert.strictEqual(elementsToString(result), ' <span class="codicon codicon-alert"></span> Unresponsive');
        });
        test('multiple icons', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)('$(check)$(error)');
            assert.strictEqual(elementsToString(result), '<span class="codicon codicon-check"></span><span class="codicon codicon-error"></span>');
        });
        test('escaped icons', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)('\\$(escaped)');
            assert.strictEqual(elementsToString(result), '$(escaped)');
        });
        test('icon with animation', () => {
            const result = (0, iconLabels_1.renderLabelWithIcons)('$(zip~anim)');
            assert.strictEqual(elementsToString(result), '<span class="codicon codicon-zip codicon-modifier-anim"></span>');
        });
        const elementsToString = (elements) => {
            return elements
                .map(elem => elem instanceof HTMLElement ? elem.outerHTML : elem)
                .reduce((a, b) => a + b, '');
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci9pY29uTGFiZWxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUVsQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFBLGlDQUFvQixFQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBQSxpQ0FBb0IsRUFBQyxVQUFVLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLDZDQUE2QyxDQUFDLENBQUM7UUFDN0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUEsaUNBQW9CLEVBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUU5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLDJEQUEyRCxDQUFDLENBQUM7UUFDM0csQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUEsaUNBQW9CLEVBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV4RCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLHdGQUF3RixDQUFDLENBQUM7UUFDeEksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFBLGlDQUFvQixFQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXBELE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUEsaUNBQW9CLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFFbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxpRUFBaUUsQ0FBQyxDQUFDO1FBQ2pILENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFFBQXFDLEVBQVUsRUFBRTtZQUMxRSxPQUFPLFFBQVE7aUJBQ2IsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxZQUFZLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNoRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQztRQUVGLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9
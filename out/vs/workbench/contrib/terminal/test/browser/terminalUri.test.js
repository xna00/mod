/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/terminal/browser/terminalUri"], function (require, exports, assert_1, utils_1, terminalUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fakeDragEvent(data) {
        return {
            dataTransfer: {
                getData: () => {
                    return data;
                }
            }
        };
    }
    suite('terminalUri', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('getTerminalResourcesFromDragEvent', () => {
            test('should give undefined when no terminal resources is in event', () => {
                (0, assert_1.deepStrictEqual)((0, terminalUri_1.getTerminalResourcesFromDragEvent)(fakeDragEvent(''))?.map(e => e.toString()), undefined);
            });
            test('should give undefined when an empty terminal resources array is in event', () => {
                (0, assert_1.deepStrictEqual)((0, terminalUri_1.getTerminalResourcesFromDragEvent)(fakeDragEvent('[]'))?.map(e => e.toString()), undefined);
            });
            test('should return terminal resource when event contains one', () => {
                (0, assert_1.deepStrictEqual)((0, terminalUri_1.getTerminalResourcesFromDragEvent)(fakeDragEvent('["vscode-terminal:/1626874386474/3"]'))?.map(e => e.toString()), ['vscode-terminal:/1626874386474/3']);
            });
            test('should return multiple terminal resources when event contains multiple', () => {
                (0, assert_1.deepStrictEqual)((0, terminalUri_1.getTerminalResourcesFromDragEvent)(fakeDragEvent('["vscode-terminal:/foo/1","vscode-terminal:/bar/2"]'))?.map(e => e.toString()), ['vscode-terminal:/foo/1', 'vscode-terminal:/bar/2']);
            });
        });
        suite('getInstanceFromResource', () => {
            test('should return undefined if there is no match', () => {
                (0, assert_1.strictEqual)((0, terminalUri_1.getInstanceFromResource)([
                    { resource: (0, terminalUri_1.getTerminalUri)('workspace', 2, 'title') }
                ], (0, terminalUri_1.getTerminalUri)('workspace', 1)), undefined);
            });
            test('should return a result if there is a match', () => {
                const instance = { resource: (0, terminalUri_1.getTerminalUri)('workspace', 2, 'title') };
                (0, assert_1.strictEqual)((0, terminalUri_1.getInstanceFromResource)([
                    { resource: (0, terminalUri_1.getTerminalUri)('workspace', 1, 'title') },
                    instance,
                    { resource: (0, terminalUri_1.getTerminalUri)('workspace', 3, 'title') }
                ], (0, terminalUri_1.getTerminalUri)('workspace', 2)), instance);
            });
            test('should ignore the fragment', () => {
                const instance = { resource: (0, terminalUri_1.getTerminalUri)('workspace', 2, 'title') };
                (0, assert_1.strictEqual)((0, terminalUri_1.getInstanceFromResource)([
                    { resource: (0, terminalUri_1.getTerminalUri)('workspace', 1, 'title') },
                    instance,
                    { resource: (0, terminalUri_1.getTerminalUri)('workspace', 3, 'title') }
                ], (0, terminalUri_1.getTerminalUri)('workspace', 2, 'does not match!')), instance);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxVcmkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9icm93c2VyL3Rlcm1pbmFsVXJpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsU0FBUyxhQUFhLENBQUMsSUFBWTtRQUNsQyxPQUFPO1lBQ04sWUFBWSxFQUFFO2dCQUNiLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNEO1NBQ0QsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUN6QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxJQUFJLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO2dCQUN6RSxJQUFBLHdCQUFlLEVBQ2QsSUFBQSwrQ0FBaUMsRUFBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDNUUsU0FBUyxDQUNULENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQywwRUFBMEUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3JGLElBQUEsd0JBQWUsRUFDZCxJQUFBLCtDQUFpQyxFQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUM5RSxTQUFTLENBQ1QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLHlEQUF5RCxFQUFF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
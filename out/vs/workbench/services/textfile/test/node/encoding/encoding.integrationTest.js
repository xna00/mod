/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/terminalEncoding", "vs/workbench/services/textfile/common/encoding"], function (require, exports, assert, terminalEncoding, encoding) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Encoding', function () {
        this.timeout(10000);
        test('resolve terminal encoding (detect)', async function () {
            const enc = await terminalEncoding.resolveTerminalEncoding();
            assert.ok(enc.length > 0);
        });
        test('resolve terminal encoding (environment)', async function () {
            process.env['VSCODE_CLI_ENCODING'] = 'utf16le';
            const enc = await terminalEncoding.resolveTerminalEncoding();
            assert.ok(await encoding.encodingExists(enc));
            assert.strictEqual(enc, 'utf16le');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RpbmcuaW50ZWdyYXRpb25UZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvdGVzdC9ub2RlL2VuY29kaW5nL2VuY29kaW5nLmludGVncmF0aW9uVGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsVUFBVSxFQUFFO1FBRWpCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEIsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEtBQUs7WUFDL0MsTUFBTSxHQUFHLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzdELE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLO1lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsR0FBRyxTQUFTLENBQUM7WUFFL0MsTUFBTSxHQUFHLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzdELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9
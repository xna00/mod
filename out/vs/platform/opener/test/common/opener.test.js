/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/opener/common/opener"], function (require, exports, assert, uri_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('extractSelection', () => {
        test('extractSelection with only startLineNumber', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#73');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: undefined, endColumn: undefined });
        });
        test('extractSelection with only startLineNumber in L format', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#L73');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: undefined, endColumn: undefined });
        });
        test('extractSelection with startLineNumber and startColumn', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#73,84');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 84, endLineNumber: undefined, endColumn: undefined });
        });
        test('extractSelection with startLineNumber and startColumn in L format', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#L73,84');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 84, endLineNumber: undefined, endColumn: undefined });
        });
        test('extractSelection with range and no column number', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#73-83');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: 83, endColumn: 1 });
        });
        test('extractSelection with range and no column number in L format', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#L73-L83');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: 83, endColumn: 1 });
        });
        test('extractSelection with range and no column number in L format only for start', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#L73-83');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: 83, endColumn: 1 });
        });
        test('extractSelection with range and no column number in L format only for end', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#73-L83');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 1, endLineNumber: 83, endColumn: 1 });
        });
        test('extractSelection with complete range', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#73,84-83,52');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 84, endLineNumber: 83, endColumn: 52 });
        });
        test('extractSelection with complete range in L format', async () => {
            const uri = uri_1.URI.parse('file:///some/file.js#L73,84-L83,52');
            assert.deepStrictEqual((0, opener_1.extractSelection)(uri).selection, { startLineNumber: 73, startColumn: 84, endLineNumber: 83, endColumn: 52 });
        });
        test('withSelection with startLineNumber and startColumn', async () => {
            assert.deepStrictEqual((0, opener_1.withSelection)(uri_1.URI.parse('file:///some/file.js'), { startLineNumber: 73, startColumn: 84 }).toString(), 'file:///some/file.js#73%2C84');
        });
        test('withSelection with startLineNumber, startColumn and endLineNumber', async () => {
            assert.deepStrictEqual((0, opener_1.withSelection)(uri_1.URI.parse('file:///some/file.js'), { startLineNumber: 73, startColumn: 84, endLineNumber: 83 }).toString(), 'file:///some/file.js#73%2C84-83');
        });
        test('withSelection with startLineNumber, startColumn and endLineNumber, endColumn', async () => {
            assert.deepStrictEqual((0, opener_1.withSelection)(uri_1.URI.parse('file:///some/file.js'), { startLineNumber: 73, startColumn: 84, endLineNumber: 83, endColumn: 52 }).toString(), 'file:///some/file.js#73%2C84-83%2C52');
        });
        test('extractSelection returns original withSelection URI', async () => {
            let uri = uri_1.URI.parse('file:///some/file.js');
            const uriWithSelection = (0, opener_1.withSelection)(uri_1.URI.parse('file:///some/file.js'), { startLineNumber: 73, startColumn: 84, endLineNumber: 83, endColumn: 52 });
            assert.strictEqual(uri.toString(), (0, opener_1.extractSelection)(uriWithSelection).uri.toString());
            uri = uri_1.URI.parse('file:///some/file.js');
            assert.strictEqual(uri.toString(), (0, opener_1.extractSelection)(uri).uri.toString());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL29wZW5lci90ZXN0L2NvbW1vbi9vcGVuZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBRTlCLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3RCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLHlCQUFnQixFQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLGVBQWUsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2xKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pFLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEseUJBQWdCLEVBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsZUFBZSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDbEosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdURBQXVELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEUsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyw0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
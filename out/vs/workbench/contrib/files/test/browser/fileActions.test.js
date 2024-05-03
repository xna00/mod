/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/files/browser/fileActions"], function (require, exports, assert, utils_1, fileActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - Increment file name simple', () => {
        test('Increment file name without any version', function () {
            const name = 'test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy.js');
        });
        test('Increment file name with suffix version', function () {
            const name = 'test copy.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy 2.js');
        });
        test('Increment file name with suffix version with leading zeros', function () {
            const name = 'test copy 005.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy 6.js');
        });
        test('Increment file name with suffix version, too big number', function () {
            const name = 'test copy 9007199254740992.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy 9007199254740992 copy.js');
        });
        test('Increment file name with just version in name', function () {
            const name = 'copy.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'copy copy.js');
        });
        test('Increment file name with just version in name, v2', function () {
            const name = 'copy 2.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'copy 2 copy.js');
        });
        test('Increment file name without any extension or version', function () {
            const name = 'test';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy');
        });
        test('Increment file name without any extension or version, trailing dot', function () {
            const name = 'test.';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy.');
        });
        test('Increment file name without any extension or version, leading dot', function () {
            const name = '.test';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, '.test copy');
        });
        test('Increment file name without any extension or version, leading dot v2', function () {
            const name = '..test';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, '. copy.test');
        });
        test('Increment file name without any extension but with suffix version', function () {
            const name = 'test copy 5';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'simple');
            assert.strictEqual(result, 'test copy 6');
        });
        test('Increment folder name without any version', function () {
            const name = 'test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy');
        });
        test('Increment folder name with suffix version', function () {
            const name = 'test copy';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy 2');
        });
        test('Increment folder name with suffix version, leading zeros', function () {
            const name = 'test copy 005';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy 6');
        });
        test('Increment folder name with suffix version, too big number', function () {
            const name = 'test copy 9007199254740992';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy 9007199254740992 copy');
        });
        test('Increment folder name with just version in name', function () {
            const name = 'copy';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'copy copy');
        });
        test('Increment folder name with just version in name, v2', function () {
            const name = 'copy 2';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'copy 2 copy');
        });
        test('Increment folder name "with extension" but without any version', function () {
            const name = 'test.js';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test.js copy');
        });
        test('Increment folder name "with extension" and with suffix version', function () {
            const name = 'test.js copy 5';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test.js copy 6');
        });
        test('Increment file/folder name with suffix version, special case 1', function () {
            const name = 'test copy 0';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy');
        });
        test('Increment file/folder name with suffix version, special case 2', function () {
            const name = 'test copy 1';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'simple');
            assert.strictEqual(result, 'test copy 2');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('Files - Increment file name smart', () => {
        test('Increment file name without any version', function () {
            const name = 'test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test.1.js');
        });
        test('Increment folder name without any version', function () {
            const name = 'test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test.1');
        });
        test('Increment file name with suffix version', function () {
            const name = 'test.1.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test.2.js');
        });
        test('Increment file name with suffix version with trailing zeros', function () {
            const name = 'test.001.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test.002.js');
        });
        test('Increment file name with suffix version with trailing zeros, changing length', function () {
            const name = 'test.009.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test.010.js');
        });
        test('Increment file name with suffix version with `-` as separator', function () {
            const name = 'test-1.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test-2.js');
        });
        test('Increment file name with suffix version with `-` as separator, trailing zeros', function () {
            const name = 'test-001.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test-002.js');
        });
        test('Increment file name with suffix version with `-` as separator, trailing zeros, changnig length', function () {
            const name = 'test-099.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test-100.js');
        });
        test('Increment file name with suffix version with `_` as separator', function () {
            const name = 'test_1.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test_2.js');
        });
        test('Increment folder name with suffix version', function () {
            const name = 'test.1';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test.2');
        });
        test('Increment folder name with suffix version, trailing zeros', function () {
            const name = 'test.001';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test.002');
        });
        test('Increment folder name with suffix version with `-` as separator', function () {
            const name = 'test-1';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test-2');
        });
        test('Increment folder name with suffix version with `_` as separator', function () {
            const name = 'test_1';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test_2');
        });
        test('Increment file name with suffix version, too big number', function () {
            const name = 'test.9007199254740992.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'test.9007199254740992.1.js');
        });
        test('Increment folder name with suffix version, too big number', function () {
            const name = 'test.9007199254740992';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, 'test.9007199254740992.1');
        });
        test('Increment file name with prefix version', function () {
            const name = '1.test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '2.test.js');
        });
        test('Increment file name with just version in name', function () {
            const name = '1.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '2.js');
        });
        test('Increment file name with just version in name, too big number', function () {
            const name = '9007199254740992.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '9007199254740992.1.js');
        });
        test('Increment file name with prefix version, trailing zeros', function () {
            const name = '001.test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '002.test.js');
        });
        test('Increment file name with prefix version with `-` as separator', function () {
            const name = '1-test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '2-test.js');
        });
        test('Increment file name with prefix version with `_` as separator', function () {
            const name = '1_test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '2_test.js');
        });
        test('Increment file name with prefix version, too big number', function () {
            const name = '9007199254740992.test.js';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '9007199254740992.test.1.js');
        });
        test('Increment file name with just version and no extension', function () {
            const name = '001004';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '001005');
        });
        test('Increment file name with just version and no extension, too big number', function () {
            const name = '9007199254740992';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, '9007199254740992.1');
        });
        test('Increment file name with no extension and no version', function () {
            const name = 'file';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'file1');
        });
        test('Increment file name with no extension', function () {
            const name = 'file1';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'file2');
        });
        test('Increment file name with no extension, too big number', function () {
            const name = 'file9007199254740992';
            const result = (0, fileActions_1.incrementFileName)(name, false, 'smart');
            assert.strictEqual(result, 'file9007199254740992.1');
        });
        test('Increment folder name with prefix version', function () {
            const name = '1.test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, '2.test');
        });
        test('Increment folder name with prefix version, too big number', function () {
            const name = '9007199254740992.test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, '9007199254740992.test.1');
        });
        test('Increment folder name with prefix version, trailing zeros', function () {
            const name = '001.test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, '002.test');
        });
        test('Increment folder name with prefix version  with `-` as separator', function () {
            const name = '1-test';
            const result = (0, fileActions_1.incrementFileName)(name, true, 'smart');
            assert.strictEqual(result, '2-test');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUFjdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvdGVzdC9icm93c2VyL2ZpbGVBY3Rpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtRQUVoRCxJQUFJLENBQUMseUNBQXlDLEVBQUU7WUFDL0MsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUEsK0JBQWlCLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRTtZQUMvQyxNQUFNLElBQUksR0FBRyxjQUFjLENBQUM7WUFDNUIsTUFBTSxNQUFNLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUU7WUFDbEUsTUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUM7WUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseURB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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/editor/test/common/testTextModel", "vs/base/common/platform", "vs/editor/common/model/textModel", "vs/base/common/lifecycle"], function (require, exports, assert, textfiles_1, uri_1, path_1, encoding_1, buffer_1, testTextModel_1, platform_1, textModel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = createSuite;
    /**
     * Allows us to reuse test suite across different environments.
     *
     * It introduces a bit of complexity with setup and teardown, however
     * it helps us to ensure that tests are added for all environments at once,
     * hence helps us catch bugs better.
     */
    function createSuite(params) {
        let service;
        let testDir = '';
        const { exists, stat, readFile, detectEncodingByBOM } = params;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const result = await params.setup();
            service = result.service;
            testDir = result.testDir;
        });
        teardown(async () => {
            await params.teardown();
            disposables.clear();
        });
        test('create - no encoding - content empty', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.txt'));
            await service.create([{ resource }]);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, 0 /* no BOM */);
        });
        test('create - no encoding - content provided (string)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.txt'));
            await service.create([{ resource, value: 'Hello World' }]);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.toString(), 'Hello World');
            assert.strictEqual(res.byteLength, 'Hello World'.length);
        });
        test('create - no encoding - content provided (snapshot)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.txt'));
            await service.create([{ resource, value: (0, textfiles_1.stringToSnapshot)('Hello World') }]);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.toString(), 'Hello World');
            assert.strictEqual(res.byteLength, 'Hello World'.length);
        });
        test('create - UTF 16 LE - no content', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf16le'));
            await service.create([{ resource }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF16le);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, encoding_1.UTF16le_BOM.length);
        });
        test('create - UTF 16 LE - content provided', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf16le'));
            await service.create([{ resource, value: 'Hello World' }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF16le);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, 'Hello World'.length * 2 /* UTF16 2bytes per char */ + encoding_1.UTF16le_BOM.length);
        });
        test('create - UTF 16 BE - no content', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf16be'));
            await service.create([{ resource }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF16be);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, encoding_1.UTF16le_BOM.length);
        });
        test('create - UTF 16 BE - content provided', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf16be'));
            await service.create([{ resource, value: 'Hello World' }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF16be);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, 'Hello World'.length * 2 /* UTF16 2bytes per char */ + encoding_1.UTF16be_BOM.length);
        });
        test('create - UTF 8 BOM - no content', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf8bom'));
            await service.create([{ resource }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, encoding_1.UTF8_BOM.length);
        });
        test('create - UTF 8 BOM - content provided', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf8bom'));
            await service.create([{ resource, value: 'Hello World' }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, 'Hello World'.length + encoding_1.UTF8_BOM.length);
        });
        function createTextModelSnapshot(text, preserveBOM) {
            const textModel = disposables.add((0, testTextModel_1.createTextModel)(text));
            const snapshot = textModel.createSnapshot(preserveBOM);
            return snapshot;
        }
        test('create - UTF 8 BOM - empty content - snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf8bom'));
            await service.create([{ resource, value: createTextModelSnapshot('') }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, encoding_1.UTF8_BOM.length);
        });
        test('create - UTF 8 BOM - content provided - snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_new.utf8bom'));
            await service.create([{ resource, value: createTextModelSnapshot('Hello World') }]);
            assert.strictEqual(await exists(resource.fsPath), true);
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            const res = await readFile(resource.fsPath);
            assert.strictEqual(res.byteLength, 'Hello World'.length + encoding_1.UTF8_BOM.length);
        });
        test('write - use encoding (UTF 16 BE) - small content as string', async () => {
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - small content as snapshot', async () => {
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')), encoding_1.UTF16be, createTextModelSnapshot('Hello\nWorld'), 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - large content as string', async () => {
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')), encoding_1.UTF16be, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - use encoding (UTF 16 BE) - large content as snapshot', async () => {
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')), encoding_1.UTF16be, createTextModelSnapshot('Hello\nWorld'), 'Hello\nWorld');
        });
        async function testEncoding(resource, encoding, content, expectedContent) {
            await service.write(resource, content, { encoding });
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding);
            const resolved = await service.readStream(resource);
            assert.strictEqual(resolved.encoding, encoding);
            const textBuffer = disposables.add(resolved.value.create(platform_1.isWindows ? 2 /* DefaultEndOfLine.CRLF */ : 1 /* DefaultEndOfLine.LF */).textBuffer);
            assert.strictEqual((0, textfiles_1.snapshotToString)(textBuffer.createSnapshot(false)), expectedContent);
        }
        test('write - use encoding (cp1252)', async () => {
            const filePath = (0, path_1.join)(testDir, 'some_cp1252.txt');
            const contents = await readFile(filePath, 'utf8');
            const eol = /\r\n/.test(contents) ? '\r\n' : '\n';
            await testEncodingKeepsData(uri_1.URI.file(filePath), 'cp1252', ['ObjectCount = LoadObjects("Öffentlicher Ordner");', '', 'Private = "Persönliche Information"', ''].join(eol));
        });
        test('write - use encoding (shiftjis)', async () => {
            await testEncodingKeepsData(uri_1.URI.file((0, path_1.join)(testDir, 'some_shiftjis.txt')), 'shiftjis', '中文abc');
        });
        test('write - use encoding (gbk)', async () => {
            await testEncodingKeepsData(uri_1.URI.file((0, path_1.join)(testDir, 'some_gbk.txt')), 'gbk', '中国abc');
        });
        test('write - use encoding (cyrillic)', async () => {
            await testEncodingKeepsData(uri_1.URI.file((0, path_1.join)(testDir, 'some_cyrillic.txt')), 'cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        });
        test('write - use encoding (big5)', async () => {
            await testEncodingKeepsData(uri_1.URI.file((0, path_1.join)(testDir, 'some_big5.txt')), 'cp950', '中文abc');
        });
        async function testEncodingKeepsData(resource, encoding, expected) {
            let resolved = await service.readStream(resource, { encoding });
            const textBuffer = disposables.add(resolved.value.create(platform_1.isWindows ? 2 /* DefaultEndOfLine.CRLF */ : 1 /* DefaultEndOfLine.LF */).textBuffer);
            const content = (0, textfiles_1.snapshotToString)(textBuffer.createSnapshot(false));
            assert.strictEqual(content, expected);
            await service.write(resource, content, { encoding });
            resolved = await service.readStream(resource, { encoding });
            const textBuffer2 = disposables.add(resolved.value.create(2 /* DefaultEndOfLine.CRLF */).textBuffer);
            assert.strictEqual((0, textfiles_1.snapshotToString)(textBuffer2.createSnapshot(false)), content);
            await service.write(resource, createTextModelSnapshot(content), { encoding });
            resolved = await service.readStream(resource, { encoding });
            const textBuffer3 = disposables.add(resolved.value.create(2 /* DefaultEndOfLine.CRLF */).textBuffer);
            assert.strictEqual((0, textfiles_1.snapshotToString)(textBuffer3.createSnapshot(false)), content);
        }
        test('write - no encoding - content as string', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const content = (await readFile(resource.fsPath)).toString();
            await service.write(resource, content);
            const resolved = await service.readStream(resource);
            assert.strictEqual(resolved.value.getFirstLineText(999999), content);
        });
        test('write - no encoding - content as snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const content = (await readFile(resource.fsPath)).toString();
            await service.write(resource, createTextModelSnapshot(content));
            const resolved = await service.readStream(resource);
            assert.strictEqual(resolved.value.getFirstLineText(999999), content);
        });
        test('write - encoding preserved (UTF 16 LE) - content as string', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css'));
            const resolved = await service.readStream(resource);
            assert.strictEqual(resolved.encoding, encoding_1.UTF16le);
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css')), encoding_1.UTF16le, 'Hello\nWorld', 'Hello\nWorld');
        });
        test('write - encoding preserved (UTF 16 LE) - content as snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css'));
            const resolved = await service.readStream(resource);
            assert.strictEqual(resolved.encoding, encoding_1.UTF16le);
            await testEncoding(uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css')), encoding_1.UTF16le, createTextModelSnapshot('Hello\nWorld'), 'Hello\nWorld');
        });
        test('write - UTF8 variations - content as string', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            let detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
            const content = (await readFile(resource.fsPath)).toString() + 'updates';
            await service.write(resource, content, { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            // ensure BOM preserved if enforced
            await service.write(resource, content, { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            // allow to remove BOM
            await service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
            // BOM does not come back
            await service.write(resource, content, { encoding: encoding_1.UTF8 });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
        });
        test('write - UTF8 variations - content as snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            let detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
            const model = disposables.add((0, testTextModel_1.createTextModel)((await readFile(resource.fsPath)).toString() + 'updates'));
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            // ensure BOM preserved if enforced
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8_with_bom });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            // allow to remove BOM
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
            // BOM does not come back
            await service.write(resource, model.createSnapshot(), { encoding: encoding_1.UTF8 });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, null);
        });
        test('write - preserve UTF8 BOM - content as string', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf8_bom.txt'));
            let detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
            await service.write(resource, 'Hello World', { encoding: detectedEncoding });
            detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
        });
        test('write - ensure BOM in empty file - content as string', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            await service.write(resource, '', { encoding: encoding_1.UTF8_with_bom });
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
        });
        test('write - ensure BOM in empty file - content as snapshot', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            await service.write(resource, createTextModelSnapshot(''), { encoding: encoding_1.UTF8_with_bom });
            const detectedEncoding = await detectEncodingByBOM(resource.fsPath);
            assert.strictEqual(detectedEncoding, encoding_1.UTF8_with_bom);
        });
        test('readStream - small text', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            await testReadStream(resource);
        });
        test('readStream - large text', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            await testReadStream(resource);
        });
        async function testReadStream(resource) {
            const result = await service.readStream(resource);
            assert.strictEqual(result.name, (0, path_1.basename)(resource.fsPath));
            assert.strictEqual(result.size, (await stat(resource.fsPath)).size);
            const content = (await readFile(resource.fsPath)).toString();
            const textBuffer = disposables.add(result.value.create(1 /* DefaultEndOfLine.LF */).textBuffer);
            assert.strictEqual((0, textfiles_1.snapshotToString)(textBuffer.createSnapshot(false)), (0, textfiles_1.snapshotToString)(createTextModelSnapshot(content, false)));
        }
        test('read - small text', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            await testRead(resource);
        });
        test('read - large text', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            await testRead(resource);
        });
        async function testRead(resource) {
            const result = await service.read(resource);
            assert.strictEqual(result.name, (0, path_1.basename)(resource.fsPath));
            assert.strictEqual(result.size, (await stat(resource.fsPath)).size);
            assert.strictEqual(result.value, (await readFile(resource.fsPath)).toString());
        }
        test('readStream - encoding picked up (CP1252)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = await service.readStream(resource, { encoding });
            assert.strictEqual(result.encoding, encoding);
            assert.strictEqual(result.value.getFirstLineText(999999), 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (CP1252)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_small_cp1252.txt'));
            const encoding = 'windows1252';
            const result = await service.read(resource, { encoding });
            assert.strictEqual(result.encoding, encoding);
            assert.strictEqual(result.value, 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (binary)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_small_cp1252.txt'));
            const encoding = 'binary';
            const result = await service.read(resource, { encoding });
            assert.strictEqual(result.encoding, encoding);
            assert.strictEqual(result.value, 'Private = "Persönlicheß Information"');
        });
        test('read - encoding picked up (base64)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_small_cp1252.txt'));
            const encoding = 'base64';
            const result = await service.read(resource, { encoding });
            assert.strictEqual(result.encoding, encoding);
            assert.strictEqual(result.value, btoa('Private = "Persönlicheß Information"'));
        });
        test('readStream - user overrides BOM', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css'));
            const result = await service.readStream(resource, { encoding: 'windows1252' });
            assert.strictEqual(result.encoding, 'windows1252');
        });
        test('readStream - BOM removed', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf8_bom.txt'));
            const result = await service.readStream(resource);
            assert.strictEqual(result.value.getFirstLineText(999999), 'This is some UTF 8 with BOM file.');
        });
        test('readStream - invalid encoding', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            const result = await service.readStream(resource, { encoding: 'superduper' });
            assert.strictEqual(result.encoding, 'utf8');
        });
        test('readStream - encoding override', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some.utf16le'));
            const result = await service.readStream(resource, { encoding: 'windows1252' });
            assert.strictEqual(result.encoding, 'utf16le');
            assert.strictEqual(result.value.getFirstLineText(999999), 'This is some UTF 16 with BOM file.');
        });
        test('readStream - large Big5', async () => {
            await testLargeEncoding('big5', '中文abc');
        });
        test('readStream - large CP1252', async () => {
            await testLargeEncoding('cp1252', 'öäüß');
        });
        test('readStream - large Cyrillic', async () => {
            await testLargeEncoding('cp866', 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя');
        });
        test('readStream - large GBK', async () => {
            await testLargeEncoding('gbk', '中国abc');
        });
        test('readStream - large ShiftJIS', async () => {
            await testLargeEncoding('shiftjis', '中文abc');
        });
        test('readStream - large UTF8 BOM', async () => {
            await testLargeEncoding('utf8bom', 'öäüß');
        });
        test('readStream - large UTF16 LE', async () => {
            await testLargeEncoding('utf16le', 'öäüß');
        });
        test('readStream - large UTF16 BE', async () => {
            await testLargeEncoding('utf16be', 'öäüß');
        });
        async function testLargeEncoding(encoding, needle) {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, `lorem_${encoding}.txt`));
            // Verify via `ITextFileService.readStream`
            const result = await service.readStream(resource, { encoding });
            assert.strictEqual(result.encoding, encoding);
            const textBuffer = disposables.add(result.value.create(1 /* DefaultEndOfLine.LF */).textBuffer);
            let contents = (0, textfiles_1.snapshotToString)(textBuffer.createSnapshot(false));
            assert.strictEqual(contents.indexOf(needle), 0);
            assert.ok(contents.indexOf(needle, 10) > 0);
            // Verify via `ITextFileService.getDecodedTextFactory`
            const rawFile = await params.readFile(resource.fsPath);
            let rawFileVSBuffer;
            if (rawFile instanceof buffer_1.VSBuffer) {
                rawFileVSBuffer = rawFile;
            }
            else {
                rawFileVSBuffer = buffer_1.VSBuffer.wrap(rawFile);
            }
            const factory = await (0, textModel_1.createTextBufferFactoryFromStream)(await service.getDecodedStream(resource, (0, buffer_1.bufferToStream)(rawFileVSBuffer), { encoding }));
            const textBuffer2 = disposables.add(factory.create(1 /* DefaultEndOfLine.LF */).textBuffer);
            contents = (0, textfiles_1.snapshotToString)(textBuffer2.createSnapshot(false));
            assert.strictEqual(contents.indexOf(needle), 0);
            assert.ok(contents.indexOf(needle, 10) > 0);
        }
        test('readStream - UTF16 LE (no BOM)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'utf16_le_nobom.txt'));
            const result = await service.readStream(resource);
            assert.strictEqual(result.encoding, 'utf16le');
        });
        test('readStream - UTF16 BE (no BOM)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'utf16_be_nobom.txt'));
            const result = await service.readStream(resource);
            assert.strictEqual(result.encoding, 'utf16be');
        });
        test('readStream - autoguessEncoding', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'some_cp1252.txt'));
            const result = await service.readStream(resource, { autoGuessEncoding: true });
            assert.strictEqual(result.encoding, 'windows1252');
        });
        test('readStream - FILE_IS_BINARY', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt'));
            let error = undefined;
            try {
                await service.readStream(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.textFileOperationResult, 0 /* TextFileOperationResult.FILE_IS_BINARY */);
            const result = await service.readStream(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.strictEqual(result.name, 'small.txt');
        });
        test('read - FILE_IS_BINARY', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt'));
            let error = undefined;
            try {
                await service.read(resource, { acceptTextOnly: true });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.textFileOperationResult, 0 /* TextFileOperationResult.FILE_IS_BINARY */);
            const result = await service.read(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')), { acceptTextOnly: true });
            assert.strictEqual(result.name, 'small.txt');
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTZXJ2aWNlLmlvLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS90ZXN0L2NvbW1vbi90ZXh0RmlsZVNlcnZpY2UuaW8udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9DaEcsOEJBNGtCQztJQW5sQkQ7Ozs7OztPQU1HO0lBQ0gsU0FBd0IsV0FBVyxDQUFDLE1BQWM7UUFDakQsSUFBSSxPQUF5QixDQUFDO1FBQzlCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNqQixNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsR0FBRyxNQUFNLENBQUM7UUFDL0QsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3pCLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLE1BQU0sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hCLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RCxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBRTFELE1B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
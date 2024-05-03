/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/types", "vs/editor/common/model/textModel", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/base/common/resources", "vs/workbench/services/textfile/common/encoding", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, assert, textFileEditorModel_1, textfiles_1, workbenchTestServices_1, utils_1, files_1, async_1, types_1, textModel_1, lifecycle_1, editor_1, resources_1, encoding_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileEditorModel', () => {
        function getLastModifiedTime(model) {
            const stat = (0, workbenchTestServices_1.getLastResolvedFileStat)(model);
            return stat ? stat.mtime : -1;
        }
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        let content;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            content = accessor.fileService.getContent();
            disposables.add(accessor.textFileService.files);
            disposables.add((0, lifecycle_1.toDisposable)(() => accessor.fileService.setContent(content)));
        });
        teardown(async () => {
            for (const textFileEditorModel of accessor.textFileService.files.models) {
                textFileEditorModel.dispose();
            }
            disposables.clear();
        });
        test('basic events', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            accessor.workingCopyService.testUnregisterWorkingCopy(model); // causes issues with subsequent resolves otherwise
            let onDidResolveCounter = 0;
            disposables.add(model.onDidResolve(() => onDidResolveCounter++));
            await model.resolve();
            assert.strictEqual(onDidResolveCounter, 1);
            let onDidChangeContentCounter = 0;
            disposables.add(model.onDidChangeContent(() => onDidChangeContentCounter++));
            let onDidChangeDirtyCounter = 0;
            disposables.add(model.onDidChangeDirty(() => onDidChangeDirtyCounter++));
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
            assert.strictEqual(onDidChangeContentCounter, 1);
            assert.strictEqual(onDidChangeDirtyCounter, 1);
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.strictEqual(onDidChangeContentCounter, 2);
            assert.strictEqual(onDidChangeDirtyCounter, 1);
            await model.revert();
            assert.strictEqual(onDidChangeDirtyCounter, 2);
        });
        test('isTextFileEditorModel', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            assert.strictEqual((0, textfiles_1.isTextFileEditorModel)(model), true);
            model.dispose();
        });
        test('save', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            let savedEvent = undefined;
            disposables.add(model.onDidSave(e => savedEvent = e));
            await model.save();
            assert.ok(!savedEvent);
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
            assert.ok(getLastModifiedTime(model) <= Date.now());
            assert.ok(model.hasState(1 /* TextFileEditorModelState.DIRTY */));
            assert.ok(model.isModified());
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            const source = editor_1.SaveSourceRegistry.registerSource('testSource', 'Hello Save');
            const pendingSave = model.save({ reason: 2 /* SaveReason.AUTO */, source });
            assert.ok(model.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */));
            await Promise.all([pendingSave, model.joinState(2 /* TextFileEditorModelState.PENDING_SAVE */)]);
            assert.ok(model.hasState(0 /* TextFileEditorModelState.SAVED */));
            assert.ok(!model.isDirty());
            assert.ok(!model.isModified());
            assert.ok(savedEvent);
            assert.ok(savedEvent.stat);
            assert.strictEqual(savedEvent.reason, 2 /* SaveReason.AUTO */);
            assert.strictEqual(savedEvent.source, source);
            assert.ok(workingCopyEvent);
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), false);
            savedEvent = undefined;
            await model.save({ force: true });
            assert.ok(savedEvent);
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('save - touching also emits saved event', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            let savedEvent = false;
            disposables.add(model.onDidSave(() => savedEvent = true));
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            await model.save({ force: true });
            assert.ok(savedEvent);
            assert.ok(!workingCopyEvent);
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('save - touching with error turns model dirty', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            let saveErrorEvent = false;
            disposables.add(model.onDidSaveError(() => saveErrorEvent = true));
            let savedEvent = false;
            disposables.add(model.onDidSave(() => savedEvent = true));
            accessor.fileService.writeShouldThrowError = new Error('failed to write');
            try {
                await model.save({ force: true });
                assert.ok(model.hasState(5 /* TextFileEditorModelState.ERROR */));
                assert.ok(model.isDirty());
                assert.ok(model.isModified());
                assert.ok(saveErrorEvent);
                assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
                assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
            }
            finally {
                accessor.fileService.writeShouldThrowError = undefined;
            }
            await model.save({ force: true });
            assert.ok(savedEvent);
            assert.strictEqual(model.isDirty(), false);
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('save - returns false when save fails', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            accessor.fileService.writeShouldThrowError = new Error('failed to write');
            try {
                const res = await model.save({ force: true });
                assert.strictEqual(res, false);
            }
            finally {
                accessor.fileService.writeShouldThrowError = undefined;
            }
            const res = await model.save({ force: true });
            assert.strictEqual(res, true);
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('save error (generic)', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
            let saveErrorEvent = false;
            disposables.add(model.onDidSaveError(() => saveErrorEvent = true));
            accessor.fileService.writeShouldThrowError = new Error('failed to write');
            try {
                const pendingSave = model.save();
                assert.ok(model.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */));
                await pendingSave;
                assert.ok(model.hasState(5 /* TextFileEditorModelState.ERROR */));
                assert.ok(model.isDirty());
                assert.ok(model.isModified());
                assert.ok(saveErrorEvent);
                assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
                assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
                model.dispose();
            }
            finally {
                accessor.fileService.writeShouldThrowError = undefined;
            }
        });
        test('save error (conflict)', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
            let saveErrorEvent = false;
            disposables.add(model.onDidSaveError(() => saveErrorEvent = true));
            accessor.fileService.writeShouldThrowError = new files_1.FileOperationError('save conflict', 3 /* FileOperationResult.FILE_MODIFIED_SINCE */);
            try {
                const pendingSave = model.save();
                assert.ok(model.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */));
                await pendingSave;
                assert.ok(model.hasState(3 /* TextFileEditorModelState.CONFLICT */));
                assert.ok(model.isDirty());
                assert.ok(model.isModified());
                assert.ok(saveErrorEvent);
                assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
                assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
                model.dispose();
            }
            finally {
                accessor.fileService.writeShouldThrowError = undefined;
            }
        });
        test('setEncoding - encode', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            let encodingEvent = false;
            disposables.add(model.onDidChangeEncoding(() => encodingEvent = true));
            await model.setEncoding('utf8', 0 /* EncodingMode.Encode */); // no-op
            assert.strictEqual(getLastModifiedTime(model), -1);
            assert.ok(!encodingEvent);
            await model.setEncoding('utf16', 0 /* EncodingMode.Encode */);
            assert.ok(encodingEvent);
            assert.ok(getLastModifiedTime(model) <= Date.now()); // indicates model was saved due to encoding change
        });
        test('setEncoding - decode', async function () {
            let model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            accessor.workingCopyService.testUnregisterWorkingCopy(model); // causes issues with subsequent resolves otherwise
            await model.setEncoding('utf16', 1 /* EncodingMode.Decode */);
            // we have to get the model again from working copy service
            // because `setEncoding` will resolve it again through the
            // text file service which is outside our scope
            model = accessor.workingCopyService.get(model);
            assert.ok(model.isResolved()); // model got resolved due to decoding
        });
        test('setEncoding - decode dirty file saves first', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            accessor.workingCopyService.testUnregisterWorkingCopy(model); // causes issues with subsequent resolves otherwise
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
            assert.strictEqual(model.isDirty(), true);
            await model.setEncoding('utf16', 1 /* EncodingMode.Decode */);
            assert.strictEqual(model.isDirty(), false);
        });
        test('encoding updates with language based configuration', async function () {
            const languageId = 'text-file-model-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: languageId,
            }));
            accessor.testConfigurationService.setOverrideIdentifiers('files.encoding', [languageId]);
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            accessor.workingCopyService.testUnregisterWorkingCopy(model); // causes issues with subsequent resolves otherwise
            await model.resolve();
            const deferredPromise = new async_1.DeferredPromise();
            // We use this listener as a way to figure out that the working
            // copy was resolved again as part of the language change
            disposables.add(accessor.workingCopyService.onDidRegister(e => {
                if ((0, resources_1.isEqual)(e.resource, model.resource)) {
                    deferredPromise.complete(model);
                }
            }));
            accessor.testConfigurationService.setUserConfiguration('files.encoding', encoding_1.UTF16be);
            model.setLanguageId(languageId);
            await deferredPromise.p;
            assert.strictEqual(model.getEncoding(), encoding_1.UTF16be);
        });
        test('create with language', async function () {
            const languageId = 'text-file-model-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: languageId,
            }));
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', languageId);
            await model.resolve();
            assert.strictEqual(model.textEditorModel.getLanguageId(), languageId);
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('disposes when underlying model is destroyed', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve();
            model.textEditorModel.dispose();
            assert.ok(model.isDisposed());
        });
        test('Resolve does not trigger save', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index.txt'), 'utf8', undefined);
            assert.ok(model.hasState(0 /* TextFileEditorModelState.SAVED */));
            disposables.add(model.onDidSave(() => assert.fail()));
            disposables.add(model.onDidChangeDirty(() => assert.fail()));
            await model.resolve();
            assert.ok(model.isResolved());
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('Resolve returns dirty model as long as model is dirty', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(model.isDirty());
            assert.ok(model.hasState(1 /* TextFileEditorModelState.DIRTY */));
            await model.resolve();
            assert.ok(model.isDirty());
        });
        test('Resolve with contents', async function () {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined);
            await model.resolve({ contents: (0, textModel_1.createTextBufferFactory)('Hello World') });
            assert.strictEqual(model.textEditorModel?.getValue(), 'Hello World');
            assert.strictEqual(model.isDirty(), true);
            await model.resolve({ contents: (0, textModel_1.createTextBufferFactory)('Hello Changes') });
            assert.strictEqual(model.textEditorModel?.getValue(), 'Hello Changes');
            assert.strictEqual(model.isDirty(), true);
            // verify that we do not mark the model as saved when undoing once because
            // we never really had a saved state
            await model.textEditorModel.undo();
            assert.ok(model.isDirty());
            model.dispose();
            assert.ok(!accessor.modelService.getModel(model.resource));
        });
        test('Revert', async function () {
            let eventCounter = 0;
            let model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(model.onDidRevert(() => eventCounter++));
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(model.isDirty());
            assert.ok(model.isModified());
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
            accessor.workingCopyService.testUnregisterWorkingCopy(model); // causes issues with subsequent resolves otherwise
            await model.revert();
            // we have to get the model again from working copy service
            // because `setEncoding` will resolve it again through the
            // text file service which is outside our scope
            model = accessor.workingCopyService.get(model);
            assert.strictEqual(model.isDirty(), false);
            assert.strictEqual(model.isModified(), false);
            assert.strictEqual(eventCounter, 1);
            assert.ok(workingCopyEvent);
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), false);
        });
        test('Revert (soft)', async function () {
            let eventCounter = 0;
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(model.onDidRevert(() => eventCounter++));
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(model.isDirty());
            assert.ok(model.isModified());
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
            await model.revert({ soft: true });
            assert.strictEqual(model.isDirty(), false);
            assert.strictEqual(model.isModified(), false);
            assert.strictEqual(model.textEditorModel.getValue(), 'foo');
            assert.strictEqual(eventCounter, 1);
            assert.ok(workingCopyEvent);
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), false);
        });
        test('Undo to saved state turns model non-dirty', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('Hello Text'));
            assert.ok(model.isDirty());
            await model.textEditorModel.undo();
            assert.ok(!model.isDirty());
        });
        test('Resolve and undo turns model dirty', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            accessor.fileService.setContent('Hello Change');
            await model.resolve();
            await model.textEditorModel.undo();
            assert.ok(model.isDirty());
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(accessor.workingCopyService.isDirty(model.resource, model.typeId), true);
        });
        test('Update Dirty', async function () {
            let eventCounter = 0;
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            model.setDirty(true);
            assert.ok(!model.isDirty()); // needs to be resolved
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(model.isDirty());
            await model.revert({ soft: true });
            assert.strictEqual(model.isDirty(), false);
            disposables.add(model.onDidChangeDirty(() => eventCounter++));
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            model.setDirty(true);
            assert.ok(model.isDirty());
            assert.strictEqual(eventCounter, 1);
            assert.ok(workingCopyEvent);
            model.setDirty(false);
            assert.strictEqual(model.isDirty(), false);
            assert.strictEqual(eventCounter, 2);
        });
        test('No Dirty or saving for readonly models', async function () {
            let workingCopyEvent = false;
            disposables.add(accessor.workingCopyService.onDidChangeDirty(e => {
                if (e.resource.toString() === model.resource.toString()) {
                    workingCopyEvent = true;
                }
            }));
            const model = disposables.add(instantiationService.createInstance(workbenchTestServices_1.TestReadonlyTextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            let saveEvent = false;
            disposables.add(model.onDidSave(() => {
                saveEvent = true;
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(!model.isDirty());
            await model.save({ force: true });
            assert.strictEqual(saveEvent, false);
            await model.revert({ soft: true });
            assert.ok(!model.isDirty());
            assert.ok(!workingCopyEvent);
        });
        test('File not modified error is handled gracefully', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            const mtime = getLastModifiedTime(model);
            accessor.textFileService.setReadStreamErrorOnce(new files_1.FileOperationError('error', 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */));
            await model.resolve();
            assert.ok(model);
            assert.strictEqual(getLastModifiedTime(model), mtime);
        });
        test('Resolve error is handled gracefully if model already exists', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            accessor.textFileService.setReadStreamErrorOnce(new files_1.FileOperationError('error', 1 /* FileOperationResult.FILE_NOT_FOUND */));
            await model.resolve();
            assert.ok(model);
        });
        test('save() and isDirty() - proper with check for mtimes', async function () {
            const input1 = disposables.add((0, workbenchTestServices_1.createFileEditorInput)(instantiationService, utils_1.toResource.call(this, '/path/index_async2.txt')));
            const input2 = disposables.add((0, workbenchTestServices_1.createFileEditorInput)(instantiationService, utils_1.toResource.call(this, '/path/index_async.txt')));
            const model1 = disposables.add(await input1.resolve());
            const model2 = disposables.add(await input2.resolve());
            model1.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            const m1Mtime = (0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model1)).mtime;
            const m2Mtime = (0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model2)).mtime;
            assert.ok(m1Mtime > 0);
            assert.ok(m2Mtime > 0);
            assert.ok(accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async2.txt')));
            assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
            model2.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
            await (0, async_1.timeout)(10);
            await accessor.textFileService.save(utils_1.toResource.call(this, '/path/index_async.txt'));
            await accessor.textFileService.save(utils_1.toResource.call(this, '/path/index_async2.txt'));
            assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async.txt')));
            assert.ok(!accessor.textFileService.isDirty(utils_1.toResource.call(this, '/path/index_async2.txt')));
            if (platform_1.isWeb) {
                // web tests does not ensure timeouts are respected at all, so we cannot
                // really assert the mtime to be different, only that it is equal or greater.
                // https://github.com/microsoft/vscode/issues/161886
                assert.ok((0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model1)).mtime >= m1Mtime);
                assert.ok((0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model2)).mtime >= m2Mtime);
            }
            else {
                // on desktop we want to assert this condition more strictly though
                assert.ok((0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model1)).mtime > m1Mtime);
                assert.ok((0, types_1.assertIsDefined)((0, workbenchTestServices_1.getLastResolvedFileStat)(model2)).mtime > m2Mtime);
            }
        });
        test('Save Participant', async function () {
            let eventCounter = 0;
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(model.onDidSave(() => {
                assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), eventCounter === 1 ? 'bar' : 'foobar');
                assert.ok(!model.isDirty());
                eventCounter++;
            }));
            const participant = accessor.textFileService.files.addSaveParticipant({
                participate: async (model) => {
                    assert.ok(model.isDirty());
                    model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
                    assert.ok(model.isDirty());
                    eventCounter++;
                }
            });
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            assert.ok(model.isDirty());
            await model.save();
            assert.strictEqual(eventCounter, 2);
            participant.dispose();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foobar'));
            assert.ok(model.isDirty());
            await model.save();
            assert.strictEqual(eventCounter, 3);
        });
        test('Save Participant - skip', async function () {
            let eventCounter = 0;
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: async () => {
                    eventCounter++;
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            await model.save({ skipSaveParticipants: true });
            assert.strictEqual(eventCounter, 0);
        });
        test('Save Participant, async participant', async function () {
            let eventCounter = 0;
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(model.onDidSave(() => {
                assert.ok(!model.isDirty());
                eventCounter++;
            }));
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: model => {
                    assert.ok(model.isDirty());
                    model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
                    assert.ok(model.isDirty());
                    eventCounter++;
                    return (0, async_1.timeout)(10);
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            const now = Date.now();
            await model.save();
            assert.strictEqual(eventCounter, 2);
            assert.ok(Date.now() - now >= 10);
        });
        test('Save Participant, bad participant', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: async () => {
                    new Error('boom');
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            await model.save();
        });
        test('Save Participant, participant cancelled when saved again', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            const participations = [];
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: async (model, context, progress, token) => {
                    await (0, async_1.timeout)(10);
                    if (!token.isCancellationRequested) {
                        participations.push(true);
                    }
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            const p1 = model.save();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo 1'));
            const p2 = model.save();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo 2'));
            const p3 = model.save();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo 3'));
            const p4 = model.save();
            await Promise.all([p1, p2, p3, p4]);
            assert.strictEqual(participations.length, 1);
        });
        test('Save Participant, calling save from within is unsupported but does not explode (sync save, no model change)', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await testSaveFromSaveParticipant(model, false, false, false);
        });
        test('Save Participant, calling save from within is unsupported but does not explode (async save, no model change)', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await testSaveFromSaveParticipant(model, true, false, false);
        });
        test('Save Participant, calling save from within is unsupported but does not explode (sync save, model change)', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await testSaveFromSaveParticipant(model, false, true, false);
        });
        test('Save Participant, calling save from within is unsupported but does not explode (async save, model change)', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await testSaveFromSaveParticipant(model, true, true, false);
        });
        test('Save Participant, calling save from within is unsupported but does not explode (force)', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await testSaveFromSaveParticipant(model, false, false, true);
        });
        async function testSaveFromSaveParticipant(model, async, modelChange, force) {
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: async () => {
                    if (async) {
                        await (0, async_1.timeout)(10);
                    }
                    if (modelChange) {
                        model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('bar'));
                        const newSavePromise = model.save(force ? { force } : undefined);
                        // assert that this is not the same promise as the outer one
                        assert.notStrictEqual(savePromise, newSavePromise);
                        await newSavePromise;
                    }
                    else {
                        const newSavePromise = model.save(force ? { force } : undefined);
                        // assert that this is the same promise as the outer one
                        assert.strictEqual(savePromise, newSavePromise);
                        await savePromise;
                    }
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            const savePromise = model.save(force ? { force } : undefined);
            await savePromise;
        }
        test('Save Participant carries context', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            const from = uri_1.URI.file('testFrom');
            let e = undefined;
            disposables.add(accessor.textFileService.files.addSaveParticipant({
                participate: async (wc, context) => {
                    try {
                        assert.strictEqual(context.reason, 1 /* SaveReason.EXPLICIT */);
                        assert.strictEqual(context.savedFrom?.toString(), from.toString());
                    }
                    catch (error) {
                        e = error;
                    }
                }
            }));
            await model.resolve();
            model.updateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'));
            await model.save({ force: true, from });
            if (e) {
                throw e;
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvdGVzdC9icm93c2VyL3RleHRGaWxlRWRpdG9yTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9CaEcsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUV6QyxTQUFTLG1CQUFtQixDQUFDLEtBQTBCO1lBQ3RELE1BQU0sSUFBSSxHQUFHLElBQUEsK0NBQXVCLEVBQUMsS0FBSyxDQUFDLENBQUM7WUFFNUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUNsQyxJQUFJLE9BQWUsQ0FBQztRQUVwQixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVDLFdBQVcsQ0FBQyxHQUFHLENBQTZCLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENB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
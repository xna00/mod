/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "path", "vs/base/common/errors", "vs/base/common/network", "vs/editor/common/diff/legacyLinesDiffComputer", "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer", "vs/base/test/common/utils"], function (require, exports, assert, fs_1, path_1, errors_1, network_1, legacyLinesDiffComputer_1, defaultLinesDiffComputer_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('diffing fixtures', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            (0, errors_1.setUnexpectedErrorHandler)(e => {
                throw e;
            });
        });
        const fixturesOutDir = network_1.FileAccess.asFileUri('vs/editor/test/node/diffing/fixtures').fsPath;
        // We want the dir in src, so we can directly update the source files if they disagree and create invalid files to capture the previous state.
        // This makes it very easy to update the fixtures.
        const fixturesSrcDir = (0, path_1.resolve)(fixturesOutDir).replaceAll('\\', '/').replace('/out/vs/editor/', '/src/vs/editor/');
        const folders = (0, fs_1.readdirSync)(fixturesSrcDir);
        function runTest(folder, diffingAlgoName) {
            const folderPath = (0, path_1.join)(fixturesSrcDir, folder);
            const files = (0, fs_1.readdirSync)(folderPath);
            const firstFileName = files.find(f => f.startsWith('1.'));
            const secondFileName = files.find(f => f.startsWith('2.'));
            const firstContent = (0, fs_1.readFileSync)((0, path_1.join)(folderPath, firstFileName), 'utf8').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
            const firstContentLines = firstContent.split(/\n/);
            const secondContent = (0, fs_1.readFileSync)((0, path_1.join)(folderPath, secondFileName), 'utf8').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
            const secondContentLines = secondContent.split(/\n/);
            const diffingAlgo = diffingAlgoName === 'legacy' ? new legacyLinesDiffComputer_1.LegacyLinesDiffComputer() : new defaultLinesDiffComputer_1.DefaultLinesDiffComputer();
            const ignoreTrimWhitespace = folder.indexOf('trimws') >= 0;
            const diff = diffingAlgo.computeDiff(firstContentLines, secondContentLines, { ignoreTrimWhitespace, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, computeMoves: true });
            function getDiffs(changes) {
                return changes.map(c => ({
                    originalRange: c.original.toString(),
                    modifiedRange: c.modified.toString(),
                    innerChanges: c.innerChanges?.map(c => ({
                        originalRange: formatRange(c.originalRange, firstContentLines),
                        modifiedRange: formatRange(c.modifiedRange, secondContentLines),
                    })) || null
                }));
            }
            function formatRange(range, lines) {
                const toLastChar = range.endColumn === lines[range.endLineNumber - 1].length + 1;
                return '[' + range.startLineNumber + ',' + range.startColumn + ' -> ' + range.endLineNumber + ',' + range.endColumn + (toLastChar ? ' EOL' : '') + ']';
            }
            const actualDiffingResult = {
                original: { content: firstContent, fileName: `./${firstFileName}` },
                modified: { content: secondContent, fileName: `./${secondFileName}` },
                diffs: getDiffs(diff.changes),
                moves: diff.moves.map(v => ({
                    originalRange: v.lineRangeMapping.original.toString(),
                    modifiedRange: v.lineRangeMapping.modified.toString(),
                    changes: getDiffs(v.changes),
                }))
            };
            if (actualDiffingResult.moves?.length === 0) {
                delete actualDiffingResult.moves;
            }
            const expectedFilePath = (0, path_1.join)(folderPath, `${diffingAlgoName}.expected.diff.json`);
            const invalidFilePath = (0, path_1.join)(folderPath, `${diffingAlgoName}.invalid.diff.json`);
            const actualJsonStr = JSON.stringify(actualDiffingResult, null, '\t');
            if (!(0, fs_1.existsSync)(expectedFilePath)) {
                // New test, create expected file
                (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                // Create invalid file so that this test fails on a re-run
                (0, fs_1.writeFileSync)(invalidFilePath, '');
                throw new Error('No expected file! Expected and invalid files were written. Delete the invalid file to make the test pass.');
            }
            if ((0, fs_1.existsSync)(invalidFilePath)) {
                const invalidJsonStr = (0, fs_1.readFileSync)(invalidFilePath, 'utf8');
                if (invalidJsonStr === '') {
                    // Update expected file
                    (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                    throw new Error(`Delete the invalid ${invalidFilePath} file to make the test pass.`);
                }
                else {
                    const expectedFileDiffResult = JSON.parse(invalidJsonStr);
                    try {
                        assert.deepStrictEqual(actualDiffingResult, expectedFileDiffResult);
                    }
                    catch (e) {
                        (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                        throw e;
                    }
                    // Test succeeded with the invalid file, restore expected file from invalid
                    (0, fs_1.writeFileSync)(expectedFilePath, invalidJsonStr);
                    (0, fs_1.rmSync)(invalidFilePath);
                }
            }
            else {
                const expectedJsonStr = (0, fs_1.readFileSync)(expectedFilePath, 'utf8');
                const expectedFileDiffResult = JSON.parse(expectedJsonStr);
                try {
                    assert.deepStrictEqual(actualDiffingResult, expectedFileDiffResult);
                }
                catch (e) {
                    // Backup expected file
                    (0, fs_1.writeFileSync)(invalidFilePath, expectedJsonStr);
                    // Update expected file
                    (0, fs_1.writeFileSync)(expectedFilePath, actualJsonStr);
                    throw e;
                }
            }
        }
        test(`test`, () => {
            runTest('shifting-twice', 'advanced');
        });
        for (const folder of folders) {
            for (const diffingAlgoName of ['legacy', 'advanced']) {
                test(`${folder}-${diffingAlgoName}`, () => {
                    runTest(folder, diffingAlgoName);
                });
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3Qvbm9kZS9kaWZmaW5nL2ZpeHR1cmVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLElBQUEsa0NBQXlCLEVBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUdILE1BQU0sY0FBYyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzNGLDhJQUE4STtRQUM5SSxrREFBa0Q7UUFDbEQsTUFBTSxjQUFjLEdBQUcsSUFBQSxjQUFPLEVBQUMsY0FBYyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNuSCxNQUFNLE9BQU8sR0FBRyxJQUFBLGdCQUFXLEVBQUMsY0FBYyxDQUFDLENBQUM7UUFFNUMsU0FBUyxPQUFPLENBQUMsTUFBYyxFQUFFLGVBQXNDO1lBQ3RFLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFBLGdCQUFXLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFFdEMsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENB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
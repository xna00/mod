/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/request/common/request", "vs/base/node/pfs", "vs/base/common/path", "assert", "vs/base/common/cancellation", "vs/platform/request/node/requestService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/log/common/log", "vs/base/test/common/mock", "vs/base/common/network", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/workbench.desktop.main"], function (require, exports, platform_1, colorRegistry_1, request_1, pfs, path, assert, cancellation_1, requestService_1, testConfigurationService_1, log_1, mock_1, network_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.experimental = void 0;
    exports.experimental = []; // 'settings.modifiedItemForeground', 'editorUnnecessary.foreground' ];
    const knwonVariablesFileName = 'vscode-known-variables.json';
    suite('Color Registry', function () {
        test(`update colors in ${knwonVariablesFileName}`, async function () {
            const varFilePath = network_1.FileAccess.asFileUri(`vs/../../build/lib/stylelint/${knwonVariablesFileName}`).fsPath;
            const content = (await pfs.Promises.readFile(varFilePath)).toString();
            const variablesInfo = JSON.parse(content);
            const colorsArray = variablesInfo.colors;
            assert.ok(colorsArray && colorsArray.length > 0, '${knwonVariablesFileName} contains no color descriptions');
            const colors = new Set(colorsArray);
            const updatedColors = [];
            const missing = [];
            const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
            for (const color of themingRegistry.getColors()) {
                const id = (0, colorRegistry_1.asCssVariableName)(color.id);
                if (!colors.has(id)) {
                    if (!color.deprecationMessage) {
                        missing.push(id);
                    }
                }
                else {
                    colors.delete(id);
                }
                updatedColors.push(id);
            }
            const superfluousKeys = [...colors.keys()];
            let errorText = '';
            if (missing.length > 0) {
                errorText += `\n\Adding the following colors:\n\n${JSON.stringify(missing, undefined, '\t')}\n`;
            }
            if (superfluousKeys.length > 0) {
                errorText += `\n\Removing the following colors:\n\n${superfluousKeys.join('\n')}\n`;
            }
            if (errorText.length > 0) {
                updatedColors.sort();
                variablesInfo.colors = updatedColors;
                await pfs.Promises.writeFile(varFilePath, JSON.stringify(variablesInfo, undefined, '\t'));
                assert.fail(`\n\Updating ${path.normalize(varFilePath)}.\nPlease verify and commit.\n\n${errorText}\n`);
            }
        });
        test('all colors listed in theme-color.md', async function () {
            // avoid importing the TestEnvironmentService as it brings in a duplicate registration of the file editor input factory.
            const environmentService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.args = { _: [] };
                }
            };
            const docUrl = 'https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md';
            const reqContext = await new requestService_1.RequestService(new testConfigurationService_1.TestConfigurationService(), environmentService, new log_1.NullLogService(), new workbenchTestServices_1.TestLoggerService()).request({ url: docUrl }, cancellation_1.CancellationToken.None);
            const content = (await (0, request_1.asTextOrError)(reqContext));
            const expression = /-\s*\`([\w\.]+)\`: (.*)/g;
            let m;
            const colorsInDoc = Object.create(null);
            let nColorsInDoc = 0;
            while (m = expression.exec(content)) {
                colorsInDoc[m[1]] = { description: m[2], offset: m.index, length: m.length };
                nColorsInDoc++;
            }
            assert.ok(nColorsInDoc > 0, 'theme-color.md contains to color descriptions');
            const missing = Object.create(null);
            const descriptionDiffs = Object.create(null);
            const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
            for (const color of themingRegistry.getColors()) {
                if (!colorsInDoc[color.id]) {
                    if (!color.deprecationMessage) {
                        missing[color.id] = getDescription(color);
                    }
                }
                else {
                    const docDescription = colorsInDoc[color.id].description;
                    const specDescription = getDescription(color);
                    if (docDescription !== specDescription) {
                        descriptionDiffs[color.id] = { docDescription, specDescription };
                    }
                    delete colorsInDoc[color.id];
                }
            }
            const colorsInExtensions = await getColorsFromExtension();
            for (const colorId in colorsInExtensions) {
                if (!colorsInDoc[colorId]) {
                    missing[colorId] = colorsInExtensions[colorId];
                }
                else {
                    delete colorsInDoc[colorId];
                }
            }
            for (const colorId of exports.experimental) {
                if (missing[colorId]) {
                    delete missing[colorId];
                }
                if (colorsInDoc[colorId]) {
                    assert.fail(`Color ${colorId} found in doc but marked experimental. Please remove from experimental list.`);
                }
            }
            const superfluousKeys = Object.keys(colorsInDoc);
            const undocumentedKeys = Object.keys(missing).map(k => `\`${k}\`: ${missing[k]}`);
            let errorText = '';
            if (undocumentedKeys.length > 0) {
                errorText += `\n\nAdd the following colors:\n\n${undocumentedKeys.join('\n')}\n`;
            }
            if (superfluousKeys.length > 0) {
                errorText += `\n\Remove the following colors:\n\n${superfluousKeys.join('\n')}\n`;
            }
            if (errorText.length > 0) {
                assert.fail(`\n\nOpen https://github.dev/microsoft/vscode-docs/blob/vnext/api/references/theme-color.md#50${errorText}`);
            }
        });
    });
    function getDescription(color) {
        let specDescription = color.description;
        if (color.deprecationMessage) {
            specDescription = specDescription + ' ' + color.deprecationMessage;
        }
        return specDescription;
    }
    async function getColorsFromExtension() {
        const extPath = network_1.FileAccess.asFileUri('vs/../../extensions').fsPath;
        const extFolders = await pfs.Promises.readDirsInDir(extPath);
        const result = Object.create(null);
        for (const folder of extFolders) {
            try {
                const packageJSON = JSON.parse((await pfs.Promises.readFile(path.join(extPath, folder, 'package.json'))).toString());
                const contributes = packageJSON['contributes'];
                if (contributes) {
                    const colors = contributes['colors'];
                    if (colors) {
                        for (const color of colors) {
                            const colorId = color['id'];
                            if (colorId) {
                                result[colorId] = colorId['description'];
                            }
                        }
                    }
                }
            }
            catch (e) {
                // ignore
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JSZWdpc3RyeS5yZWxlYXNlVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGhlbWVzL3Rlc3Qvbm9kZS9jb2xvclJlZ2lzdHJ5LnJlbGVhc2VUZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThCbkYsUUFBQSxZQUFZLEdBQWEsRUFBRSxDQUFDLENBQUMsdUVBQXVFO0lBR2pILE1BQU0sc0JBQXNCLEdBQUcsNkJBQTZCLENBQUM7SUFFN0QsS0FBSyxDQUFDLGdCQUFnQixFQUFFO1FBRXZCLElBQUksQ0FBQyxvQkFBb0Isc0JBQXNCLEVBQUUsRUFBRSxLQUFLO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzFHLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBRXRFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFMUMsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQWtCLENBQUM7WUFFckQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsMERBQTBELENBQUMsQ0FBQztZQUU3RyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVwQyxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDekIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ25CLE1BQU0sZUFBZSxHQUFHLG1CQUFRLENBQUMs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
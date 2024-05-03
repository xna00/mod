/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/platform"], function (require, exports, child_process_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveTerminalEncoding = resolveTerminalEncoding;
    const windowsTerminalEncodings = {
        '437': 'cp437', // United States
        '850': 'cp850', // Multilingual(Latin I)
        '852': 'cp852', // Slavic(Latin II)
        '855': 'cp855', // Cyrillic(Russian)
        '857': 'cp857', // Turkish
        '860': 'cp860', // Portuguese
        '861': 'cp861', // Icelandic
        '863': 'cp863', // Canadian - French
        '865': 'cp865', // Nordic
        '866': 'cp866', // Russian
        '869': 'cp869', // Modern Greek
        '936': 'cp936', // Simplified Chinese
        '1252': 'cp1252' // West European Latin
    };
    function toIconvLiteEncoding(encodingName) {
        const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
        return mapped || normalizedEncodingName;
    }
    const JSCHARDET_TO_ICONV_ENCODINGS = {
        'ibm866': 'cp866',
        'big5': 'cp950'
    };
    const UTF8 = 'utf8';
    async function resolveTerminalEncoding(verbose) {
        let rawEncodingPromise;
        // Support a global environment variable to win over other mechanics
        const cliEncodingEnv = process.env['VSCODE_CLI_ENCODING'];
        if (cliEncodingEnv) {
            if (verbose) {
                console.log(`Found VSCODE_CLI_ENCODING variable: ${cliEncodingEnv}`);
            }
            rawEncodingPromise = Promise.resolve(cliEncodingEnv);
        }
        // Windows: educated guess
        else if (platform_1.isWindows) {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "chcp" to detect terminal encoding...');
                }
                (0, child_process_1.exec)('chcp', (err, stdout, stderr) => {
                    if (stdout) {
                        if (verbose) {
                            console.log(`Output from "chcp" command is: ${stdout}`);
                        }
                        const windowsTerminalEncodingKeys = Object.keys(windowsTerminalEncodings);
                        for (const key of windowsTerminalEncodingKeys) {
                            if (stdout.indexOf(key) >= 0) {
                                return resolve(windowsTerminalEncodings[key]);
                            }
                        }
                    }
                    return resolve(undefined);
                });
            });
        }
        // Linux/Mac: use "locale charmap" command
        else {
            rawEncodingPromise = new Promise(resolve => {
                if (verbose) {
                    console.log('Running "locale charmap" to detect terminal encoding...');
                }
                (0, child_process_1.exec)('locale charmap', (err, stdout, stderr) => resolve(stdout));
            });
        }
        const rawEncoding = await rawEncodingPromise;
        if (verbose) {
            console.log(`Detected raw terminal encoding: ${rawEncoding}`);
        }
        if (!rawEncoding || rawEncoding.toLowerCase() === 'utf-8' || rawEncoding.toLowerCase() === UTF8) {
            return UTF8;
        }
        return toIconvLiteEncoding(rawEncoding);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbmNvZGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL3Rlcm1pbmFsRW5jb2RpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQ2hHLDBEQTJEQztJQXpGRCxNQUFNLHdCQUF3QixHQUFHO1FBQ2hDLEtBQUssRUFBRSxPQUFPLEVBQUUsZ0JBQWdCO1FBQ2hDLEtBQUssRUFBRSxPQUFPLEVBQUUsd0JBQXdCO1FBQ3hDLEtBQUssRUFBRSxPQUFPLEVBQUUsbUJBQW1CO1FBQ25DLEtBQUssRUFBRSxPQUFPLEVBQUUsb0JBQW9CO1FBQ3BDLEtBQUssRUFBRSxPQUFPLEVBQUUsVUFBVTtRQUMxQixLQUFLLEVBQUUsT0FBTyxFQUFFLGFBQWE7UUFDN0IsS0FBSyxFQUFFLE9BQU8sRUFBRSxZQUFZO1FBQzVCLEtBQUssRUFBRSxPQUFPLEVBQUUsb0JBQW9CO1FBQ3BDLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUztRQUN6QixLQUFLLEVBQUUsT0FBTyxFQUFFLFVBQVU7UUFDMUIsS0FBSyxFQUFFLE9BQU8sRUFBRSxlQUFlO1FBQy9CLEtBQUssRUFBRSxPQUFPLEVBQUUscUJBQXFCO1FBQ3JDLE1BQU0sRUFBRSxRQUFRLENBQUMsc0JBQXNCO0tBQ3ZDLENBQUM7SUFFRixTQUFTLG1CQUFtQixDQUFDLFlBQW9CO1FBQ2hELE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdkYsTUFBTSxNQUFNLEdBQUcsNEJBQTRCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVwRSxPQUFPLE1BQU0sSUFBSSxzQkFBc0IsQ0FBQztJQUN6QyxDQUFDO0lBRUQsTUFBTSw0QkFBNEIsR0FBK0I7UUFDaEUsUUFBUSxFQUFFLE9BQU87UUFDakIsTUFBTSxFQUFFLE9BQU87S0FDZixDQUFDO0lBRUYsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDO0lBRWIsS0FBSyxVQUFVLHVCQUF1QixDQUFDLE9BQWlCO1FBQzlELElBQUksa0JBQStDLENBQUM7UUFFcEQsb0VBQW9FO1FBQ3BFLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUMxRCxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBRUQsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsMEJBQTBCO2FBQ3JCLElBQUksb0JBQVMsRUFBRSxDQUFDO1lBQ3BCLGtCQUFrQixHQUFHLElBQUksT0FBTyxDQUFxQixPQUFPLENBQUMsRUFBRTtnQkFDOUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBRUQsSUFBQSxvQkFBSSxFQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3BDLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osSUFBSSxPQUFPLEVBQUUsQ0FBQzs0QkFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO3dCQUN6RCxDQUFDO3dCQUVELE1BQU0sMkJBQTJCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBaUQsQ0FBQzt3QkFDMUgsS0FBSyxNQUFNLEdBQUcsSUFBSSwyQkFBMkIsRUFBRSxDQUFDOzRCQUMvQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQzlCLE9BQU8sT0FBTyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7NEJBQy9DLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUVELE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMzQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELDBDQUEwQzthQUNyQyxDQUFDO1lBQ0wsa0JBQWtCLEdBQUcsSUFBSSxPQUFPLENBQVMsT0FBTyxDQUFDLEVBQUU7Z0JBQ2xELElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO2dCQUN4RSxDQUFDO2dCQUVELElBQUEsb0JBQUksRUFBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNsRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxNQUFNLGtCQUFrQixDQUFDO1FBQzdDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxPQUFPLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2pHLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekMsQ0FBQyJ9
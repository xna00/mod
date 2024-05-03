/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/network"], function (require, exports, assert, path, pfs_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertResolveKeyboardEvent = assertResolveKeyboardEvent;
    exports.assertResolveKeybinding = assertResolveKeybinding;
    exports.readRawMapping = readRawMapping;
    exports.assertMapping = assertMapping;
    function toIResolvedKeybinding(kb) {
        return {
            label: kb.getLabel(),
            ariaLabel: kb.getAriaLabel(),
            electronAccelerator: kb.getElectronAccelerator(),
            userSettingsLabel: kb.getUserSettingsLabel(),
            isWYSIWYG: kb.isWYSIWYG(),
            isMultiChord: kb.hasMultipleChords(),
            dispatchParts: kb.getDispatchChords(),
            singleModifierDispatchParts: kb.getSingleModifierDispatchChords()
        };
    }
    function assertResolveKeyboardEvent(mapper, keyboardEvent, expected) {
        const actual = toIResolvedKeybinding(mapper.resolveKeyboardEvent(keyboardEvent));
        assert.deepStrictEqual(actual, expected);
    }
    function assertResolveKeybinding(mapper, keybinding, expected) {
        const actual = mapper.resolveKeybinding(keybinding).map(toIResolvedKeybinding);
        assert.deepStrictEqual(actual, expected);
    }
    function readRawMapping(file) {
        return pfs_1.Promises.readFile(network_1.FileAccess.asFileUri(`vs/workbench/services/keybinding/test/node/${file}.js`).fsPath).then((buff) => {
            const contents = buff.toString();
            const func = new Function('define', contents); // CodeQL [SM01632] This is used in tests and we read the files as JS to avoid slowing down TS compilation
            let rawMappings = null;
            func(function (value) {
                rawMappings = value;
            });
            return rawMappings;
        });
    }
    function assertMapping(writeFileIfDifferent, mapper, file) {
        const filePath = path.normalize(network_1.FileAccess.asFileUri(`vs/workbench/services/keybinding/test/node/${file}`).fsPath);
        return pfs_1.Promises.readFile(filePath).then((buff) => {
            const expected = buff.toString().replace(/\r\n/g, '\n');
            const actual = mapper.dumpDebugInfo().replace(/\r\n/g, '\n');
            if (actual !== expected && writeFileIfDifferent) {
                const destPath = filePath.replace(/[\/\\]out[\/\\]vs[\/\\]workbench/, '/src/vs/workbench');
                pfs_1.Promises.writeFile(destPath, actual);
            }
            assert.deepStrictEqual(actual, expected);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRNYXBwZXJUZXN0VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL3Rlc3Qvbm9kZS9rZXlib2FyZE1hcHBlclRlc3RVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtDaEcsZ0VBR0M7SUFFRCwwREFHQztJQUVELHdDQVVDO0lBRUQsc0NBWUM7SUEvQ0QsU0FBUyxxQkFBcUIsQ0FBQyxFQUFzQjtRQUNwRCxPQUFPO1lBQ04sS0FBSyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUU7WUFDcEIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxZQUFZLEVBQUU7WUFDNUIsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLHNCQUFzQixFQUFFO1lBQ2hELGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM1QyxTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUN6QixZQUFZLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFO1lBQ3BDLGFBQWEsRUFBRSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7WUFDckMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLCtCQUErQixFQUFFO1NBQ2pFLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCLENBQUMsTUFBdUIsRUFBRSxhQUE2QixFQUFFLFFBQTZCO1FBQy9ILE1BQU0sTUFBTSxHQUFHLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxNQUF1QixFQUFFLFVBQXNCLEVBQUUsUUFBK0I7UUFDdkgsTUFBTSxNQUFNLEdBQTBCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN0RyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFJLElBQVk7UUFDN0MsT0FBTyxjQUFRLENBQUMsUUFBUSxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLDhDQUE4QyxJQUFJLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzVILE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQSwwR0FBMEc7WUFDeEosSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxVQUFVLEtBQVE7Z0JBQ3RCLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLFdBQVksQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFnQixhQUFhLENBQUMsb0JBQTZCLEVBQUUsTUFBdUIsRUFBRSxJQUFZO1FBQ2pHLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsOENBQThDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkgsT0FBTyxjQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdELElBQUksTUFBTSxLQUFLLFFBQVEsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQzNGLGNBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFDRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==
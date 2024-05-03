/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/test/browser/testCodeEditor"], function (require, exports, position_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deserializePipePositions = deserializePipePositions;
    exports.serializePipePositions = serializePipePositions;
    exports.testRepeatedActionAndExtractPositions = testRepeatedActionAndExtractPositions;
    function deserializePipePositions(text) {
        let resultText = '';
        let lineNumber = 1;
        let charIndex = 0;
        const positions = [];
        for (let i = 0, len = text.length; i < len; i++) {
            const chr = text.charAt(i);
            if (chr === '\n') {
                resultText += chr;
                lineNumber++;
                charIndex = 0;
                continue;
            }
            if (chr === '|') {
                positions.push(new position_1.Position(lineNumber, charIndex + 1));
            }
            else {
                resultText += chr;
                charIndex++;
            }
        }
        return [resultText, positions];
    }
    function serializePipePositions(text, positions) {
        positions.sort(position_1.Position.compare);
        let resultText = '';
        let lineNumber = 1;
        let charIndex = 0;
        for (let i = 0, len = text.length; i < len; i++) {
            const chr = text.charAt(i);
            if (positions.length > 0 && positions[0].lineNumber === lineNumber && positions[0].column === charIndex + 1) {
                resultText += '|';
                positions.shift();
            }
            resultText += chr;
            if (chr === '\n') {
                lineNumber++;
                charIndex = 0;
            }
            else {
                charIndex++;
            }
        }
        if (positions.length > 0 && positions[0].lineNumber === lineNumber && positions[0].column === charIndex + 1) {
            resultText += '|';
            positions.shift();
        }
        if (positions.length > 0) {
            throw new Error(`Unexpected left over positions!!!`);
        }
        return resultText;
    }
    function testRepeatedActionAndExtractPositions(text, initialPosition, action, record, stopCondition, options = {}) {
        const actualStops = [];
        (0, testCodeEditor_1.withTestCodeEditor)(text, options, (editor) => {
            editor.setPosition(initialPosition);
            while (true) {
                action(editor);
                actualStops.push(record(editor));
                if (stopCondition(editor)) {
                    break;
                }
                if (actualStops.length > 1000) {
                    throw new Error(`Endless loop detected involving position ${editor.getPosition()}!`);
                }
            }
        });
        return actualStops;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFRlc3RVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvd29yZE9wZXJhdGlvbnMvdGVzdC9icm93c2VyL3dvcmRUZXN0VXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsNERBcUJDO0lBRUQsd0RBMkJDO0lBRUQsc0ZBaUJDO0lBckVELFNBQWdCLHdCQUF3QixDQUFDLElBQVk7UUFDcEQsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxTQUFTLEdBQWUsRUFBRSxDQUFDO1FBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNsQixVQUFVLElBQUksR0FBRyxDQUFDO2dCQUNsQixVQUFVLEVBQUUsQ0FBQztnQkFDYixTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLFNBQVM7WUFDVixDQUFDO1lBQ0QsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLFVBQVUsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVSxJQUFJLEdBQUcsQ0FBQztnQkFDbEIsU0FBUyxFQUFFLENBQUM7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
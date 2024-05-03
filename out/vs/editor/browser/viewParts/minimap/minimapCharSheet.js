/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCharIndex = exports.allCharCodes = exports.Constants = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["START_CH_CODE"] = 32] = "START_CH_CODE";
        Constants[Constants["END_CH_CODE"] = 126] = "END_CH_CODE";
        Constants[Constants["UNKNOWN_CODE"] = 65533] = "UNKNOWN_CODE";
        Constants[Constants["CHAR_COUNT"] = 96] = "CHAR_COUNT";
        Constants[Constants["SAMPLED_CHAR_HEIGHT"] = 16] = "SAMPLED_CHAR_HEIGHT";
        Constants[Constants["SAMPLED_CHAR_WIDTH"] = 10] = "SAMPLED_CHAR_WIDTH";
        Constants[Constants["BASE_CHAR_HEIGHT"] = 2] = "BASE_CHAR_HEIGHT";
        Constants[Constants["BASE_CHAR_WIDTH"] = 1] = "BASE_CHAR_WIDTH";
        Constants[Constants["RGBA_CHANNELS_CNT"] = 4] = "RGBA_CHANNELS_CNT";
        Constants[Constants["RGBA_SAMPLED_ROW_WIDTH"] = 3840] = "RGBA_SAMPLED_ROW_WIDTH";
    })(Constants || (exports.Constants = Constants = {}));
    exports.allCharCodes = (() => {
        const v = [];
        for (let i = 32 /* Constants.START_CH_CODE */; i <= 126 /* Constants.END_CH_CODE */; i++) {
            v.push(i);
        }
        v.push(65533 /* Constants.UNKNOWN_CODE */);
        return v;
    })();
    const getCharIndex = (chCode, fontScale) => {
        chCode -= 32 /* Constants.START_CH_CODE */;
        if (chCode < 0 || chCode > 96 /* Constants.CHAR_COUNT */) {
            if (fontScale <= 2) {
                // for smaller scales, we can get away with using any ASCII character...
                return (chCode + 96 /* Constants.CHAR_COUNT */) % 96 /* Constants.CHAR_COUNT */;
            }
            return 96 /* Constants.CHAR_COUNT */ - 1; // unknown symbol
        }
        return chCode;
    };
    exports.getCharIndex = getCharIndex;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJTaGVldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL21pbmltYXAvbWluaW1hcENoYXJTaGVldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsSUFBa0IsU0FjakI7SUFkRCxXQUFrQixTQUFTO1FBQzFCLDREQUFrQixDQUFBO1FBQ2xCLHlEQUFpQixDQUFBO1FBQ2pCLDZEQUFvQixDQUFBO1FBQ3BCLHNEQUE0QyxDQUFBO1FBRTVDLHdFQUF3QixDQUFBO1FBQ3hCLHNFQUF1QixDQUFBO1FBRXZCLGlFQUFvQixDQUFBO1FBQ3BCLCtEQUFtQixDQUFBO1FBRW5CLG1FQUFxQixDQUFBO1FBQ3JCLGdGQUE0RSxDQUFBO0lBQzdFLENBQUMsRUFkaUIsU0FBUyx5QkFBVCxTQUFTLFFBYzFCO0lBRVksUUFBQSxZQUFZLEdBQTBCLENBQUMsR0FBRyxFQUFFO1FBQ3hELE1BQU0sQ0FBQyxHQUFhLEVBQUUsQ0FBQztRQUN2QixLQUFLLElBQUksQ0FBQyxtQ0FBMEIsRUFBRSxDQUFDLG1DQUF5QixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7UUFFRCxDQUFDLENBQUMsSUFBSSxvQ0FBd0IsQ0FBQztRQUMvQixPQUFPLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFRSxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQWMsRUFBRSxTQUFpQixFQUFFLEVBQUU7UUFDakUsTUFBTSxvQ0FBMkIsQ0FBQztRQUNsQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxnQ0FBdUIsRUFBRSxDQUFDO1lBQ2pELElBQUksU0FBUyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNwQix3RUFBd0U7Z0JBQ3hFLE9BQU8sQ0FBQyxNQUFNLGdDQUF1QixDQUFDLGdDQUF1QixDQUFDO1lBQy9ELENBQUM7WUFDRCxPQUFPLGdDQUF1QixDQUFDLENBQUMsQ0FBQyxpQkFBaUI7UUFDbkQsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyxDQUFDO0lBWFcsUUFBQSxZQUFZLGdCQVd2QiJ9
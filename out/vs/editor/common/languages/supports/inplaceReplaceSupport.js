/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicInplaceReplace = void 0;
    class BasicInplaceReplace {
        constructor() {
            this._defaultValueSet = [
                ['true', 'false'],
                ['True', 'False'],
                ['Private', 'Public', 'Friend', 'ReadOnly', 'Partial', 'Protected', 'WriteOnly'],
                ['public', 'protected', 'private'],
            ];
        }
        static { this.INSTANCE = new BasicInplaceReplace(); }
        navigateValueSet(range1, text1, range2, text2, up) {
            if (range1 && text1) {
                const result = this.doNavigateValueSet(text1, up);
                if (result) {
                    return {
                        range: range1,
                        value: result
                    };
                }
            }
            if (range2 && text2) {
                const result = this.doNavigateValueSet(text2, up);
                if (result) {
                    return {
                        range: range2,
                        value: result
                    };
                }
            }
            return null;
        }
        doNavigateValueSet(text, up) {
            const numberResult = this.numberReplace(text, up);
            if (numberResult !== null) {
                return numberResult;
            }
            return this.textReplace(text, up);
        }
        numberReplace(value, up) {
            const precision = Math.pow(10, value.length - (value.lastIndexOf('.') + 1));
            let n1 = Number(value);
            const n2 = parseFloat(value);
            if (!isNaN(n1) && !isNaN(n2) && n1 === n2) {
                if (n1 === 0 && !up) {
                    return null; // don't do negative
                    //			} else if(n1 === 9 && up) {
                    //				return null; // don't insert 10 into a number
                }
                else {
                    n1 = Math.floor(n1 * precision);
                    n1 += up ? precision : -precision;
                    return String(n1 / precision);
                }
            }
            return null;
        }
        textReplace(value, up) {
            return this.valueSetsReplace(this._defaultValueSet, value, up);
        }
        valueSetsReplace(valueSets, value, up) {
            let result = null;
            for (let i = 0, len = valueSets.length; result === null && i < len; i++) {
                result = this.valueSetReplace(valueSets[i], value, up);
            }
            return result;
        }
        valueSetReplace(valueSet, value, up) {
            let idx = valueSet.indexOf(value);
            if (idx >= 0) {
                idx += up ? +1 : -1;
                if (idx < 0) {
                    idx = valueSet.length - 1;
                }
                else {
                    idx %= valueSet.length;
                }
                return valueSet[idx];
            }
            return null;
        }
    }
    exports.BasicInplaceReplace = BasicInplaceReplace;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wbGFjZVJlcGxhY2VTdXBwb3J0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9zdXBwb3J0cy9pbnBsYWNlUmVwbGFjZVN1cHBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsbUJBQW1CO1FBQWhDO1lBMERrQixxQkFBZ0IsR0FBZTtnQkFDL0MsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDO2dCQUNqQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7Z0JBQ2pCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDO2dCQUNoRixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDO2FBQ2xDLENBQUM7UUEyQkgsQ0FBQztpQkF4RnVCLGFBQVEsR0FBRyxJQUFJLG1CQUFtQixFQUFFLEFBQTVCLENBQTZCO1FBRXJELGdCQUFnQixDQUFDLE1BQWMsRUFBRSxLQUFhLEVBQUUsTUFBYyxFQUFFLEtBQW9CLEVBQUUsRUFBVztZQUV2RyxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDWixPQUFPO3dCQUNOLEtBQUssRUFBRSxNQUFNO3dCQUNiLEtBQUssRUFBRSxNQUFNO3FCQUNiLENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUss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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/textMate/browser/arrayOperation"], function (require, exports, assert, utils_1, arrayOperation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('array operation', () => {
        function seq(start, end) {
            const result = [];
            for (let i = start; i < end; i++) {
                result.push(i);
            }
            return result;
        }
        test('simple', () => {
            const edit = new arrayOperation_1.ArrayEdit([
                new arrayOperation_1.SingleArrayEdit(4, 3, 2),
                new arrayOperation_1.SingleArrayEdit(8, 0, 2),
                new arrayOperation_1.SingleArrayEdit(9, 2, 0),
            ]);
            const arr = seq(0, 15).map(x => `item${x}`);
            const newArr = arr.slice();
            edit.applyToArray(newArr);
            assert.deepStrictEqual(newArr, [
                'item0',
                'item1',
                'item2',
                'item3',
                undefined,
                undefined,
                'item7',
                undefined,
                undefined,
                'item8',
                'item11',
                'item12',
                'item13',
                'item14',
            ]);
            const transformer = new arrayOperation_1.MonotonousIndexTransformer(edit);
            assert.deepStrictEqual(seq(0, 15).map((x) => {
                const t = transformer.transform(x);
                let r = `arr[${x}]: ${arr[x]} -> `;
                if (t !== undefined) {
                    r += `newArr[${t}]: ${newArr[t]}`;
                }
                else {
                    r += 'undefined';
                }
                return r;
            }), [
                'arr[0]: item0 -> newArr[0]: item0',
                'arr[1]: item1 -> newArr[1]: item1',
                'arr[2]: item2 -> newArr[2]: item2',
                'arr[3]: item3 -> newArr[3]: item3',
                'arr[4]: item4 -> undefined',
                'arr[5]: item5 -> undefined',
                'arr[6]: item6 -> undefined',
                'arr[7]: item7 -> newArr[6]: item7',
                'arr[8]: item8 -> newArr[9]: item8',
                'arr[9]: item9 -> undefined',
                'arr[10]: item10 -> undefined',
                'arr[11]: item11 -> newArr[10]: item11',
                'arr[12]: item12 -> newArr[11]: item12',
                'arr[13]: item13 -> newArr[12]: item13',
                'arr[14]: item14 -> newArr[13]: item14',
            ]);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPcGVyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL3Rlc3QvYnJvd3Nlci9hcnJheU9wZXJhdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsU0FBUyxHQUFHLENBQUMsS0FBYSxFQUFFLEdBQVc7WUFDdEMsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSwwQkFBUyxDQUFDO2dCQUMxQixJQUFJLGdDQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVCLElBQUksZ0NBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxnQ0FBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzVCLENBQUMsQ0FBQztZQUVILE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUUzQixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFO2dCQUM5QixPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxPQUFPO2dCQUNQLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxPQUFPO2dCQUNQLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixRQUFRO2dCQUNSLFFBQVE7YUFDUixDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJDQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxlQUFlLENBQ3JCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDckIsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsQ0FBQyxJQUFJLFdBQVcsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxFQUNGO2dCQUNDLG1DQUFtQztnQkFDbkMsbUNBQW1DO2dCQUNuQyxtQ0FBbUM7Z0JBQ25DLG1DQUFtQztnQkFDbkMsNEJBQTRCO2dCQUM1Qiw0QkFBNEI7Z0JBQzVCLDRCQUE0QjtnQkFDNUIsbUNBQW1DO2dCQUNuQyxtQ0FBbUM7Z0JBQ25DLDRCQUE0QjtnQkFDNUIsOEJBQThCO2dCQUM5Qix1Q0FBdUM7Z0JBQ3ZDLHVDQUF1QztnQkFDdkMsdUNBQXVDO2dCQUN2Qyx1Q0FBdUM7YUFDdkMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==
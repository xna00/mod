/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/gotoSymbol/browser/referencesModel"], function (require, exports, assert, uri_1, utils_1, position_1, range_1, referencesModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('references', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('nearestReference', () => {
            const model = new referencesModel_1.ReferencesModel([{
                    uri: uri_1.URI.file('/out/obj/can'),
                    range: new range_1.Range(1, 1, 1, 1)
                }, {
                    uri: uri_1.URI.file('/out/obj/can2'),
                    range: new range_1.Range(1, 1, 1, 1)
                }, {
                    uri: uri_1.URI.file('/src/can'),
                    range: new range_1.Range(1, 1, 1, 1)
                }], 'FOO');
            let ref = model.nearestReference(uri_1.URI.file('/src/can'), new position_1.Position(1, 1));
            assert.strictEqual(ref.uri.path, '/src/can');
            ref = model.nearestReference(uri_1.URI.file('/src/someOtherFileInSrc'), new position_1.Position(1, 1));
            assert.strictEqual(ref.uri.path, '/src/can');
            ref = model.nearestReference(uri_1.URI.file('/out/someOtherFile'), new position_1.Position(1, 1));
            assert.strictEqual(ref.uri.path, '/out/obj/can');
            ref = model.nearestReference(uri_1.URI.file('/out/obj/can2222'), new position_1.Position(1, 1));
            assert.strictEqual(ref.uri.path, '/out/obj/can2');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc01vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2dvdG9TeW1ib2wvdGVzdC9icm93c2VyL3JlZmVyZW5jZXNNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxZQUFZLEVBQUU7UUFFbkIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxpQ0FBZSxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFDN0IsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDNUIsRUFBRTtvQkFDRixHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7b0JBQzlCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQzVCLEVBQUU7b0JBQ0YsR0FBRyxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUN6QixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM1QixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFWCxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU5QyxHQUFHLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU5QyxHQUFHLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVsRCxHQUFHLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=
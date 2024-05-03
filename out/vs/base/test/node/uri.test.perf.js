/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, assert, fs_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI - perf', function () {
        let manyFileUris;
        setup(function () {
            manyFileUris = [];
            const data = (0, fs_1.readFileSync)(network_1.FileAccess.asFileUri('vs/base/test/node/uri.test.data.txt').fsPath).toString();
            const lines = data.split('\n');
            for (const line of lines) {
                manyFileUris.push(uri_1.URI.file(line));
            }
        });
        function perfTest(name, callback) {
            test(name, _done => {
                const t1 = Date.now();
                callback();
                const d = Date.now() - t1;
                console.log(`${name} took ${d}ms (${(d / manyFileUris.length).toPrecision(3)} ms/uri)`);
                _done();
            });
        }
        perfTest('toString', function () {
            for (const uri of manyFileUris) {
                const data = uri.toString();
                assert.ok(data);
            }
        });
        perfTest('toString(skipEncoding)', function () {
            for (const uri of manyFileUris) {
                const data = uri.toString(true);
                assert.ok(data);
            }
        });
        perfTest('fsPath', function () {
            for (const uri of manyFileUris) {
                const data = uri.fsPath;
                assert.ok(data);
            }
        });
        perfTest('toJSON', function () {
            for (const uri of manyFileUris) {
                const data = uri.toJSON();
                assert.ok(data);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpLnRlc3QucGVyZi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvdXJpLnRlc3QucGVyZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsWUFBWSxFQUFFO1FBRW5CLElBQUksWUFBbUIsQ0FBQztRQUN4QixLQUFLLENBQUM7WUFDTCxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxHQUFHLElBQUEsaUJBQVksRUFBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3pHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLFFBQWtCO1lBQ2pELElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ2xCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdEIsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hGLEtBQUssRUFBRSxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsUUFBUSxDQUFDLFVBQVUsRUFBRTtZQUNwQixLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLHdCQUF3QixFQUFFO1lBQ2xDLEtBQUssTUFBTSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUNsQixLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUN4QixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxRQUFRLEVBQUU7WUFDbEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/product/common/product", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/electron-sandbox/remoteAuthorityResolverService"], function (require, exports, assert, utils_1, product_1, remoteAuthorityResolver_1, remoteAuthorityResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RemoteAuthorityResolverService', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #147318: RemoteAuthorityResolverError keeps the same type', async () => {
            const productService = { _serviceBrand: undefined, ...product_1.default };
            const service = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(productService, undefined);
            const result = service.resolveAuthority('test+x');
            service._setResolvedAuthorityError('test+x', new remoteAuthorityResolver_1.RemoteAuthorityResolverError('something', remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable));
            try {
                await result;
                assert.fail();
            }
            catch (err) {
                assert.strictEqual(remoteAuthorityResolver_1.RemoteAuthorityResolverError.isTemporarilyNotAvailable(err), true);
            }
            service.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS90ZXN0L2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUU1QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGlFQUFpRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xGLE1BQU0sY0FBYyxHQUFvQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUM7WUFDakYsTUFBTSxPQUFPLEdBQUcsSUFBSSwrREFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBZ0IsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxPQUFPLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLElBQUksc0RBQTRCLENBQUMsV0FBVyxFQUFFLDBEQUFnQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUN0SixJQUFJLENBQUM7Z0JBQ0osTUFBTSxNQUFNLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxzREFBNEIsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RixDQUFDO1lBQ0QsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==
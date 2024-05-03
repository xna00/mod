/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/types", "vs/platform/registry/common/platform"], function (require, exports, assert, types_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Platform / Registry', () => {
        test('registry - api', function () {
            assert.ok((0, types_1.isFunction)(platform_1.Registry.add));
            assert.ok((0, types_1.isFunction)(platform_1.Registry.as));
            assert.ok((0, types_1.isFunction)(platform_1.Registry.knows));
        });
        test('registry - mixin', function () {
            platform_1.Registry.add('foo', { bar: true });
            assert.ok(platform_1.Registry.knows('foo'));
            assert.ok(platform_1.Registry.as('foo').bar);
            assert.strictEqual(platform_1.Registry.as('foo').bar, true);
        });
        test('registry - knows, as', function () {
            const ext = {};
            platform_1.Registry.add('knows,as', ext);
            assert.ok(platform_1.Registry.knows('knows,as'));
            assert.ok(!platform_1.Registry.knows('knows,as1234'));
            assert.ok(platform_1.Registry.as('knows,as') === ext);
            assert.ok(platform_1.Registry.as('knows,as1234') === null);
        });
        test('registry - mixin, fails on duplicate ids', function () {
            platform_1.Registry.add('foo-dup', { bar: true });
            try {
                platform_1.Registry.add('foo-dup', { bar: false });
                assert.ok(false);
            }
            catch (e) {
                assert.ok(true);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVnaXN0cnkvdGVzdC9jb21tb24vcGxhdGZvcm0udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBRWpDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUN0QixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsa0JBQVUsRUFBQyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLGtCQUFVLEVBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxrQkFBVSxFQUFDLG1CQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUV4QixtQkFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVuQyxNQUFNLENBQUMsRUFBRSxDQUFDLG1CQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBTSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLG1CQUFRLENBQUMsRUFBRSxDQUFNLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUU1QixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFFZixtQkFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRTtZQUVoRCxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUV2QyxJQUFJLENBQUM7Z0JBQ0osbUJBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/extensions/common/extensionQuery"], function (require, exports, assert, extensionQuery_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension query', () => {
        test('parse', () => {
            let query = extensionQuery_1.Query.parse('');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('hello');
            assert.strictEqual(query.value, 'hello');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('   hello world ');
            assert.strictEqual(query.value, 'hello world');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('@sort');
            assert.strictEqual(query.value, '@sort');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('@sort:');
            assert.strictEqual(query.value, '@sort:');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('  @sort:  ');
            assert.strictEqual(query.value, '@sort:');
            assert.strictEqual(query.sortBy, '');
            query = extensionQuery_1.Query.parse('@sort:installs');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('   @sort:installs   ');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('@sort:installs-');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('@sort:installs-foo');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('@sort:installs');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('@sort:installs');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('vs @sort:installs');
            assert.strictEqual(query.value, 'vs');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('vs @sort:installs code');
            assert.strictEqual(query.value, 'vs  code');
            assert.strictEqual(query.sortBy, 'installs');
            query = extensionQuery_1.Query.parse('@sort:installs @sort:ratings');
            assert.strictEqual(query.value, '');
            assert.strictEqual(query.sortBy, 'ratings');
        });
        test('toString', () => {
            let query = new extensionQuery_1.Query('hello', '');
            assert.strictEqual(query.toString(), 'hello');
            query = new extensionQuery_1.Query('hello world', '');
            assert.strictEqual(query.toString(), 'hello world');
            query = new extensionQuery_1.Query('  hello    ', '');
            assert.strictEqual(query.toString(), 'hello');
            query = new extensionQuery_1.Query('', 'installs');
            assert.strictEqual(query.toString(), '@sort:installs');
            query = new extensionQuery_1.Query('', 'installs');
            assert.strictEqual(query.toString(), '@sort:installs');
            query = new extensionQuery_1.Query('', 'installs');
            assert.strictEqual(query.toString(), '@sort:installs');
            query = new extensionQuery_1.Query('hello', 'installs');
            assert.strictEqual(query.toString(), 'hello @sort:installs');
            query = new extensionQuery_1.Query('  hello      ', 'installs');
            assert.strictEqual(query.toString(), 'hello @sort:installs');
        });
        test('isValid', () => {
            let query = new extensionQuery_1.Query('hello', '');
            assert(query.isValid());
            query = new extensionQuery_1.Query('hello world', '');
            assert(query.isValid());
            query = new extensionQuery_1.Query('  hello    ', '');
            assert(query.isValid());
            query = new extensionQuery_1.Query('', 'installs');
            assert(query.isValid());
            query = new extensionQuery_1.Query('', 'installs');
            assert(query.isValid());
            query = new extensionQuery_1.Query('', 'installs');
            assert(query.isValid());
            query = new extensionQuery_1.Query('', 'installs');
            assert(query.isValid());
            query = new extensionQuery_1.Query('hello', 'installs');
            assert(query.isValid());
            query = new extensionQuery_1.Query('  hello      ', 'installs');
            assert(query.isValid());
        });
        test('equals', () => {
            const query1 = new extensionQuery_1.Query('hello', '');
            let query2 = new extensionQuery_1.Query('hello', '');
            assert(query1.equals(query2));
            query2 = new extensionQuery_1.Query('hello world', '');
            assert(!query1.equals(query2));
            query2 = new extensionQuery_1.Query('hello', 'installs');
            assert(!query1.equals(query2));
            query2 = new extensionQuery_1.Query('hello', 'installs');
            assert(!query1.equals(query2));
        });
        test('autocomplete', () => {
            extensionQuery_1.Query.suggestions('@sort:in').some(x => x === '@sort:installs ');
            extensionQuery_1.Query.suggestions('@sort:installs').every(x => x !== '@sort:rating ');
            extensionQuery_1.Query.suggestions('@category:blah').some(x => x === '@category:"extension packs" ');
            extensionQuery_1.Query.suggestions('@category:"extension packs"').every(x => x !== '@category:formatters ');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUXVlcnkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy90ZXN0L2NvbW1vbi9leHRlbnNpb25RdWVyeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsSUFBSSxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVyQyxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXJDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFN0MsS0FBSyxHQUFHLHNCQUFLLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU3QyxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTdDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFN0MsS0FBSyxHQUFHLHNCQUFLLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU3QyxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTdDLEtBQUssR0FBRyxzQkFBSyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFN0MsS0FBSyxHQUFHLHNCQUFLLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU3QyxLQUFLLEdBQUcsc0JBQUssQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7WUFDckIsSUFBSSxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU5QyxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVwRCxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU5QyxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZELEtBQUssR0FBRyxJQUFJLHNCQUFLLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFdkQsS0FBSyxHQUFHLElBQUksc0JBQUssQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUV2RCxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1lBRTdELEtBQUssR0FBRyxJQUFJLHNCQUFLLENBQUMsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNwQixJQUFJLEtBQUssR0FBRyxJQUFJLHNCQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUV4QixLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFeEIsS0FBSyxHQUFHLElBQUksc0JBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXhCLEtBQUssR0FBRyxJQUFJLHNCQUFLLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUV4QixLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFeEIsS0FBSyxHQUFHLElBQUksc0JBQUssQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXhCLEtBQUssR0FBRyxJQUFJLHNCQUFLLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUV4QixLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFeEIsS0FBSyxHQUFHLElBQUksc0JBQUssQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFDbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLE1BQU0sR0FBRyxJQUFJLHNCQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFOUIsTUFBTSxHQUFHLElBQUksc0JBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBRS9CLE1BQU0sR0FBRyxJQUFJLHNCQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUUvQixNQUFNLEdBQUcsSUFBSSxzQkFBSyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixzQkFBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssaUJBQWlCLENBQUMsQ0FBQztZQUNqRSxzQkFBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxlQUFlLENBQUMsQ0FBQztZQUV0RSxzQkFBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3BGLHNCQUFLLENBQUMsV0FBVyxDQUFDLDZCQUE2QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLHVCQUF1QixDQUFDLENBQUM7UUFDNUYsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9
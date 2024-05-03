/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "sinon", "vs/workbench/contrib/notebook/browser/services/notebookRendererMessagingServiceImpl", "assert", "vs/base/common/async", "vs/base/test/common/utils"], function (require, exports, extensions_1, sinon_1, notebookRendererMessagingServiceImpl_1, assert, async_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookRendererMessaging', () => {
        let extService;
        let m;
        let sent = [];
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            sent = [];
            extService = new extensions_1.NullExtensionService();
            m = ds.add(new notebookRendererMessagingServiceImpl_1.NotebookRendererMessagingService(extService));
            ds.add(m.onShouldPostMessage(e => sent.push(e)));
        });
        test('activates on prepare', () => {
            const activate = (0, sinon_1.stub)(extService, 'activateByEvent').returns(Promise.resolve());
            m.prepare('foo');
            m.prepare('foo');
            m.prepare('foo');
            assert.deepStrictEqual(activate.args, [['onRenderer:foo']]);
        });
        test('buffers and then plays events', async () => {
            (0, sinon_1.stub)(extService, 'activateByEvent').returns(Promise.resolve());
            const scoped = m.getScoped('some-editor');
            scoped.postMessage('foo', 1);
            scoped.postMessage('foo', 2);
            assert.deepStrictEqual(sent, []);
            await (0, async_1.timeout)(0);
            const expected = [
                { editorId: 'some-editor', rendererId: 'foo', message: 1 },
                { editorId: 'some-editor', rendererId: 'foo', message: 2 }
            ];
            assert.deepStrictEqual(sent, expected);
            scoped.postMessage('foo', 3);
            assert.deepStrictEqual(sent, [
                ...expected,
                { editorId: 'some-editor', rendererId: 'foo', message: 3 }
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tSZW5kZXJlck1lc3NhZ2luZ1NlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rUmVuZGVyZXJNZXNzYWdpbmdTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxJQUFJLFVBQWdDLENBQUM7UUFDckMsSUFBSSxDQUFtQyxDQUFDO1FBQ3hDLElBQUksSUFBSSxHQUFjLEVBQUUsQ0FBQztRQUV6QixNQUFNLEVBQUUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFckQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLElBQUksR0FBRyxFQUFFLENBQUM7WUFDVixVQUFVLEdBQUcsSUFBSSxpQ0FBb0IsRUFBRSxDQUFDO1lBQ3hDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksdUVBQWdDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3RCxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFBLFlBQUksRUFBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDaEYsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQixDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxJQUFBLFlBQUksRUFBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFL0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVqQyxNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpCLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO2dCQUMxRCxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO2FBQzFELENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV2QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU3QixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRTtnQkFDNUIsR0FBRyxRQUFRO2dCQUNYLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7YUFDMUQsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9
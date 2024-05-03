/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/userActivity/browser/domActivityTracker", "vs/workbench/services/userActivity/common/userActivityService", "sinon", "assert"], function (require, exports, instantiationServiceMock_1, domActivityTracker_1, userActivityService_1, sinon, assert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DomActivityTracker', () => {
        let uas;
        let dom;
        let insta;
        let clock;
        const maxTimeToBecomeIdle = 3 * 30_000; // (MIN_INTERVALS_WITHOUT_ACTIVITY + 1) * CHECK_INTERVAL;
        setup(() => {
            clock = sinon.useFakeTimers();
            insta = new instantiationServiceMock_1.TestInstantiationService();
            uas = new userActivityService_1.UserActivityService(insta);
            dom = new domActivityTracker_1.DomActivityTracker(uas);
        });
        teardown(() => {
            dom.dispose();
            uas.dispose();
            clock.restore();
            insta.dispose();
        });
        test('marks inactive on no input', () => {
            assert.equal(uas.isActive, true);
            clock.tick(maxTimeToBecomeIdle);
            assert.equal(uas.isActive, false);
        });
        test('preserves activity state when active', () => {
            assert.equal(uas.isActive, true);
            const div = 10;
            for (let i = 0; i < div; i++) {
                document.dispatchEvent(new MouseEvent('keydown'));
                clock.tick(maxTimeToBecomeIdle / div);
            }
            assert.equal(uas.isActive, true);
        });
        test('restores active state', () => {
            assert.equal(uas.isActive, true);
            clock.tick(maxTimeToBecomeIdle);
            assert.equal(uas.isActive, false);
            document.dispatchEvent(new MouseEvent('keydown'));
            assert.equal(uas.isActive, true);
            clock.tick(maxTimeToBecomeIdle);
            assert.equal(uas.isActive, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tQWN0aXZpdHlUcmFja2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyQWN0aXZpdHkvdGVzdC9icm93c2VyL2RvbUFjdGl2aXR5VHJhY2tlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsSUFBSSxHQUF3QixDQUFDO1FBQzdCLElBQUksR0FBdUIsQ0FBQztRQUM1QixJQUFJLEtBQStCLENBQUM7UUFDcEMsSUFBSSxLQUE0QixDQUFDO1FBQ2pDLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLHlEQUF5RDtRQUVqRyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM5QixLQUFLLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ3ZDLEdBQUcsR0FBRyxJQUFJLHlDQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLEdBQUcsR0FBRyxJQUFJLHVDQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLEtBQUssQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqQyxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, utils_1, mockKeybindingService_1, testProfileService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TestProfileService', () => {
        let t;
        let ds;
        let idCounter = 0;
        teardown(() => {
            ds.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            idCounter = 0;
            ds = new lifecycle_1.DisposableStore();
            t = ds.add(new testProfileService_1.TestProfileService(new mockKeybindingService_1.MockContextKeyService(), ds.add(new workbenchTestServices_1.TestStorageService())));
        });
        const addProfile = (profile) => {
            const p = {
                controllerId: 'ctrlId',
                group: 2 /* TestRunProfileBitset.Run */,
                isDefault: true,
                label: 'profile',
                profileId: idCounter++,
                hasConfigurationHandler: false,
                tag: null,
                supportsContinuousRun: false,
                ...profile,
            };
            t.addProfile({ id: 'ctrlId' }, p);
            return p;
        };
        const assertGroupDefaults = (group, expected) => {
            assert.deepStrictEqual(t.getGroupDefaultProfiles(group).map(p => p.label), expected.map(e => e.label));
        };
        const expectProfiles = (expected, actual) => {
            const e = expected.map(e => e.label).sort();
            const a = actual.sort();
            assert.deepStrictEqual(e, a);
        };
        test('getGroupDefaultProfiles', () => {
            addProfile({ isDefault: true, group: 4 /* TestRunProfileBitset.Debug */, label: 'a' });
            addProfile({ isDefault: false, group: 4 /* TestRunProfileBitset.Debug */, label: 'b' });
            addProfile({ isDefault: true, group: 2 /* TestRunProfileBitset.Run */, label: 'c' });
            addProfile({ isDefault: true, group: 2 /* TestRunProfileBitset.Run */, label: 'd', controllerId: '2' });
            addProfile({ isDefault: false, group: 2 /* TestRunProfileBitset.Run */, label: 'e', controllerId: '2' });
            expectProfiles(t.getGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */), ['c', 'd']);
            expectProfiles(t.getGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */), ['a']);
        });
        suite('setGroupDefaultProfiles', () => {
            test('applies simple changes', () => {
                const p1 = addProfile({ isDefault: false, group: 4 /* TestRunProfileBitset.Debug */, label: 'a' });
                addProfile({ isDefault: false, group: 4 /* TestRunProfileBitset.Debug */, label: 'b' });
                const p3 = addProfile({ isDefault: false, group: 2 /* TestRunProfileBitset.Run */, label: 'c' });
                addProfile({ isDefault: false, group: 2 /* TestRunProfileBitset.Run */, label: 'd' });
                t.setGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */, [p3]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p3]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p1]);
            });
            test('syncs labels if same', () => {
                const p1 = addProfile({ isDefault: false, group: 4 /* TestRunProfileBitset.Debug */, label: 'a' });
                const p2 = addProfile({ isDefault: false, group: 4 /* TestRunProfileBitset.Debug */, label: 'b' });
                const p3 = addProfile({ isDefault: false, group: 2 /* TestRunProfileBitset.Run */, label: 'a' });
                const p4 = addProfile({ isDefault: false, group: 2 /* TestRunProfileBitset.Run */, label: 'b' });
                t.setGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */, [p3]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p3]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p1]);
                t.setGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */, [p2]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p4]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p2]);
            });
            test('does not mess up sync for multiple controllers', () => {
                // ctrl a and b both of have their own labels. ctrl c does not and should be unaffected
                const p1 = addProfile({ isDefault: false, controllerId: 'a', group: 4 /* TestRunProfileBitset.Debug */, label: 'a' });
                const p2 = addProfile({ isDefault: false, controllerId: 'b', group: 4 /* TestRunProfileBitset.Debug */, label: 'b1' });
                const p3 = addProfile({ isDefault: false, controllerId: 'b', group: 4 /* TestRunProfileBitset.Debug */, label: 'b2' });
                const p4 = addProfile({ isDefault: false, controllerId: 'c', group: 4 /* TestRunProfileBitset.Debug */, label: 'c1' });
                const p5 = addProfile({ isDefault: false, controllerId: 'a', group: 2 /* TestRunProfileBitset.Run */, label: 'a' });
                const p6 = addProfile({ isDefault: false, controllerId: 'b', group: 2 /* TestRunProfileBitset.Run */, label: 'b1' });
                const p7 = addProfile({ isDefault: false, controllerId: 'b', group: 2 /* TestRunProfileBitset.Run */, label: 'b2' });
                const p8 = addProfile({ isDefault: false, controllerId: 'b', group: 2 /* TestRunProfileBitset.Run */, label: 'b3' });
                // same profile on both
                t.setGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */, [p3]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p7]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p3]);
                // different profile, other should be unaffected
                t.setGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */, [p8]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p8]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p5]);
                // multiple changes in one go, with unmatched c
                t.setGroupDefaultProfiles(4 /* TestRunProfileBitset.Debug */, [p1, p2, p4]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p5, p6, p8]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p1, p2, p4]);
                // identity
                t.setGroupDefaultProfiles(2 /* TestRunProfileBitset.Run */, [p5, p6, p8]);
                assertGroupDefaults(2 /* TestRunProfileBitset.Run */, [p5, p6, p8]);
                assertGroupDefaults(4 /* TestRunProfileBitset.Debug */, [p1, p2, p4]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFByb2ZpbGVTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvdGVzdC9jb21tb24vdGVzdFByb2ZpbGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxJQUFJLENBQXFCLENBQUM7UUFDMUIsSUFBSSxFQUFtQixDQUFDO1FBQ3hCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVsQixRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDZCxFQUFFLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDM0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FDaEMsSUFBSSw2Q0FBcUIsRUFBRSxFQUMzQixFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUNoQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLENBQUMsT0FBaUMsRUFBRSxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxHQUFvQjtnQkFDMUIsWUFBWSxFQUFFLFFBQVE7Z0JBQ3RCLEtBQUssa0NBQTBCO2dCQUMvQixTQUFTLEVBQUUsSUFBSTtnQkFDZixLQUFLLEVBQUUsU0FBUztnQkFDaEIsU0FBUyxFQUFFLFNBQVMsRUFBRTtnQkFDdEIsdUJBQXVCLEVBQUUsS0FBSztnQkFDOUIsR0FBRyxFQUFFLElBQUk7Z0JBQ1QscUJBQXFCLEVBQUUsS0FBSztnQkFDNUIsR0FBRyxPQUFPO2FBQ1YsQ0FBQztZQUVGLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDLENBQUM7UUFFRixNQUFNLG1CQUFtQixHQUFHLENBQUMsS0FBMkIsRUFBRSxRQUEyQixFQUFFLEVBQUU7WUFDeEYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN4RyxDQUFDLENBQUM7UUFFRixNQUFNLGNBQWMsR0FBRyxDQUFDLFFBQTJCLEVBQUUsTUFBZ0IsRUFBRSxFQUFFO1lBQ3hFLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQztRQUVGLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLG9DQUE0QixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxvQ0FBNEIsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNoRixVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssa0NBQTBCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDN0UsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLGtDQUEwQixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDaEcsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLGtDQUEwQixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDakcsY0FBYyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsa0NBQTBCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRixjQUFjLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixvQ0FBNEIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7Z0JBQ25DLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxvQ0FBNEIsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDM0YsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLG9DQUE0QixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssa0NBQTBCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3pGLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxrQ0FBMEIsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFFOUUsQ0FBQyxDQUFDLHVCQUF1QixtQ0FBMkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxtQkFBbUIsbUNBQTJCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEQsbUJBQW1CLHFDQUE2QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO2dCQUNqQyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssb0NBQTRCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzNGLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxvQ0FBNEIsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLGtDQUEwQixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssa0NBQTBCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBRXpGLENBQUMsQ0FBQyx1QkFBdUIsbUNBQTJCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsbUJBQW1CLG1DQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELG1CQUFtQixxQ0FBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV0RCxDQUFDLENBQUMsdUJBQXVCLHFDQUE2QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELG1CQUFtQixtQ0FBMkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxtQkFBbUIscUNBQTZCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7Z0JBQzNELHVGQUF1RjtnQkFDdkYsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssb0NBQTRCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzlHLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxLQUFLLG9DQUE0QixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsS0FBSyxvQ0FBNEIsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDL0csTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssb0NBQTRCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRS9HLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxLQUFLLGtDQUEwQixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RyxNQUFNLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsS0FBSyxrQ0FBMEIsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDN0csTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssa0NBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzdHLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxLQUFLLGtDQUEwQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUU3Ryx1QkFBdUI7Z0JBQ3ZCLENBQUMsQ0FBQyx1QkFBdUIscUNBQTZCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsbUJBQW1CLG1DQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELG1CQUFtQixxQ0FBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV0RCxnREFBZ0Q7Z0JBQ2hELENBQUMsQ0FBQyx1QkFBdUIsbUNBQTJCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsbUJBQW1CLG1DQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELG1CQUFtQixxQ0FBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV0RCwrQ0FBK0M7Z0JBQy9DLENBQUMsQ0FBQyx1QkFBdUIscUNBQTZCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxtQkFBbUIsbUNBQTJCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxtQkFBbUIscUNBQTZCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUU5RCxXQUFXO2dCQUNYLENBQUMsQ0FBQyx1QkFBdUIsbUNBQTJCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxtQkFBbUIsbUNBQTJCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxtQkFBbUIscUNBQTZCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9
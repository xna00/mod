define(["require", "exports", "assert", "vs/platform/telemetry/browser/1dsAppender"], function (require, exports, assert, _1dsAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppInsightsCoreMock {
        constructor() {
            this.pluginVersionString = 'Test Runner';
            this.events = [];
            this.IsTrackingPageView = false;
            this.exceptions = [];
        }
        track(event) {
            this.events.push(event.baseData);
        }
        unload(isAsync, unloadComplete) {
            // No-op
        }
    }
    suite('AIAdapter', () => {
        let appInsightsMock;
        let adapter;
        const prefix = 'prefix';
        setup(() => {
            appInsightsMock = new AppInsightsCoreMock();
            adapter = new _1dsAppender_1.OneDataSystemWebAppender(false, prefix, undefined, () => appInsightsMock);
        });
        teardown(() => {
            adapter.flush();
        });
        test('Simple event', () => {
            adapter.log('testEvent');
            assert.strictEqual(appInsightsMock.events.length, 1);
            assert.strictEqual(appInsightsMock.events[0].name, `${prefix}/testEvent`);
        });
        test('addional data', () => {
            adapter = new _1dsAppender_1.OneDataSystemWebAppender(false, prefix, { first: '1st', second: 2, third: true }, () => appInsightsMock);
            adapter.log('testEvent');
            assert.strictEqual(appInsightsMock.events.length, 1);
            const [first] = appInsightsMock.events;
            assert.strictEqual(first.name, `${prefix}/testEvent`);
            assert.strictEqual(first.properties['first'], '1st');
            assert.strictEqual(first.measurements['second'], 2);
            assert.strictEqual(first.measurements['third'], 1);
        });
        test('property limits', () => {
            let reallyLongPropertyName = 'abcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < 6; i++) {
                reallyLongPropertyName += 'abcdefghijklmnopqrstuvwxyz';
            }
            assert(reallyLongPropertyName.length > 150);
            let reallyLongPropertyValue = 'abcdefghijklmnopqrstuvwxyz012345678901234567890123';
            for (let i = 0; i < 400; i++) {
                reallyLongPropertyValue += 'abcdefghijklmnopqrstuvwxyz012345678901234567890123';
            }
            assert(reallyLongPropertyValue.length > 8192);
            const data = Object.create(null);
            data[reallyLongPropertyName] = '1234';
            data['reallyLongPropertyValue'] = reallyLongPropertyValue;
            adapter.log('testEvent', data);
            assert.strictEqual(appInsightsMock.events.length, 1);
            for (const prop in appInsightsMock.events[0].properties) {
                assert(prop.length < 150);
                assert(appInsightsMock.events[0].properties[prop].length < 8192);
            }
        });
        test('Different data types', () => {
            const date = new Date();
            adapter.log('testEvent', { favoriteDate: date, likeRed: false, likeBlue: true, favoriteNumber: 1, favoriteColor: 'blue', favoriteCars: ['bmw', 'audi', 'ford'] });
            assert.strictEqual(appInsightsMock.events.length, 1);
            assert.strictEqual(appInsightsMock.events[0].name, `${prefix}/testEvent`);
            assert.strictEqual(appInsightsMock.events[0].properties['favoriteColor'], 'blue');
            assert.strictEqual(appInsightsMock.events[0].measurements['likeRed'], 0);
            assert.strictEqual(appInsightsMock.events[0].measurements['likeBlue'], 1);
            assert.strictEqual(appInsightsMock.events[0].properties['favoriteDate'], date.toISOString());
            assert.strictEqual(appInsightsMock.events[0].properties['favoriteCars'], JSON.stringify(['bmw', 'audi', 'ford']));
            assert.strictEqual(appInsightsMock.events[0].measurements['favoriteNumber'], 1);
        });
        test('Nested data', () => {
            adapter.log('testEvent', {
                window: {
                    title: 'some title',
                    measurements: {
                        width: 100,
                        height: 200
                    }
                },
                nestedObj: {
                    nestedObj2: {
                        nestedObj3: {
                            testProperty: 'test',
                        }
                    },
                    testMeasurement: 1
                }
            });
            assert.strictEqual(appInsightsMock.events.length, 1);
            assert.strictEqual(appInsightsMock.events[0].name, `${prefix}/testEvent`);
            assert.strictEqual(appInsightsMock.events[0].properties['window.title'], 'some title');
            assert.strictEqual(appInsightsMock.events[0].measurements['window.measurements.width'], 100);
            assert.strictEqual(appInsightsMock.events[0].measurements['window.measurements.height'], 200);
            assert.strictEqual(appInsightsMock.events[0].properties['nestedObj.nestedObj2.nestedObj3'], JSON.stringify({ 'testProperty': 'test' }));
            assert.strictEqual(appInsightsMock.events[0].measurements['nestedObj.testMeasurement'], 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMWRzQXBwZW5kZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L3Rlc3QvYnJvd3Nlci8xZHNBcHBlbmRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVNBLE1BQU0sbUJBQW1CO1FBQXpCO1lBQ0Msd0JBQW1CLEdBQVcsYUFBYSxDQUFDO1lBQ3JDLFdBQU0sR0FBVSxFQUFFLENBQUM7WUFDbkIsdUJBQWtCLEdBQVksS0FBSyxDQUFDO1lBQ3BDLGVBQVUsR0FBVSxFQUFFLENBQUM7UUFTL0IsQ0FBQztRQVBPLEtBQUssQ0FBQyxLQUFxQjtZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVNLE1BQU0sQ0FBQyxPQUFnQixFQUFFLGNBQTREO1lBQzNGLFFBQVE7UUFDVCxDQUFDO0tBQ0Q7SUFFRCxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN2QixJQUFJLGVBQW9DLENBQUM7UUFDekMsSUFBSSxPQUFpQyxDQUFDO1FBQ3RDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQztRQUd4QixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsZUFBZSxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUM1QyxPQUFPLEdBQUcsSUFBSSx1Q0FBd0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZ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LENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBYSxDQUFDLDJCQUEyQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQWEsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRS9GLE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFXLENBQUMsaUNBQWlDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6SSxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBYSxDQUFDLDJCQUEyQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0YsQ0FBQyxDQUFDLENBQUM7SUFFSixDQUFDLENBQUMsQ0FBQyJ9
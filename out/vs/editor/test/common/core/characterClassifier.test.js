define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/characterClassifier"], function (require, exports, assert, utils_1, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CharacterClassifier', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('works', () => {
            const classifier = new characterClassifier_1.CharacterClassifier(0);
            assert.strictEqual(classifier.get(-1), 0);
            assert.strictEqual(classifier.get(0), 0);
            assert.strictEqual(classifier.get(97 /* CharCode.a */), 0);
            assert.strictEqual(classifier.get(98 /* CharCode.b */), 0);
            assert.strictEqual(classifier.get(122 /* CharCode.z */), 0);
            assert.strictEqual(classifier.get(255), 0);
            assert.strictEqual(classifier.get(1000), 0);
            assert.strictEqual(classifier.get(2000), 0);
            classifier.set(97 /* CharCode.a */, 1);
            classifier.set(122 /* CharCode.z */, 2);
            classifier.set(1000, 3);
            assert.strictEqual(classifier.get(-1), 0);
            assert.strictEqual(classifier.get(0), 0);
            assert.strictEqual(classifier.get(97 /* CharCode.a */), 1);
            assert.strictEqual(classifier.get(98 /* CharCode.b */), 0);
            assert.strictEqual(classifier.get(122 /* CharCode.z */), 2);
            assert.strictEqual(classifier.get(255), 0);
            assert.strictEqual(classifier.get(1000), 3);
            assert.strictEqual(classifier.get(2000), 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyQ2xhc3NpZmllci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vY29yZS9jaGFyYWN0ZXJDbGFzc2lmaWVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUVqQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsTUFBTSxVQUFVLEdBQUcsSUFBSSx5Q0FBbUIsQ0FBUyxDQUFDLENBQUMsQ0FBQztZQUV0RCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxxQkFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcscUJBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLHNCQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUMsVUFBVSxDQUFDLEdBQUcsc0JBQWEsQ0FBQyxDQUFDLENBQUM7WUFDOUIsVUFBVSxDQUFDLEdBQUcsdUJBQWEsQ0FBQyxDQUFDLENBQUM7WUFDOUIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcscUJBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLHFCQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxzQkFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==
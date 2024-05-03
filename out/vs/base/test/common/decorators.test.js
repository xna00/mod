/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "assert", "sinon", "vs/base/common/decorators", "vs/base/test/common/utils"], function (require, exports, assert, sinon, decorators_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Decorators', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('memoize should memoize methods', () => {
            class Foo {
                constructor(_answer) {
                    this._answer = _answer;
                    this.count = 0;
                }
                answer() {
                    this.count++;
                    return this._answer;
                }
            }
            __decorate([
                decorators_1.memoize
            ], Foo.prototype, "answer", null);
            const foo = new Foo(42);
            assert.strictEqual(foo.count, 0);
            assert.strictEqual(foo.answer(), 42);
            assert.strictEqual(foo.count, 1);
            assert.strictEqual(foo.answer(), 42);
            assert.strictEqual(foo.count, 1);
            const foo2 = new Foo(1337);
            assert.strictEqual(foo2.count, 0);
            assert.strictEqual(foo2.answer(), 1337);
            assert.strictEqual(foo2.count, 1);
            assert.strictEqual(foo2.answer(), 1337);
            assert.strictEqual(foo2.count, 1);
            assert.strictEqual(foo.answer(), 42);
            assert.strictEqual(foo.count, 1);
            const foo3 = new Foo(null);
            assert.strictEqual(foo3.count, 0);
            assert.strictEqual(foo3.answer(), null);
            assert.strictEqual(foo3.count, 1);
            assert.strictEqual(foo3.answer(), null);
            assert.strictEqual(foo3.count, 1);
            const foo4 = new Foo(undefined);
            assert.strictEqual(foo4.count, 0);
            assert.strictEqual(foo4.answer(), undefined);
            assert.strictEqual(foo4.count, 1);
            assert.strictEqual(foo4.answer(), undefined);
            assert.strictEqual(foo4.count, 1);
        });
        test('memoize should memoize getters', () => {
            class Foo {
                constructor(_answer) {
                    this._answer = _answer;
                    this.count = 0;
                }
                get answer() {
                    this.count++;
                    return this._answer;
                }
            }
            __decorate([
                decorators_1.memoize
            ], Foo.prototype, "answer", null);
            const foo = new Foo(42);
            assert.strictEqual(foo.count, 0);
            assert.strictEqual(foo.answer, 42);
            assert.strictEqual(foo.count, 1);
            assert.strictEqual(foo.answer, 42);
            assert.strictEqual(foo.count, 1);
            const foo2 = new Foo(1337);
            assert.strictEqual(foo2.count, 0);
            assert.strictEqual(foo2.answer, 1337);
            assert.strictEqual(foo2.count, 1);
            assert.strictEqual(foo2.answer, 1337);
            assert.strictEqual(foo2.count, 1);
            assert.strictEqual(foo.answer, 42);
            assert.strictEqual(foo.count, 1);
            const foo3 = new Foo(null);
            assert.strictEqual(foo3.count, 0);
            assert.strictEqual(foo3.answer, null);
            assert.strictEqual(foo3.count, 1);
            assert.strictEqual(foo3.answer, null);
            assert.strictEqual(foo3.count, 1);
            const foo4 = new Foo(undefined);
            assert.strictEqual(foo4.count, 0);
            assert.strictEqual(foo4.answer, undefined);
            assert.strictEqual(foo4.count, 1);
            assert.strictEqual(foo4.answer, undefined);
            assert.strictEqual(foo4.count, 1);
        });
        test('memoized property should not be enumerable', () => {
            class Foo {
                get answer() {
                    return 42;
                }
            }
            __decorate([
                decorators_1.memoize
            ], Foo.prototype, "answer", null);
            const foo = new Foo();
            assert.strictEqual(foo.answer, 42);
            assert(!Object.keys(foo).some(k => /\$memoize\$/.test(k)));
        });
        test('memoized property should not be writable', () => {
            class Foo {
                get answer() {
                    return 42;
                }
            }
            __decorate([
                decorators_1.memoize
            ], Foo.prototype, "answer", null);
            const foo = new Foo();
            assert.strictEqual(foo.answer, 42);
            try {
                foo['$memoize$answer'] = 1337;
                assert(false);
            }
            catch (e) {
                assert.strictEqual(foo.answer, 42);
            }
        });
        test('throttle', () => {
            const spy = sinon.spy();
            const clock = sinon.useFakeTimers();
            try {
                class ThrottleTest {
                    constructor(fn) {
                        this._handle = fn;
                    }
                    report(p) {
                        this._handle(p);
                    }
                }
                __decorate([
                    (0, decorators_1.throttle)(100, (a, b) => a + b, () => 0)
                ], ThrottleTest.prototype, "report", null);
                const t = new ThrottleTest(spy);
                t.report(1);
                t.report(2);
                t.report(3);
                assert.deepStrictEqual(spy.args, [[1]]);
                clock.tick(200);
                assert.deepStrictEqual(spy.args, [[1], [5]]);
                spy.resetHistory();
                t.report(4);
                t.report(5);
                clock.tick(50);
                t.report(6);
                assert.deepStrictEqual(spy.args, [[4]]);
                clock.tick(60);
                assert.deepStrictEqual(spy.args, [[4], [11]]);
            }
            finally {
                clock.restore();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2RlY29yYXRvcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7OztJQU9oRyxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtRQUN4QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxNQUFNLEdBQUc7Z0JBR1IsWUFBb0IsT0FBa0M7b0JBQWxDLFlBQU8sR0FBUCxPQUFPLENBQTJCO29CQUZ0RCxVQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUVnRCxDQUFDO2dCQUczRCxNQUFNO29CQUNMLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ3JCLENBQUM7YUFDRDtZQUpBO2dCQURDLG9CQUFPOzZDQUlQO1lBR0YsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFakMs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TSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpDLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqQyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxDLE1BQU0sSUFB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
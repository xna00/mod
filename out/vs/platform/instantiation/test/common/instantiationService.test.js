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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, assert, event_1, lifecycle_1, utils_1, descriptors_1, instantiation_1, instantiationService_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const IService1 = (0, instantiation_1.createDecorator)('service1');
    class Service1 {
        constructor() {
            this.c = 1;
        }
    }
    const IService2 = (0, instantiation_1.createDecorator)('service2');
    class Service2 {
        constructor() {
            this.d = true;
        }
    }
    const IService3 = (0, instantiation_1.createDecorator)('service3');
    class Service3 {
        constructor() {
            this.s = 'farboo';
        }
    }
    const IDependentService = (0, instantiation_1.createDecorator)('dependentService');
    let DependentService = class DependentService {
        constructor(service) {
            this.name = 'farboo';
            assert.strictEqual(service.c, 1);
        }
    };
    DependentService = __decorate([
        __param(0, IService1)
    ], DependentService);
    let Service1Consumer = class Service1Consumer {
        constructor(service1) {
            assert.ok(service1);
            assert.strictEqual(service1.c, 1);
        }
    };
    Service1Consumer = __decorate([
        __param(0, IService1)
    ], Service1Consumer);
    let Target2Dep = class Target2Dep {
        constructor(service1, service2) {
            assert.ok(service1 instanceof Service1);
            assert.ok(service2 instanceof Service2);
        }
    };
    Target2Dep = __decorate([
        __param(0, IService1),
        __param(1, IService2)
    ], Target2Dep);
    let TargetWithStaticParam = class TargetWithStaticParam {
        constructor(v, service1) {
            assert.ok(v);
            assert.ok(service1);
            assert.strictEqual(service1.c, 1);
        }
    };
    TargetWithStaticParam = __decorate([
        __param(1, IService1)
    ], TargetWithStaticParam);
    let DependentServiceTarget = class DependentServiceTarget {
        constructor(d) {
            assert.ok(d);
            assert.strictEqual(d.name, 'farboo');
        }
    };
    DependentServiceTarget = __decorate([
        __param(0, IDependentService)
    ], DependentServiceTarget);
    let DependentServiceTarget2 = class DependentServiceTarget2 {
        constructor(d, s) {
            assert.ok(d);
            assert.strictEqual(d.name, 'farboo');
            assert.ok(s);
            assert.strictEqual(s.c, 1);
        }
    };
    DependentServiceTarget2 = __decorate([
        __param(0, IDependentService),
        __param(1, IService1)
    ], DependentServiceTarget2);
    let ServiceLoop1 = class ServiceLoop1 {
        constructor(s) {
            this.c = 1;
        }
    };
    ServiceLoop1 = __decorate([
        __param(0, IService2)
    ], ServiceLoop1);
    let ServiceLoop2 = class ServiceLoop2 {
        constructor(s) {
            this.d = true;
        }
    };
    ServiceLoop2 = __decorate([
        __param(0, IService1)
    ], ServiceLoop2);
    suite('Instantiation Service', () => {
        test('service collection, cannot overwrite', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            let result = collection.set(IService1, null);
            assert.strictEqual(result, undefined);
            result = collection.set(IService1, new Service1());
            assert.strictEqual(result, null);
        });
        test('service collection, add/has', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, null);
            assert.ok(collection.has(IService1));
            collection.set(IService2, null);
            assert.ok(collection.has(IService1));
            assert.ok(collection.has(IService2));
        });
        test('@Param - simple clase', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(Service1Consumer);
        });
        test('@Param - fixed args', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            collection.set(IService3, new Service3());
            service.createInstance(TargetWithStaticParam, true);
        });
        test('service collection is live', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(IService1, new Service1());
            const service = new instantiationService_1.InstantiationService(collection);
            service.createInstance(Service1Consumer);
            collection.set(IService2, new Service2());
            service.createInstance(Target2Dep);
            service.invokeFunction(function (a) {
                assert.ok(a.get(IService1));
                assert.ok(a.get(IService2));
            });
        });
        // we made this a warning
        // test('@Param - too many args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2, true, 2));
        // });
        // test('@Param - too few args', function () {
        // 	let service = instantiationService.create(Object.create(null));
        // 	service.addSingleton(IService1, new Service1());
        // 	service.addSingleton(IService2, new Service2());
        // 	service.addSingleton(IService3, new Service3());
        // 	assert.throws(() => service.createInstance(ParameterTarget2));
        // });
        test('SyncDesc - no dependencies', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            service.invokeFunction(accessor => {
                const service1 = accessor.get(IService1);
                assert.ok(service1);
                assert.strictEqual(service1.c, 1);
                const service2 = accessor.get(IService1);
                assert.ok(service1 === service2);
            });
        });
        test('SyncDesc - service with service dependency', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            service.invokeFunction(accessor => {
                const d = accessor.get(IDependentService);
                assert.ok(d);
                assert.strictEqual(d.name, 'farboo');
            });
        });
        test('SyncDesc - target depends on service future', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(Service1));
            collection.set(IDependentService, new descriptors_1.SyncDescriptor(DependentService));
            const d = service.createInstance(DependentServiceTarget);
            assert.ok(d instanceof DependentServiceTarget);
            const d2 = service.createInstance(DependentServiceTarget2);
            assert.ok(d2 instanceof DependentServiceTarget2);
        });
        test('SyncDesc - explode on loop', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new descriptors_1.SyncDescriptor(ServiceLoop1));
            collection.set(IService2, new descriptors_1.SyncDescriptor(ServiceLoop2));
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            });
            assert.throws(() => {
                service.invokeFunction(accessor => {
                    accessor.get(IService2);
                });
            });
            try {
                service.invokeFunction(accessor => {
                    accessor.get(IService1);
                });
            }
            catch (err) {
                assert.ok(err.name);
                assert.ok(err.message);
            }
        });
        test('Invoke - get services', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.strictEqual(accessor.get(IService1).c, 1);
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
        });
        test('Invoke - get service, optional', function () {
            const collection = new serviceCollection_1.ServiceCollection([IService1, new Service1()]);
            const service = new instantiationService_1.InstantiationService(collection);
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.throws(() => accessor.get(IService2));
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
        });
        test('Invoke - keeping accessor NOT allowed', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            let cached;
            function test(accessor) {
                assert.ok(accessor.get(IService1) instanceof Service1);
                assert.strictEqual(accessor.get(IService1).c, 1);
                cached = accessor;
                return true;
            }
            assert.strictEqual(service.invokeFunction(test), true);
            assert.throws(() => cached.get(IService2));
        });
        test('Invoke - throw error', function () {
            const collection = new serviceCollection_1.ServiceCollection();
            const service = new instantiationService_1.InstantiationService(collection);
            collection.set(IService1, new Service1());
            collection.set(IService2, new Service2());
            function test(accessor) {
                throw new Error();
            }
            assert.throws(() => service.invokeFunction(test));
        });
        test('Create child', function () {
            let serviceInstanceCount = 0;
            const CtorCounter = class {
                constructor() {
                    this.c = 1;
                    serviceInstanceCount += 1;
                }
            };
            // creating the service instance BEFORE the child service
            let service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            service.createInstance(Service1Consumer);
            // second instance must be earlier ONE
            let child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            child.createInstance(Service1Consumer);
            assert.strictEqual(serviceInstanceCount, 1);
            // creating the service instance AFTER the child service
            serviceInstanceCount = 0;
            service = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([IService1, new descriptors_1.SyncDescriptor(CtorCounter)]));
            child = service.createChild(new serviceCollection_1.ServiceCollection([IService2, new Service2()]));
            // second instance must be earlier ONE
            service.createInstance(Service1Consumer);
            child.createInstance(Service1Consumer);
            assert.strictEqual(serviceInstanceCount, 1);
        });
        test('Remote window / integration tests is broken #105562', function () {
            const Service1 = (0, instantiation_1.createDecorator)('service1');
            let Service1Impl = class Service1Impl {
                constructor(insta) {
                    const c = insta.invokeFunction(accessor => accessor.get(Service2)); // THIS is the recursive call
                    assert.ok(c);
                }
            };
            Service1Impl = __decorate([
                __param(0, instantiation_1.IInstantiationService)
            ], Service1Impl);
            const Service2 = (0, instantiation_1.createDecorator)('service2');
            class Service2Impl {
                constructor() { }
            }
            // This service depends on Service1 and Service2 BUT creating Service1 creates Service2 (via recursive invocation)
            // and then Servce2 should not be created a second time
            const Service21 = (0, instantiation_1.createDecorator)('service21');
            let Service21Impl = class Service21Impl {
                constructor(service2, service1) {
                    this.service2 = service2;
                    this.service1 = service1;
                }
            };
            Service21Impl = __decorate([
                __param(0, Service2),
                __param(1, Service1)
            ], Service21Impl);
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([Service1, new descriptors_1.SyncDescriptor(Service1Impl)], [Service2, new descriptors_1.SyncDescriptor(Service2Impl)], [Service21, new descriptors_1.SyncDescriptor(Service21Impl)]));
            const obj = insta.invokeFunction(accessor => accessor.get(Service21));
            assert.ok(obj);
        });
        test('Sync/Async dependency loop', async function () {
            const A = (0, instantiation_1.createDecorator)('A');
            const B = (0, instantiation_1.createDecorator)('B');
            let BConsumer = class BConsumer {
                constructor(b) {
                    this.b = b;
                }
                doIt() {
                    return this.b.b();
                }
            };
            BConsumer = __decorate([
                __param(0, B)
            ], BConsumer);
            let AService = class AService {
                constructor(insta) {
                    this.prop = insta.createInstance(BConsumer);
                }
                doIt() {
                    return this.prop.doIt();
                }
            };
            AService = __decorate([
                __param(0, instantiation_1.IInstantiationService)
            ], AService);
            let BService = class BService {
                constructor(a) {
                    assert.ok(a);
                }
                b() { return true; }
            };
            BService = __decorate([
                __param(0, A)
            ], BService);
            // SYNC -> explodes AImpl -> [insta:BConsumer] -> BImpl -> AImpl
            {
                const insta1 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AService)], [B, new descriptors_1.SyncDescriptor(BService)]), true, undefined, true);
                try {
                    insta1.invokeFunction(accessor => accessor.get(A));
                    assert.ok(false);
                }
                catch (error) {
                    assert.ok(error instanceof Error);
                    assert.ok(error.message.includes('RECURSIVELY'));
                }
            }
            // ASYNC -> doesn't explode but cycle is tracked
            {
                const insta2 = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AService, undefined, true)], [B, new descriptors_1.SyncDescriptor(BService, undefined)]), true, undefined, true);
                const a = insta2.invokeFunction(accessor => accessor.get(A));
                a.doIt();
                const cycle = insta2._globalGraph?.findCycleSlow();
                assert.strictEqual(cycle, 'A -> B -> A');
            }
        });
        test('Delayed and events', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const d1 = c.a.onDidDoIt(listener);
            const d2 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            assert.strictEqual(eventCount, 0);
            d2.dispose();
            // instantiation happens on first call
            c.a.doIt();
            assert.strictEqual(created, true);
            assert.strictEqual(eventCount, 1);
            const d3 = c.a.onDidDoIt(listener);
            c.a.doIt();
            assert.strictEqual(eventCount, 3);
            (0, lifecycle_1.dispose)([d1, d3]);
        });
        test('Capture event before init, use after init', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
                noop() {
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const event = c.a.onDidDoIt;
            // const d1 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            c.a.noop();
            assert.strictEqual(created, true);
            const d1 = event(listener);
            c.a.doIt();
            // instantiation happens on first call
            assert.strictEqual(eventCount, 1);
            (0, lifecycle_1.dispose)(d1);
        });
        test('Dispose early event listener', function () {
            const A = (0, instantiation_1.createDecorator)('A');
            let created = false;
            class AImpl {
                constructor() {
                    this._doIt = 0;
                    this._onDidDoIt = new event_1.Emitter();
                    this.onDidDoIt = this._onDidDoIt.event;
                    created = true;
                }
                doIt() {
                    this._doIt += 1;
                    this._onDidDoIt.fire(this);
                }
            }
            const insta = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([A, new descriptors_1.SyncDescriptor(AImpl, undefined, true)]), true, undefined, true);
            let Consumer = class Consumer {
                constructor(a) {
                    this.a = a;
                    // eager subscribe -> NO service instance
                }
            };
            Consumer = __decorate([
                __param(0, A)
            ], Consumer);
            const c = insta.createInstance(Consumer);
            let eventCount = 0;
            // subscribing to event doesn't trigger instantiation
            const listener = (e) => {
                assert.ok(e instanceof AImpl);
                eventCount++;
            };
            const d1 = c.a.onDidDoIt(listener);
            assert.strictEqual(created, false);
            assert.strictEqual(eventCount, 0);
            c.a.doIt();
            // instantiation happens on first call
            assert.strictEqual(created, true);
            assert.strictEqual(eventCount, 1);
            (0, lifecycle_1.dispose)(d1);
            c.a.doIt();
            assert.strictEqual(eventCount, 1);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvblNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vaW5zdGFudGlhdGlvbi90ZXN0L2NvbW1vbi9pbnN0YW50aWF0aW9uU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBV2hHLE1BQU0sU0FBUyxHQUFHLElBQUEsK0JBQWUsRUFBWSxVQUFVLENBQUMsQ0FBQztJQU96RCxNQUFNLFFBQVE7UUFBZDtZQUVDLE1BQUMsR0FBRyxDQUFDLENBQUM7UUFDUCxDQUFDO0tBQUE7SUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLCtCQUFlLEVBQVksVUFBVSxDQUFDLENBQUM7SUFPekQsTUFBTSxRQUFRO1FBQWQ7WUFFQyxNQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ1YsQ0FBQztLQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSwrQkFBZSxFQUFZLFVBQVUsQ0FBQyxDQUFDO0lBT3pELE1BQU0sUUFBUTtRQUFkO1lBRUMsTUFBQyxHQUFHLFFBQVEsQ0FBQztRQUNkLENBQUM7S0FBQTtJQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixrQkFBa0IsQ0FBQyxDQUFDO0lBT2pGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBRXJCLFlBQXVCLE9BQWtCO1lBSXpDLFNBQUksR0FBRyxRQUFRLENBQUM7WUFIZixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUdELENBQUE7SUFQSyxnQkFBZ0I7UUFFUixXQUFBLFNBQVMsQ0FBQTtPQUZqQixnQkFBZ0IsQ0FPckI7SUFFRCxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQUVyQixZ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
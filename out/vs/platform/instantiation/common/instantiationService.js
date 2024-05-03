/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/graph", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/base/common/linkedList"], function (require, exports, async_1, errors_1, lifecycle_1, descriptors_1, graph_1, instantiation_1, serviceCollection_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Trace = exports.InstantiationService = void 0;
    // TRACING
    const _enableAllTracing = false;
    class CyclicDependencyError extends Error {
        constructor(graph) {
            super('cyclic dependency between services');
            this.message = graph.findCycleSlow() ?? `UNABLE to detect cycle, dumping graph: \n${graph.toString()}`;
        }
    }
    class InstantiationService {
        constructor(_services = new serviceCollection_1.ServiceCollection(), _strict = false, _parent, _enableTracing = _enableAllTracing) {
            this._services = _services;
            this._strict = _strict;
            this._parent = _parent;
            this._enableTracing = _enableTracing;
            this._activeInstantiations = new Set();
            this._services.set(instantiation_1.IInstantiationService, this);
            this._globalGraph = _enableTracing ? _parent?._globalGraph ?? new graph_1.Graph(e => e) : undefined;
        }
        createChild(services) {
            return new InstantiationService(services, this._strict, this, this._enableTracing);
        }
        invokeFunction(fn, ...args) {
            const _trace = Trace.traceInvocation(this._enableTracing, fn);
            let _done = false;
            try {
                const accessor = {
                    get: (id) => {
                        if (_done) {
                            throw (0, errors_1.illegalState)('service accessor is only valid during the invocation of its target method');
                        }
                        const result = this._getOrCreateServiceInstance(id, _trace);
                        if (!result) {
                            throw new Error(`[invokeFunction] unknown service '${id}'`);
                        }
                        return result;
                    }
                };
                return fn(accessor, ...args);
            }
            finally {
                _done = true;
                _trace.stop();
            }
        }
        createInstance(ctorOrDescriptor, ...rest) {
            let _trace;
            let result;
            if (ctorOrDescriptor instanceof descriptors_1.SyncDescriptor) {
                _trace = Trace.traceCreation(this._enableTracing, ctorOrDescriptor.ctor);
                result = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.staticArguments.concat(rest), _trace);
            }
            else {
                _trace = Trace.traceCreation(this._enableTracing, ctorOrDescriptor);
                result = this._createInstance(ctorOrDescriptor, rest, _trace);
            }
            _trace.stop();
            return result;
        }
        _createInstance(ctor, args = [], _trace) {
            // arguments defined by service decorators
            const serviceDependencies = instantiation_1._util.getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
            const serviceArgs = [];
            for (const dependency of serviceDependencies) {
                const service = this._getOrCreateServiceInstance(dependency.id, _trace);
                if (!service) {
                    this._throwIfStrict(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`, false);
                }
                serviceArgs.push(service);
            }
            const firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;
            // check for argument mismatches, adjust static args if needed
            if (args.length !== firstServiceArgPos) {
                console.trace(`[createInstance] First service dependency of ${ctor.name} at position ${firstServiceArgPos + 1} conflicts with ${args.length} static arguments`);
                const delta = firstServiceArgPos - args.length;
                if (delta > 0) {
                    args = args.concat(new Array(delta));
                }
                else {
                    args = args.slice(0, firstServiceArgPos);
                }
            }
            // now create the instance
            return Reflect.construct(ctor, args.concat(serviceArgs));
        }
        _setServiceInstance(id, instance) {
            if (this._services.get(id) instanceof descriptors_1.SyncDescriptor) {
                this._services.set(id, instance);
            }
            else if (this._parent) {
                this._parent._setServiceInstance(id, instance);
            }
            else {
                throw new Error('illegalState - setting UNKNOWN service instance');
            }
        }
        _getServiceInstanceOrDescriptor(id) {
            const instanceOrDesc = this._services.get(id);
            if (!instanceOrDesc && this._parent) {
                return this._parent._getServiceInstanceOrDescriptor(id);
            }
            else {
                return instanceOrDesc;
            }
        }
        _getOrCreateServiceInstance(id, _trace) {
            if (this._globalGraph && this._globalGraphImplicitDependency) {
                this._globalGraph.insertEdge(this._globalGraphImplicitDependency, String(id));
            }
            const thing = this._getServiceInstanceOrDescriptor(id);
            if (thing instanceof descriptors_1.SyncDescriptor) {
                return this._safeCreateAndCacheServiceInstance(id, thing, _trace.branch(id, true));
            }
            else {
                _trace.branch(id, false);
                return thing;
            }
        }
        _safeCreateAndCacheServiceInstance(id, desc, _trace) {
            if (this._activeInstantiations.has(id)) {
                throw new Error(`illegal state - RECURSIVELY instantiating service '${id}'`);
            }
            this._activeInstantiations.add(id);
            try {
                return this._createAndCacheServiceInstance(id, desc, _trace);
            }
            finally {
                this._activeInstantiations.delete(id);
            }
        }
        _createAndCacheServiceInstance(id, desc, _trace) {
            const graph = new graph_1.Graph(data => data.id.toString());
            let cycleCount = 0;
            const stack = [{ id, desc, _trace }];
            while (stack.length) {
                const item = stack.pop();
                graph.lookupOrInsertNode(item);
                // a weak but working heuristic for cycle checks
                if (cycleCount++ > 1000) {
                    throw new CyclicDependencyError(graph);
                }
                // check all dependencies for existence and if they need to be created first
                for (const dependency of instantiation_1._util.getServiceDependencies(item.desc.ctor)) {
                    const instanceOrDesc = this._getServiceInstanceOrDescriptor(dependency.id);
                    if (!instanceOrDesc) {
                        this._throwIfStrict(`[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`, true);
                    }
                    // take note of all service dependencies
                    this._globalGraph?.insertEdge(String(item.id), String(dependency.id));
                    if (instanceOrDesc instanceof descriptors_1.SyncDescriptor) {
                        const d = { id: dependency.id, desc: instanceOrDesc, _trace: item._trace.branch(dependency.id, true) };
                        graph.insertEdge(item, d);
                        stack.push(d);
                    }
                }
            }
            while (true) {
                const roots = graph.roots();
                // if there is no more roots but still
                // nodes in the graph we have a cycle
                if (roots.length === 0) {
                    if (!graph.isEmpty()) {
                        throw new CyclicDependencyError(graph);
                    }
                    break;
                }
                for (const { data } of roots) {
                    // Repeat the check for this still being a service sync descriptor. That's because
                    // instantiating a dependency might have side-effect and recursively trigger instantiation
                    // so that some dependencies are now fullfilled already.
                    const instanceOrDesc = this._getServiceInstanceOrDescriptor(data.id);
                    if (instanceOrDesc instanceof descriptors_1.SyncDescriptor) {
                        // create instance and overwrite the service collections
                        const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation, data._trace);
                        this._setServiceInstance(data.id, instance);
                    }
                    graph.removeNode(data);
                }
            }
            return this._getServiceInstanceOrDescriptor(id);
        }
        _createServiceInstanceWithOwner(id, ctor, args = [], supportsDelayedInstantiation, _trace) {
            if (this._services.get(id) instanceof descriptors_1.SyncDescriptor) {
                return this._createServiceInstance(id, ctor, args, supportsDelayedInstantiation, _trace);
            }
            else if (this._parent) {
                return this._parent._createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation, _trace);
            }
            else {
                throw new Error(`illegalState - creating UNKNOWN service instance ${ctor.name}`);
            }
        }
        _createServiceInstance(id, ctor, args = [], supportsDelayedInstantiation, _trace) {
            if (!supportsDelayedInstantiation) {
                // eager instantiation
                return this._createInstance(ctor, args, _trace);
            }
            else {
                const child = new InstantiationService(undefined, this._strict, this, this._enableTracing);
                child._globalGraphImplicitDependency = String(id);
                // Return a proxy object that's backed by an idle value. That
                // strategy is to instantiate services in our idle time or when actually
                // needed but not when injected into a consumer
                // return "empty events" when the service isn't instantiated yet
                const earlyListeners = new Map();
                const idle = new async_1.GlobalIdleValue(() => {
                    const result = child._createInstance(ctor, args, _trace);
                    // early listeners that we kept are now being subscribed to
                    // the real service
                    for (const [key, values] of earlyListeners) {
                        const candidate = result[key];
                        if (typeof candidate === 'function') {
                            for (const value of values) {
                                value.disposable = candidate.apply(result, value.listener);
                            }
                        }
                    }
                    earlyListeners.clear();
                    return result;
                });
                return new Proxy(Object.create(null), {
                    get(target, key) {
                        if (!idle.isInitialized) {
                            // looks like an event
                            if (typeof key === 'string' && (key.startsWith('onDid') || key.startsWith('onWill'))) {
                                let list = earlyListeners.get(key);
                                if (!list) {
                                    list = new linkedList_1.LinkedList();
                                    earlyListeners.set(key, list);
                                }
                                const event = (callback, thisArg, disposables) => {
                                    if (idle.isInitialized) {
                                        return idle.value[key](callback, thisArg, disposables);
                                    }
                                    else {
                                        const entry = { listener: [callback, thisArg, disposables], disposable: undefined };
                                        const rm = list.push(entry);
                                        const result = (0, lifecycle_1.toDisposable)(() => {
                                            rm();
                                            entry.disposable?.dispose();
                                        });
                                        return result;
                                    }
                                };
                                return event;
                            }
                        }
                        // value already exists
                        if (key in target) {
                            return target[key];
                        }
                        // create value
                        const obj = idle.value;
                        let prop = obj[key];
                        if (typeof prop !== 'function') {
                            return prop;
                        }
                        prop = prop.bind(obj);
                        target[key] = prop;
                        return prop;
                    },
                    set(_target, p, value) {
                        idle.value[p] = value;
                        return true;
                    },
                    getPrototypeOf(_target) {
                        return ctor.prototype;
                    }
                });
            }
        }
        _throwIfStrict(msg, printWarning) {
            if (printWarning) {
                console.warn(msg);
            }
            if (this._strict) {
                throw new Error(msg);
            }
        }
    }
    exports.InstantiationService = InstantiationService;
    //#region -- tracing ---
    var TraceType;
    (function (TraceType) {
        TraceType[TraceType["None"] = 0] = "None";
        TraceType[TraceType["Creation"] = 1] = "Creation";
        TraceType[TraceType["Invocation"] = 2] = "Invocation";
        TraceType[TraceType["Branch"] = 3] = "Branch";
    })(TraceType || (TraceType = {}));
    class Trace {
        static { this.all = new Set(); }
        static { this._None = new class extends Trace {
            constructor() { super(0 /* TraceType.None */, null); }
            stop() { }
            branch() { return this; }
        }; }
        static traceInvocation(_enableTracing, ctor) {
            return !_enableTracing ? Trace._None : new Trace(2 /* TraceType.Invocation */, ctor.name || new Error().stack.split('\n').slice(3, 4).join('\n'));
        }
        static traceCreation(_enableTracing, ctor) {
            return !_enableTracing ? Trace._None : new Trace(1 /* TraceType.Creation */, ctor.name);
        }
        static { this._totals = 0; }
        constructor(type, name) {
            this.type = type;
            this.name = name;
            this._start = Date.now();
            this._dep = [];
        }
        branch(id, first) {
            const child = new Trace(3 /* TraceType.Branch */, id.toString());
            this._dep.push([id, first, child]);
            return child;
        }
        stop() {
            const dur = Date.now() - this._start;
            Trace._totals += dur;
            let causedCreation = false;
            function printChild(n, trace) {
                const res = [];
                const prefix = new Array(n + 1).join('\t');
                for (const [id, first, child] of trace._dep) {
                    if (first && child) {
                        causedCreation = true;
                        res.push(`${prefix}CREATES -> ${id}`);
                        const nested = printChild(n + 1, child);
                        if (nested) {
                            res.push(nested);
                        }
                    }
                    else {
                        res.push(`${prefix}uses -> ${id}`);
                    }
                }
                return res.join('\n');
            }
            const lines = [
                `${this.type === 1 /* TraceType.Creation */ ? 'CREATE' : 'CALL'} ${this.name}`,
                `${printChild(1, this)}`,
                `DONE, took ${dur.toFixed(2)}ms (grand total ${Trace._totals.toFixed(2)}ms)`
            ];
            if (dur > 2 || causedCreation) {
                Trace.all.add(lines.join('\n'));
            }
        }
    }
    exports.Trace = Trace;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2luc3RhbnRpYXRpb24vY29tbW9uL2luc3RhbnRpYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxVQUFVO0lBQ1YsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBRTdCO0lBRUYsTUFBTSxxQkFBc0IsU0FBUSxLQUFLO1FBQ3hDLFlBQVksS0FBaUI7WUFDNUIsS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLElBQUksNENBQTRDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQ3hHLENBQUM7S0FDRDtJQUVELE1BQWEsb0JBQW9CO1FBT2hDLFlBQ2tCLFlBQStCLElBQUkscUNBQWlCLEVBQUUsRUFDdEQsVUFBbUIsS0FBSyxFQUN4QixPQUE4QixFQUM5QixpQkFBMEIsaUJBQWlCO1lBSDNDLGNBQVMsR0FBVCxTQUFTLENBQTZDO1lBQ3RELFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQ3hCLFlBQU8sR0FBUCxPQUFPLENBQXVCO1lBQzlCLG1CQUFjLEdBQWQsY0FBYyxDQUE2QjtZQW1INUMsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFoSDFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFDQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxJQUFJLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMs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
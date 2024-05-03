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
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, iterator_1, lifecycle_1, objects_1, ternarySearchTree_1, uri_1, nls_1, commands_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextKeyService = exports.AbstractContextKeyService = exports.Context = void 0;
    exports.setContext = setContext;
    const KEYBINDING_CONTEXT_ATTR = 'data-keybinding-context';
    class Context {
        constructor(id, parent) {
            this._id = id;
            this._parent = parent;
            this._value = Object.create(null);
            this._value['_contextId'] = id;
        }
        get value() {
            return { ...this._value };
        }
        setValue(key, value) {
            // console.log('SET ' + key + ' = ' + value + ' ON ' + this._id);
            if (this._value[key] !== value) {
                this._value[key] = value;
                return true;
            }
            return false;
        }
        removeValue(key) {
            // console.log('REMOVE ' + key + ' FROM ' + this._id);
            if (key in this._value) {
                delete this._value[key];
                return true;
            }
            return false;
        }
        getValue(key) {
            const ret = this._value[key];
            if (typeof ret === 'undefined' && this._parent) {
                return this._parent.getValue(key);
            }
            return ret;
        }
        updateParent(parent) {
            this._parent = parent;
        }
        collectAllValues() {
            let result = this._parent ? this._parent.collectAllValues() : Object.create(null);
            result = { ...result, ...this._value };
            delete result['_contextId'];
            return result;
        }
    }
    exports.Context = Context;
    class NullContext extends Context {
        static { this.INSTANCE = new NullContext(); }
        constructor() {
            super(-1, null);
        }
        setValue(key, value) {
            return false;
        }
        removeValue(key) {
            return false;
        }
        getValue(key) {
            return undefined;
        }
        collectAllValues() {
            return Object.create(null);
        }
    }
    class ConfigAwareContextValuesContainer extends Context {
        static { this._keyPrefix = 'config.'; }
        constructor(id, _configurationService, emitter) {
            super(id, null);
            this._configurationService = _configurationService;
            this._values = ternarySearchTree_1.TernarySearchTree.forConfigKeys();
            this._listener = this._configurationService.onDidChangeConfiguration(event => {
                if (event.source === 7 /* ConfigurationTarget.DEFAULT */) {
                    // new setting, reset everything
                    const allKeys = Array.from(this._values, ([k]) => k);
                    this._values.clear();
                    emitter.fire(new ArrayContextKeyChangeEvent(allKeys));
                }
                else {
                    const changedKeys = [];
                    for (const configKey of event.affectedKeys) {
                        const contextKey = `config.${configKey}`;
                        const cachedItems = this._values.findSuperstr(contextKey);
                        if (cachedItems !== undefined) {
                            changedKeys.push(...iterator_1.Iterable.map(cachedItems, ([key]) => key));
                            this._values.deleteSuperstr(contextKey);
                        }
                        if (this._values.has(contextKey)) {
                            changedKeys.push(contextKey);
                            this._values.delete(contextKey);
                        }
                    }
                    emitter.fire(new ArrayContextKeyChangeEvent(changedKeys));
                }
            });
        }
        dispose() {
            this._listener.dispose();
        }
        getValue(key) {
            if (key.indexOf(ConfigAwareContextValuesContainer._keyPrefix) !== 0) {
                return super.getValue(key);
            }
            if (this._values.has(key)) {
                return this._values.get(key);
            }
            const configKey = key.substr(ConfigAwareContextValuesContainer._keyPrefix.length);
            const configValue = this._configurationService.getValue(configKey);
            let value = undefined;
            switch (typeof configValue) {
                case 'number':
                case 'boolean':
                case 'string':
                    value = configValue;
                    break;
                default:
                    if (Array.isArray(configValue)) {
                        value = JSON.stringify(configValue);
                    }
                    else {
                        value = configValue;
                    }
            }
            this._values.set(key, value);
            return value;
        }
        setValue(key, value) {
            return super.setValue(key, value);
        }
        removeValue(key) {
            return super.removeValue(key);
        }
        collectAllValues() {
            const result = Object.create(null);
            this._values.forEach((value, index) => result[index] = value);
            return { ...result, ...super.collectAllValues() };
        }
    }
    class ContextKey {
        constructor(service, key, defaultValue) {
            this._service = service;
            this._key = key;
            this._defaultValue = defaultValue;
            this.reset();
        }
        set(value) {
            this._service.setContext(this._key, value);
        }
        reset() {
            if (typeof this._defaultValue === 'undefined') {
                this._service.removeContext(this._key);
            }
            else {
                this._service.setContext(this._key, this._defaultValue);
            }
        }
        get() {
            return this._service.getContextKeyValue(this._key);
        }
    }
    class SimpleContextKeyChangeEvent {
        constructor(key) {
            this.key = key;
        }
        affectsSome(keys) {
            return keys.has(this.key);
        }
        allKeysContainedIn(keys) {
            return this.affectsSome(keys);
        }
    }
    class ArrayContextKeyChangeEvent {
        constructor(keys) {
            this.keys = keys;
        }
        affectsSome(keys) {
            for (const key of this.keys) {
                if (keys.has(key)) {
                    return true;
                }
            }
            return false;
        }
        allKeysContainedIn(keys) {
            return this.keys.every(key => keys.has(key));
        }
    }
    class CompositeContextKeyChangeEvent {
        constructor(events) {
            this.events = events;
        }
        affectsSome(keys) {
            for (const e of this.events) {
                if (e.affectsSome(keys)) {
                    return true;
                }
            }
            return false;
        }
        allKeysContainedIn(keys) {
            return this.events.every(evt => evt.allKeysContainedIn(keys));
        }
    }
    function allEventKeysInContext(event, context) {
        return event.allKeysContainedIn(new Set(Object.keys(context)));
    }
    class AbstractContextKeyService extends lifecycle_1.Disposable {
        constructor(myContextId) {
            super();
            this._onDidChangeContext = this._register(new event_1.PauseableEmitter({ merge: input => new CompositeContextKeyChangeEvent(input) }));
            this.onDidChangeContext = this._onDidChangeContext.event;
            this._isDisposed = false;
            this._myContextId = myContextId;
        }
        get contextId() {
            return this._myContextId;
        }
        createKey(key, defaultValue) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ContextKey(this, key, defaultValue);
        }
        bufferChangeEvents(callback) {
            this._onDidChangeContext.pause();
            try {
                callback();
            }
            finally {
                this._onDidChangeContext.resume();
            }
        }
        createScoped(domNode) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new ScopedContextKeyService(this, domNode);
        }
        createOverlay(overlay = iterator_1.Iterable.empty()) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            return new OverlayContextKeyService(this, overlay);
        }
        contextMatchesRules(rules) {
            if (this._isDisposed) {
                throw new Error(`AbstractContextKeyService has been disposed`);
            }
            const context = this.getContextValuesContainer(this._myContextId);
            const result = (rules ? rules.evaluate(context) : true);
            // console.group(rules.serialize() + ' -> ' + result);
            // rules.keys().forEach(key => { console.log(key, ctx[key]); });
            // console.groupEnd();
            return result;
        }
        getContextKeyValue(key) {
            if (this._isDisposed) {
                return undefined;
            }
            return this.getContextValuesContainer(this._myContextId).getValue(key);
        }
        setContext(key, value) {
            if (this._isDisposed) {
                return;
            }
            const myContext = this.getContextValuesContainer(this._myContextId);
            if (!myContext) {
                return;
            }
            if (myContext.setValue(key, value)) {
                this._onDidChangeContext.fire(new SimpleContextKeyChangeEvent(key));
            }
        }
        removeContext(key) {
            if (this._isDisposed) {
                return;
            }
            if (this.getContextValuesContainer(this._myContextId).removeValue(key)) {
                this._onDidChangeContext.fire(new SimpleContextKeyChangeEvent(key));
            }
        }
        getContext(target) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this.getContextValuesContainer(findContextAttr(target));
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
    }
    exports.AbstractContextKeyService = AbstractContextKeyService;
    let ContextKeyService = class ContextKeyService extends AbstractContextKeyService {
        constructor(configurationService) {
            super(0);
            this._contexts = new Map();
            this._lastContextId = 0;
            const myContext = this._register(new ConfigAwareContextValuesContainer(this._myContextId, configurationService, this._onDidChangeContext));
            this._contexts.set(this._myContextId, myContext);
            // Uncomment this to see the contexts continuously logged
            // let lastLoggedValue: string | null = null;
            // setInterval(() => {
            // 	let values = Object.keys(this._contexts).map((key) => this._contexts[key]);
            // 	let logValue = values.map(v => JSON.stringify(v._value, null, '\t')).join('\n');
            // 	if (lastLoggedValue !== logValue) {
            // 		lastLoggedValue = logValue;
            // 		console.log(lastLoggedValue);
            // 	}
            // }, 2000);
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._contexts.get(contextId) || NullContext.INSTANCE;
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ContextKeyService has been disposed`);
            }
            const id = (++this._lastContextId);
            this._contexts.set(id, new Context(id, this.getContextValuesContainer(parentContextId)));
            return id;
        }
        disposeContext(contextId) {
            if (!this._isDisposed) {
                this._contexts.delete(contextId);
            }
        }
        updateParent(_parentContextKeyService) {
            throw new Error('Cannot update parent of root ContextKeyService');
        }
    };
    exports.ContextKeyService = ContextKeyService;
    exports.ContextKeyService = ContextKeyService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ContextKeyService);
    class ScopedContextKeyService extends AbstractContextKeyService {
        constructor(parent, domNode) {
            super(parent.createChildContext());
            this._parentChangeListener = this._register(new lifecycle_1.MutableDisposable());
            this._parent = parent;
            this._updateParentChangeListener();
            this._domNode = domNode;
            if (this._domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
                let extraInfo = '';
                if (this._domNode.classList) {
                    extraInfo = Array.from(this._domNode.classList.values()).join(', ');
                }
                console.error(`Element already has context attribute${extraInfo ? ': ' + extraInfo : ''}`);
            }
            this._domNode.setAttribute(KEYBINDING_CONTEXT_ATTR, String(this._myContextId));
        }
        _updateParentChangeListener() {
            // Forward parent events to this listener. Parent will change.
            this._parentChangeListener.value = this._parent.onDidChangeContext(e => {
                const thisContainer = this._parent.getContextValuesContainer(this._myContextId);
                const thisContextValues = thisContainer.value;
                if (!allEventKeysInContext(e, thisContextValues)) {
                    this._onDidChangeContext.fire(e);
                }
            });
        }
        dispose() {
            if (this._isDisposed) {
                return;
            }
            this._parent.disposeContext(this._myContextId);
            this._domNode.removeAttribute(KEYBINDING_CONTEXT_ATTR);
            super.dispose();
        }
        getContextValuesContainer(contextId) {
            if (this._isDisposed) {
                return NullContext.INSTANCE;
            }
            return this._parent.getContextValuesContainer(contextId);
        }
        createChildContext(parentContextId = this._myContextId) {
            if (this._isDisposed) {
                throw new Error(`ScopedContextKeyService has been disposed`);
            }
            return this._parent.createChildContext(parentContextId);
        }
        disposeContext(contextId) {
            if (this._isDisposed) {
                return;
            }
            this._parent.disposeContext(contextId);
        }
        updateParent(parentContextKeyService) {
            if (this._parent === parentContextKeyService) {
                return;
            }
            const thisContainer = this._parent.getContextValuesContainer(this._myContextId);
            const oldAllValues = thisContainer.collectAllValues();
            this._parent = parentContextKeyService;
            this._updateParentChangeListener();
            const newParentContainer = this._parent.getContextValuesContainer(this._parent.contextId);
            thisContainer.updateParent(newParentContainer);
            const newAllValues = thisContainer.collectAllValues();
            const allValuesDiff = {
                ...(0, objects_1.distinct)(oldAllValues, newAllValues),
                ...(0, objects_1.distinct)(newAllValues, oldAllValues)
            };
            const changedKeys = Object.keys(allValuesDiff);
            this._onDidChangeContext.fire(new ArrayContextKeyChangeEvent(changedKeys));
        }
    }
    class OverlayContext {
        constructor(parent, overlay) {
            this.parent = parent;
            this.overlay = overlay;
        }
        getValue(key) {
            return this.overlay.has(key) ? this.overlay.get(key) : this.parent.getValue(key);
        }
    }
    class OverlayContextKeyService {
        get contextId() {
            return this.parent.contextId;
        }
        get onDidChangeContext() {
            return this.parent.onDidChangeContext;
        }
        constructor(parent, overlay) {
            this.parent = parent;
            this.overlay = new Map(overlay);
        }
        bufferChangeEvents(callback) {
            this.parent.bufferChangeEvents(callback);
        }
        createKey() {
            throw new Error('Not supported.');
        }
        getContext(target) {
            return new OverlayContext(this.parent.getContext(target), this.overlay);
        }
        getContextValuesContainer(contextId) {
            const parentContext = this.parent.getContextValuesContainer(contextId);
            return new OverlayContext(parentContext, this.overlay);
        }
        contextMatchesRules(rules) {
            const context = this.getContextValuesContainer(this.contextId);
            const result = (rules ? rules.evaluate(context) : true);
            return result;
        }
        getContextKeyValue(key) {
            return this.overlay.has(key) ? this.overlay.get(key) : this.parent.getContextKeyValue(key);
        }
        createScoped() {
            throw new Error('Not supported.');
        }
        createOverlay(overlay = iterator_1.Iterable.empty()) {
            return new OverlayContextKeyService(this, overlay);
        }
        updateParent() {
            throw new Error('Not supported.');
        }
    }
    function findContextAttr(domNode) {
        while (domNode) {
            if (domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
                const attr = domNode.getAttribute(KEYBINDING_CONTEXT_ATTR);
                if (attr) {
                    return parseInt(attr, 10);
                }
                return NaN;
            }
            domNode = domNode.parentElement;
        }
        return 0;
    }
    function setContext(accessor, contextKey, contextValue) {
        const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
        contextKeyService.createKey(String(contextKey), stringifyURIs(contextValue));
    }
    function stringifyURIs(contextValue) {
        return (0, objects_1.cloneAndChange)(contextValue, (obj) => {
            if (typeof obj === 'object' && obj.$mid === 1 /* MarshalledId.Uri */) {
                return uri_1.URI.revive(obj).toString();
            }
            if (obj instanceof uri_1.URI) {
                return obj.toString();
            }
            return undefined;
        });
    }
    commands_1.CommandsRegistry.registerCommand('_setContext', setContext);
    commands_1.CommandsRegistry.registerCommand({
        id: 'getContextKeyInfo',
        handler() {
            return [...contextkey_1.RawContextKey.all()].sort((a, b) => a.key.localeCompare(b.key));
        },
        metadata: {
            description: (0, nls_1.localize)('getContextKeyInfo', "A command that returns information about context keys"),
            args: []
        }
    });
    commands_1.CommandsRegistry.registerCommand('_generateContextKeyInfo', function () {
        const result = [];
        const seen = new Set();
        for (const info of contextkey_1.RawContextKey.all()) {
            if (!seen.has(info.key)) {
                seen.add(info.key);
                result.push(info);
            }
        }
        result.sort((a, b) => a.key.localeCompare(b.key));
        console.log(JSON.stringify(result, undefined, 2));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dEtleVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbnRleHRrZXkvYnJvd3Nlci9jb250ZXh0S2V5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpbEJoRyxnQ0FHQztJQXBrQkQsTUFBTSx1QkFBdUIsR0FBRyx5QkFBeUIsQ0FBQztJQUUxRCxNQUFhLE9BQU87UUFNbkIsWUFBWSxFQUFVLEVBQUUsTUFBc0I7WUFDN0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQVcsS0FBSztZQUNmLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU0sUUFBUSxDQUFDLEdBQVcsRUFBRSxLQUFVO1lBQ3RDLGlFQUFpRTtZQUNqRSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTSxXQUFXLENBQUMsR0FBVztZQUM3QixzREFBc0Q7WUFDdEQsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixPQUFPLElB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
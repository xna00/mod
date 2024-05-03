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
define(["require", "exports", "vs/base/common/errors", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/async"], function (require, exports, errors, extensionDescriptionRegistry_1, extensions_1, extensions_2, log_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsActivator = exports.HostExtension = exports.EmptyExtension = exports.ActivatedExtension = exports.ExtensionActivationTimesBuilder = exports.ExtensionActivationTimes = void 0;
    class ExtensionActivationTimes {
        static { this.NONE = new ExtensionActivationTimes(false, -1, -1, -1); }
        constructor(startup, codeLoadingTime, activateCallTime, activateResolvedTime) {
            this.startup = startup;
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
        }
    }
    exports.ExtensionActivationTimes = ExtensionActivationTimes;
    class ExtensionActivationTimesBuilder {
        constructor(startup) {
            this._startup = startup;
            this._codeLoadingStart = -1;
            this._codeLoadingStop = -1;
            this._activateCallStart = -1;
            this._activateCallStop = -1;
            this._activateResolveStart = -1;
            this._activateResolveStop = -1;
        }
        _delta(start, stop) {
            if (start === -1 || stop === -1) {
                return -1;
            }
            return stop - start;
        }
        build() {
            return new ExtensionActivationTimes(this._startup, this._delta(this._codeLoadingStart, this._codeLoadingStop), this._delta(this._activateCallStart, this._activateCallStop), this._delta(this._activateResolveStart, this._activateResolveStop));
        }
        codeLoadingStart() {
            this._codeLoadingStart = Date.now();
        }
        codeLoadingStop() {
            this._codeLoadingStop = Date.now();
        }
        activateCallStart() {
            this._activateCallStart = Date.now();
        }
        activateCallStop() {
            this._activateCallStop = Date.now();
        }
        activateResolveStart() {
            this._activateResolveStart = Date.now();
        }
        activateResolveStop() {
            this._activateResolveStop = Date.now();
        }
    }
    exports.ExtensionActivationTimesBuilder = ExtensionActivationTimesBuilder;
    class ActivatedExtension {
        constructor(activationFailed, activationFailedError, activationTimes, module, exports, subscriptions) {
            this.activationFailed = activationFailed;
            this.activationFailedError = activationFailedError;
            this.activationTimes = activationTimes;
            this.module = module;
            this.exports = exports;
            this.subscriptions = subscriptions;
        }
    }
    exports.ActivatedExtension = ActivatedExtension;
    class EmptyExtension extends ActivatedExtension {
        constructor(activationTimes) {
            super(false, null, activationTimes, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.EmptyExtension = EmptyExtension;
    class HostExtension extends ActivatedExtension {
        constructor() {
            super(false, null, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.HostExtension = HostExtension;
    class FailedExtension extends ActivatedExtension {
        constructor(activationError) {
            super(true, activationError, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    let ExtensionsActivator = class ExtensionsActivator {
        constructor(registry, globalRegistry, host, _logService) {
            this._logService = _logService;
            this._registry = registry;
            this._globalRegistry = globalRegistry;
            this._host = host;
            this._operations = new extensions_1.ExtensionIdentifierMap();
            this._alreadyActivatedEvents = Object.create(null);
        }
        dispose() {
            for (const [_, op] of this._operations) {
                op.dispose();
            }
        }
        async waitForActivatingExtensions() {
            const res = [];
            for (const [_, op] of this._operations) {
                res.push(op.wait());
            }
            await Promise.all(res);
        }
        isActivated(extensionId) {
            const op = this._operations.get(extensionId);
            return Boolean(op && op.value);
        }
        getActivatedExtension(extensionId) {
            const op = this._operations.get(extensionId);
            if (!op || !op.value) {
                throw new Error(`Extension '${extensionId.value}' is not known or not activated`);
            }
            return op.value;
        }
        async activateByEvent(activationEvent, startup) {
            if (this._alreadyActivatedEvents[activationEvent]) {
                return;
            }
            const activateExtensions = this._registry.getExtensionDescriptionsForActivationEvent(activationEvent);
            await this._activateExtensions(activateExtensions.map(e => ({
                id: e.identifier,
                reason: { startup, extensionId: e.identifier, activationEvent }
            })));
            this._alreadyActivatedEvents[activationEvent] = true;
        }
        activateById(extensionId, reason) {
            const desc = this._registry.getExtensionDescription(extensionId);
            if (!desc) {
                throw new Error(`Extension '${extensionId.value}' is not known`);
            }
            return this._activateExtensions([{ id: desc.identifier, reason }]);
        }
        async _activateExtensions(extensions) {
            const operations = extensions
                .filter((p) => !this.isActivated(p.id))
                .map(ext => this._handleActivationRequest(ext));
            await Promise.all(operations.map(op => op.wait()));
        }
        /**
         * Handle semantics related to dependencies for `currentExtension`.
         * We don't need to worry about dependency loops because they are handled by the registry.
         */
        _handleActivationRequest(currentActivation) {
            if (this._operations.has(currentActivation.id)) {
                return this._operations.get(currentActivation.id);
            }
            if (this._isHostExtension(currentActivation.id)) {
                return this._createAndSaveOperation(currentActivation, null, [], null);
            }
            const currentExtension = this._registry.getExtensionDescription(currentActivation.id);
            if (!currentExtension) {
                // Error condition 0: unknown extension
                const error = new Error(`Cannot activate unknown extension '${currentActivation.id.value}'`);
                const result = this._createAndSaveOperation(currentActivation, null, [], new FailedExtension(error));
                this._host.onExtensionActivationError(currentActivation.id, error, new extensions_2.MissingExtensionDependency(currentActivation.id.value));
                return result;
            }
            const deps = [];
            const depIds = (typeof currentExtension.extensionDependencies === 'undefined' ? [] : currentExtension.extensionDependencies);
            for (const depId of depIds) {
                if (this._isResolvedExtension(depId)) {
                    // This dependency is already resolved
                    continue;
                }
                const dep = this._operations.get(depId);
                if (dep) {
                    deps.push(dep);
                    continue;
                }
                if (this._isHostExtension(depId)) {
                    // must first wait for the dependency to activate
                    deps.push(this._handleActivationRequest({
                        id: this._globalRegistry.getExtensionDescription(depId).identifier,
                        reason: currentActivation.reason
                    }));
                    continue;
                }
                const depDesc = this._registry.getExtensionDescription(depId);
                if (depDesc) {
                    if (!depDesc.main && !depDesc.browser) {
                        // this dependency does not need to activate because it is descriptive only
                        continue;
                    }
                    // must first wait for the dependency to activate
                    deps.push(this._handleActivationRequest({
                        id: depDesc.identifier,
                        reason: currentActivation.reason
                    }));
                    continue;
                }
                // Error condition 1: unknown dependency
                const currentExtensionFriendlyName = currentExtension.displayName || currentExtension.identifier.value;
                const error = new Error(`Cannot activate the '${currentExtensionFriendlyName}' extension because it depends on unknown extension '${depId}'`);
                const result = this._createAndSaveOperation(currentActivation, currentExtension.displayName, [], new FailedExtension(error));
                this._host.onExtensionActivationError(currentExtension.identifier, error, new extensions_2.MissingExtensionDependency(depId));
                return result;
            }
            return this._createAndSaveOperation(currentActivation, currentExtension.displayName, deps, null);
        }
        _createAndSaveOperation(activation, displayName, deps, value) {
            const operation = new ActivationOperation(activation.id, displayName, activation.reason, deps, value, this._host, this._logService);
            this._operations.set(activation.id, operation);
            return operation;
        }
        _isHostExtension(extensionId) {
            return extensionDescriptionRegistry_1.ExtensionDescriptionRegistry.isHostExtension(extensionId, this._registry, this._globalRegistry);
        }
        _isResolvedExtension(extensionId) {
            const extensionDescription = this._globalRegistry.getExtensionDescription(extensionId);
            if (!extensionDescription) {
                // unknown extension
                return false;
            }
            return (!extensionDescription.main && !extensionDescription.browser);
        }
    };
    exports.ExtensionsActivator = ExtensionsActivator;
    exports.ExtensionsActivator = ExtensionsActivator = __decorate([
        __param(3, log_1.ILogService)
    ], ExtensionsActivator);
    let ActivationOperation = class ActivationOperation {
        get value() {
            return this._value;
        }
        get friendlyName() {
            return this._displayName || this._id.value;
        }
        constructor(_id, _displayName, _reason, _deps, _value, _host, _logService) {
            this._id = _id;
            this._displayName = _displayName;
            this._reason = _reason;
            this._deps = _deps;
            this._value = _value;
            this._host = _host;
            this._logService = _logService;
            this._barrier = new async_1.Barrier();
            this._isDisposed = false;
            this._initialize();
        }
        dispose() {
            this._isDisposed = true;
        }
        wait() {
            return this._barrier.wait();
        }
        async _initialize() {
            await this._waitForDepsThenActivate();
            this._barrier.open();
        }
        async _waitForDepsThenActivate() {
            if (this._value) {
                // this operation is already finished
                return;
            }
            while (this._deps.length > 0) {
                // remove completed deps
                for (let i = 0; i < this._deps.length; i++) {
                    const dep = this._deps[i];
                    if (dep.value && !dep.value.activationFailed) {
                        // the dependency is already activated OK
                        this._deps.splice(i, 1);
                        i--;
                        continue;
                    }
                    if (dep.value && dep.value.activationFailed) {
                        // Error condition 2: a dependency has already failed activation
                        const error = new Error(`Cannot activate the '${this.friendlyName}' extension because its dependency '${dep.friendlyName}' failed to activate`);
                        error.detail = dep.value.activationFailedError;
                        this._value = new FailedExtension(error);
                        this._host.onExtensionActivationError(this._id, error, null);
                        return;
                    }
                }
                if (this._deps.length > 0) {
                    // wait for one dependency
                    await Promise.race(this._deps.map(dep => dep.wait()));
                }
            }
            await this._activate();
        }
        async _activate() {
            try {
                this._value = await this._host.actualActivateExtension(this._id, this._reason);
            }
            catch (err) {
                const error = new Error();
                if (err && err.name) {
                    error.name = err.name;
                }
                if (err && err.message) {
                    error.message = `Activating extension '${this._id.value}' failed: ${err.message}.`;
                }
                else {
                    error.message = `Activating extension '${this._id.value}' failed: ${err}.`;
                }
                if (err && err.stack) {
                    error.stack = err.stack;
                }
                // Treat the extension as being empty
                this._value = new FailedExtension(error);
                if (this._isDisposed && errors.isCancellationError(err)) {
                    // It is expected for ongoing activations to fail if the extension host is going down
                    // So simply ignore and don't log canceled errors in this case
                    return;
                }
                this._host.onExtensionActivationError(this._id, error, null);
                this._logService.error(`Activating extension ${this._id.value} failed due to an error:`);
                this._logService.error(err);
            }
        }
    };
    ActivationOperation = __decorate([
        __param(6, log_1.ILogService)
    ], ActivationOperation);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvbkFjdGl2YXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEV4dGVuc2lvbkFjdGl2YXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLE1BQWEsd0JBQXdCO2lCQUViLFNBQUksR0FBRyxJQUFJLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBTzlFLFlBQVksT0FBZ0IsRUFBRSxlQUF1QixFQUFFLGdCQUF3QixFQUFFLG9CQUE0QjtZQUM1RyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN2QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7WUFDekMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO1FBQ2xELENBQUM7O0lBZEYsNERBZUM7SUFFRCxNQUFhLCtCQUErQjtRQVUzQyxZQUFZLE9BQWdCO1lBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FB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
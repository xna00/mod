/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/observableInternal/base", "vs/base/common/observableInternal/derived", "vs/base/common/observableInternal/autorun", "vs/base/common/observableInternal/utils", "vs/base/common/observableInternal/promise", "vs/base/common/observableInternal/logging"], function (require, exports, base_1, derived_1, autorun_1, utils_1, promise_1, logging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.derivedWithCancellationToken = exports.waitForState = exports.PromiseResult = exports.ObservablePromise = exports.ObservableLazyPromise = exports.ObservableLazy = exports.wasEventTriggeredRecently = exports.observableSignalFromEvent = exports.observableSignal = exports.observableFromPromise = exports.observableFromEvent = exports.recomputeInitiallyAndOnChange = exports.keepObserved = exports.derivedObservableWithWritableCache = exports.derivedObservableWithCache = exports.debouncedObservable = exports.constObservable = exports.autorunWithStoreHandleChanges = exports.autorunOpts = exports.autorunWithStore = exports.autorunHandleChanges = exports.autorunDelta = exports.autorun = exports.derivedWithStore = exports.derivedHandleChanges = exports.derivedOpts = exports.derived = exports.subtransaction = exports.transaction = exports.disposableObservableValue = exports.observableValue = void 0;
    Object.defineProperty(exports, "observableValue", { enumerable: true, get: function () { return base_1.observableValue; } });
    Object.defineProperty(exports, "disposableObservableValue", { enumerable: true, get: function () { return base_1.disposableObservableValue; } });
    Object.defineProperty(exports, "transaction", { enumerable: true, get: function () { return base_1.transaction; } });
    Object.defineProperty(exports, "subtransaction", { enumerable: true, get: function () { return base_1.subtransaction; } });
    Object.defineProperty(exports, "derived", { enumerable: true, get: function () { return derived_1.derived; } });
    Object.defineProperty(exports, "derivedOpts", { enumerable: true, get: function () { return derived_1.derivedOpts; } });
    Object.defineProperty(exports, "derivedHandleChanges", { enumerable: true, get: function () { return derived_1.derivedHandleChanges; } });
    Object.defineProperty(exports, "derivedWithStore", { enumerable: true, get: function () { return derived_1.derivedWithStore; } });
    Object.defineProperty(exports, "autorun", { enumerable: true, get: function () { return autorun_1.autorun; } });
    Object.defineProperty(exports, "autorunDelta", { enumerable: true, get: function () { return autorun_1.autorunDelta; } });
    Object.defineProperty(exports, "autorunHandleChanges", { enumerable: true, get: function () { return autorun_1.autorunHandleChanges; } });
    Object.defineProperty(exports, "autorunWithStore", { enumerable: true, get: function () { return autorun_1.autorunWithStore; } });
    Object.defineProperty(exports, "autorunOpts", { enumerable: true, get: function () { return autorun_1.autorunOpts; } });
    Object.defineProperty(exports, "autorunWithStoreHandleChanges", { enumerable: true, get: function () { return autorun_1.autorunWithStoreHandleChanges; } });
    Object.defineProperty(exports, "constObservable", { enumerable: true, get: function () { return utils_1.constObservable; } });
    Object.defineProperty(exports, "debouncedObservable", { enumerable: true, get: function () { return utils_1.debouncedObservable; } });
    Object.defineProperty(exports, "derivedObservableWithCache", { enumerable: true, get: function () { return utils_1.derivedObservableWithCache; } });
    Object.defineProperty(exports, "derivedObservableWithWritableCache", { enumerable: true, get: function () { return utils_1.derivedObservableWithWritableCache; } });
    Object.defineProperty(exports, "keepObserved", { enumerable: true, get: function () { return utils_1.keepObserved; } });
    Object.defineProperty(exports, "recomputeInitiallyAndOnChange", { enumerable: true, get: function () { return utils_1.recomputeInitiallyAndOnChange; } });
    Object.defineProperty(exports, "observableFromEvent", { enumerable: true, get: function () { return utils_1.observableFromEvent; } });
    Object.defineProperty(exports, "observableFromPromise", { enumerable: true, get: function () { return utils_1.observableFromPromise; } });
    Object.defineProperty(exports, "observableSignal", { enumerable: true, get: function () { return utils_1.observableSignal; } });
    Object.defineProperty(exports, "observableSignalFromEvent", { enumerable: true, get: function () { return utils_1.observableSignalFromEvent; } });
    Object.defineProperty(exports, "wasEventTriggeredRecently", { enumerable: true, get: function () { return utils_1.wasEventTriggeredRecently; } });
    Object.defineProperty(exports, "ObservableLazy", { enumerable: true, get: function () { return promise_1.ObservableLazy; } });
    Object.defineProperty(exports, "ObservableLazyPromise", { enumerable: true, get: function () { return promise_1.ObservableLazyPromise; } });
    Object.defineProperty(exports, "ObservablePromise", { enumerable: true, get: function () { return promise_1.ObservablePromise; } });
    Object.defineProperty(exports, "PromiseResult", { enumerable: true, get: function () { return promise_1.PromiseResult; } });
    Object.defineProperty(exports, "waitForState", { enumerable: true, get: function () { return promise_1.waitForState; } });
    Object.defineProperty(exports, "derivedWithCancellationToken", { enumerable: true, get: function () { return promise_1.derivedWithCancellationToken; } });
    // Remove "//" in the next line to enable logging
    const enableLogging = false;
    if (enableLogging) {
        (0, logging_1.setLogger)(new logging_1.ConsoleObservableLogger());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhL0YsdUdBQUEsZUFBZSxPQUFBO0lBQ2YsaUhBQUEseUJBQXlCLE9BQUE7SUFDekIsbUdBQUEsV0FBVyxPQUFBO0lBQ1gsc0dBQUEsY0FBYyxPQUFBO0lBR2Qsa0dBQUEsT0FBTyxPQUFBO0lBQ1Asc0dBQUEsV0FBVyxPQUFBO0lBQ1gsK0dBQUEsb0JBQW9CLE9BQUE7SUFDcEIsMkdBQUEsZ0JBQWdCLE9BQUE7SUFHaEIsa0dBQUEsT0FBTyxPQUFBO0lBQ1AsdUdBQUEsWUFBWSxPQUFBO0lBQ1osK0dBQUEsb0JBQW9CLE9BQUE7SUFDcEIsMkdBQUEsZ0JBQWdCLE9BQUE7SUFDaEIsc0dBQUEsV0FBVyxPQUFBO0lBQ1gsd0hBQUEsNkJBQTZCLE9BQUE7SUFJN0Isd0dBQUEsZUFBZSxPQUFBO0lBQ2YsNEdBQUEsbUJBQW1CLE9BQUE7SUFDbkIsbUhBQUEsMEJBQTBCLE9BQUE7SUFDMUIsMkhBQUEsa0NBQWtDLE9BQUE7SUFDbEMscUdBQUEsWUFBWSxPQUFBO0lBQ1osc0hBQUEsNkJBQTZCLE9BQUE7SUFDN0IsNEdBQUEsbUJBQW1CLE9BQUE7SUFDbkIsOEdBQUEscUJBQXFCLE9BQUE7SUFDckIseUdBQUEsZ0JBQWdCLE9BQUE7SUFDaEIsa0hBQUEseUJBQXlCLE9BQUE7SUFDekIsa0hBQUEseUJBQXlCLE9BQUE7SUFHekIseUdBQUEsY0FBYyxPQUFBO0lBQ2QsZ0hBQUEscUJBQXFCLE9BQUE7SUFDckIsNEdBQUEsaUJBQWlCLE9BQUE7SUFDakIsd0dBQUEsYUFBYSxPQUFBO0lBQ2IsdUdBQUEsWUFBWSxPQUFBO0lBQ1osdUhBQUEsNEJBQTRCLE9BQUE7SUFLN0IsaURBQWlEO0lBQ2pELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FFekI7SUFFRixJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ25CLElBQUEsbUJBQVMsRUFBQyxJQUFJLGlDQUF1QixFQUFFLENBQUMsQ0FBQztJQUMxQyxDQUFDIn0=
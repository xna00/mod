/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BugIndicatingError = exports.ErrorNoTelemetry = exports.ExpectedError = exports.NotSupportedError = exports.NotImplementedError = exports.ReadonlyError = exports.CancellationError = exports.errorHandler = exports.ErrorHandler = void 0;
    exports.setUnexpectedErrorHandler = setUnexpectedErrorHandler;
    exports.isSigPipeError = isSigPipeError;
    exports.onUnexpectedError = onUnexpectedError;
    exports.onUnexpectedExternalError = onUnexpectedExternalError;
    exports.transformErrorForSerialization = transformErrorForSerialization;
    exports.isCancellationError = isCancellationError;
    exports.canceled = canceled;
    exports.illegalArgument = illegalArgument;
    exports.illegalState = illegalState;
    exports.getErrorMessage = getErrorMessage;
    // Avoid circular dependency on EventEmitter by implementing a subset of the interface.
    class ErrorHandler {
        constructor() {
            this.listeners = [];
            this.unexpectedErrorHandler = function (e) {
                setTimeout(() => {
                    if (e.stack) {
                        if (ErrorNoTelemetry.isErrorNoTelemetry(e)) {
                            throw new ErrorNoTelemetry(e.message + '\n\n' + e.stack);
                        }
                        throw new Error(e.message + '\n\n' + e.stack);
                    }
                    throw e;
                }, 0);
            };
        }
        addListener(listener) {
            this.listeners.push(listener);
            return () => {
                this._removeListener(listener);
            };
        }
        emit(e) {
            this.listeners.forEach((listener) => {
                listener(e);
            });
        }
        _removeListener(listener) {
            this.listeners.splice(this.listeners.indexOf(listener), 1);
        }
        setUnexpectedErrorHandler(newUnexpectedErrorHandler) {
            this.unexpectedErrorHandler = newUnexpectedErrorHandler;
        }
        getUnexpectedErrorHandler() {
            return this.unexpectedErrorHandler;
        }
        onUnexpectedError(e) {
            this.unexpectedErrorHandler(e);
            this.emit(e);
        }
        // For external errors, we don't want the listeners to be called
        onUnexpectedExternalError(e) {
            this.unexpectedErrorHandler(e);
        }
    }
    exports.ErrorHandler = ErrorHandler;
    exports.errorHandler = new ErrorHandler();
    /** @skipMangle */
    function setUnexpectedErrorHandler(newUnexpectedErrorHandler) {
        exports.errorHandler.setUnexpectedErrorHandler(newUnexpectedErrorHandler);
    }
    /**
     * Returns if the error is a SIGPIPE error. SIGPIPE errors should generally be
     * logged at most once, to avoid a loop.
     *
     * @see https://github.com/microsoft/vscode-remote-release/issues/6481
     */
    function isSigPipeError(e) {
        if (!e || typeof e !== 'object') {
            return false;
        }
        const cast = e;
        return cast.code === 'EPIPE' && cast.syscall?.toUpperCase() === 'WRITE';
    }
    function onUnexpectedError(e) {
        // ignore errors from cancelled promises
        if (!isCancellationError(e)) {
            exports.errorHandler.onUnexpectedError(e);
        }
        return undefined;
    }
    function onUnexpectedExternalError(e) {
        // ignore errors from cancelled promises
        if (!isCancellationError(e)) {
            exports.errorHandler.onUnexpectedExternalError(e);
        }
        return undefined;
    }
    function transformErrorForSerialization(error) {
        if (error instanceof Error) {
            const { name, message } = error;
            const stack = error.stacktrace || error.stack;
            return {
                $isError: true,
                name,
                message,
                stack,
                noTelemetry: ErrorNoTelemetry.isErrorNoTelemetry(error)
            };
        }
        // return as is
        return error;
    }
    const canceledName = 'Canceled';
    /**
     * Checks if the given error is a promise in canceled state
     */
    function isCancellationError(error) {
        if (error instanceof CancellationError) {
            return true;
        }
        return error instanceof Error && error.name === canceledName && error.message === canceledName;
    }
    // !!!IMPORTANT!!!
    // Do NOT change this class because it is also used as an API-type.
    class CancellationError extends Error {
        constructor() {
            super(canceledName);
            this.name = this.message;
        }
    }
    exports.CancellationError = CancellationError;
    /**
     * @deprecated use {@link CancellationError `new CancellationError()`} instead
     */
    function canceled() {
        const error = new Error(canceledName);
        error.name = error.message;
        return error;
    }
    function illegalArgument(name) {
        if (name) {
            return new Error(`Illegal argument: ${name}`);
        }
        else {
            return new Error('Illegal argument');
        }
    }
    function illegalState(name) {
        if (name) {
            return new Error(`Illegal state: ${name}`);
        }
        else {
            return new Error('Illegal state');
        }
    }
    class ReadonlyError extends TypeError {
        constructor(name) {
            super(name ? `${name} is read-only and cannot be changed` : 'Cannot change read-only property');
        }
    }
    exports.ReadonlyError = ReadonlyError;
    function getErrorMessage(err) {
        if (!err) {
            return 'Error';
        }
        if (err.message) {
            return err.message;
        }
        if (err.stack) {
            return err.stack.split('\n')[0];
        }
        return String(err);
    }
    class NotImplementedError extends Error {
        constructor(message) {
            super('NotImplemented');
            if (message) {
                this.message = message;
            }
        }
    }
    exports.NotImplementedError = NotImplementedError;
    class NotSupportedError extends Error {
        constructor(message) {
            super('NotSupported');
            if (message) {
                this.message = message;
            }
        }
    }
    exports.NotSupportedError = NotSupportedError;
    class ExpectedError extends Error {
        constructor() {
            super(...arguments);
            this.isExpected = true;
        }
    }
    exports.ExpectedError = ExpectedError;
    /**
     * Error that when thrown won't be logged in telemetry as an unhandled error.
     */
    class ErrorNoTelemetry extends Error {
        constructor(msg) {
            super(msg);
            this.name = 'CodeExpectedError';
        }
        static fromError(err) {
            if (err instanceof ErrorNoTelemetry) {
                return err;
            }
            const result = new ErrorNoTelemetry();
            result.message = err.message;
            result.stack = err.stack;
            return result;
        }
        static isErrorNoTelemetry(err) {
            return err.name === 'CodeExpectedError';
        }
    }
    exports.ErrorNoTelemetry = ErrorNoTelemetry;
    /**
     * This error indicates a bug.
     * Do not throw this for invalid user input.
     * Only catch this error to recover gracefully from bugs.
     */
    class BugIndicatingError extends Error {
        constructor(message) {
            super(message || 'An unexpected bug occurred.');
            Object.setPrototypeOf(this, BugIndicatingError.prototype);
            // Because we know for sure only buggy code throws this,
            // we definitely want to break here and fix the bug.
            // eslint-disable-next-line no-debugger
            // debugger;
        }
    }
    exports.BugIndicatingError = BugIndicatingError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEVoRyw4REFFQztJQVFELHdDQU9DO0lBRUQsOENBTUM7SUFFRCw4REFNQztJQVlELHdFQWVDO0lBeUJELGtEQUtDO0lBY0QsNEJBSUM7SUFFRCwwQ0FNQztJQUVELG9DQU1DO0lBUUQsMENBY0M7SUFsTkQsdUZBQXVGO0lBQ3ZGLE1BQWEsWUFBWTtRQUl4QjtZQUVDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRXBCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxVQUFVLENBQU07Z0JBQzdDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ2YsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2IsSUFBSSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUM1QyxNQUFNLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMxRCxDQUFDO3dCQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMvQyxDQUFDO29CQUVELE1BQU0sQ0FBQyxDQUFDO2dCQUNULENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQztRQUNILENBQUM7UUFFRCxXQUFXLENBQUMsUUFBK0I7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFOUIsT0FBTyxHQUFHLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLGVB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
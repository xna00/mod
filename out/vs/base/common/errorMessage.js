/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls"], function (require, exports, arrays, types, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toErrorMessage = toErrorMessage;
    exports.isErrorWithActions = isErrorWithActions;
    exports.createErrorWithActions = createErrorWithActions;
    function exceptionToErrorMessage(exception, verbose) {
        if (verbose && (exception.stack || exception.stacktrace)) {
            return nls.localize('stackTrace.format', "{0}: {1}", detectSystemErrorMessage(exception), stackToString(exception.stack) || stackToString(exception.stacktrace));
        }
        return detectSystemErrorMessage(exception);
    }
    function stackToString(stack) {
        if (Array.isArray(stack)) {
            return stack.join('\n');
        }
        return stack;
    }
    function detectSystemErrorMessage(exception) {
        // Custom node.js error from us
        if (exception.code === 'ERR_UNC_HOST_NOT_ALLOWED') {
            return `${exception.message}. Please update the 'security.allowedUNCHosts' setting if you want to allow this host.`;
        }
        // See https://nodejs.org/api/errors.html#errors_class_system_error
        if (typeof exception.code === 'string' && typeof exception.errno === 'number' && typeof exception.syscall === 'string') {
            return nls.localize('nodeExceptionMessage', "A system error occurred ({0})", exception.message);
        }
        return exception.message || nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
    }
    /**
     * Tries to generate a human readable error message out of the error. If the verbose parameter
     * is set to true, the error message will include stacktrace details if provided.
     *
     * @returns A string containing the error message.
     */
    function toErrorMessage(error = null, verbose = false) {
        if (!error) {
            return nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
        }
        if (Array.isArray(error)) {
            const errors = arrays.coalesce(error);
            const msg = toErrorMessage(errors[0], verbose);
            if (errors.length > 1) {
                return nls.localize('error.moreErrors', "{0} ({1} errors in total)", msg, errors.length);
            }
            return msg;
        }
        if (types.isString(error)) {
            return error;
        }
        if (error.detail) {
            const detail = error.detail;
            if (detail.error) {
                return exceptionToErrorMessage(detail.error, verbose);
            }
            if (detail.exception) {
                return exceptionToErrorMessage(detail.exception, verbose);
            }
        }
        if (error.stack) {
            return exceptionToErrorMessage(error, verbose);
        }
        if (error.message) {
            return error.message;
        }
        return nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
    }
    function isErrorWithActions(obj) {
        const candidate = obj;
        return candidate instanceof Error && Array.isArray(candidate.actions);
    }
    function createErrorWithActions(messageOrError, actions) {
        let error;
        if (typeof messageOrError === 'string') {
            error = new Error(messageOrError);
        }
        else {
            error = messageOrError;
        }
        error.actions = actions;
        return error;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JNZXNzYWdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9lcnJvck1lc3NhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0Q2hHLHdDQXlDQztJQU9ELGdEQUlDO0lBRUQsd0RBV0M7SUF0R0QsU0FBUyx1QkFBdUIsQ0FBQyxTQUFjLEVBQUUsT0FBZ0I7UUFDaEUsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQzFELE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsd0JBQXdCLENBQUMsU0FBUyxDQUFDLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbEssQ0FBQztRQUVELE9BQU8sd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLEtBQW9DO1FBQzFELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzFCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBUyx3QkFBd0IsQ0FBQyxTQUFjO1FBRS9DLCtCQUErQjtRQUMvQixJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssMEJBQTBCLEVBQUUsQ0FBQztZQUNuRCxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sd0ZBQXdGLENBQUM7UUFDckgsQ0FBQztRQUVELG1FQUFtRTtRQUNuRSxJQUFJLE9BQU8sU0FBUyxD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
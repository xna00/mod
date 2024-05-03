define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IAuthenticationExtensionsService = exports.IAuthenticationService = exports.INTERNAL_AUTH_PROVIDER_PREFIX = void 0;
    /**
     * Use this if you don't want the onDidChangeSessions event to fire in the extension host
     */
    exports.INTERNAL_AUTH_PROVIDER_PREFIX = '__';
    exports.IAuthenticationService = (0, instantiation_1.createDecorator)('IAuthenticationService');
    // TODO: Move this into MainThreadAuthentication
    exports.IAuthenticationExtensionsService = (0, instantiation_1.createDecorator)('IAuthenticationExtensionsService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hdXRoZW50aWNhdGlvbi9jb21tb24vYXV0aGVudGljYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQU9BOztPQUVHO0lBQ1UsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLENBQUM7SUE2Q3JDLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBZ0d4RyxnREFBZ0Q7SUFDbkMsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLGtDQUFrQyxDQUFDLENBQUMifQ==
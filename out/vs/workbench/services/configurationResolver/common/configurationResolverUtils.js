define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyDeprecatedVariableMessage = applyDeprecatedVariableMessage;
    function applyDeprecatedVariableMessage(schema) {
        schema.pattern = schema.pattern || '^(?!.*\\$\\{(env|config|command)\\.)';
        schema.patternErrorMessage = schema.patternErrorMessage ||
            nls.localize('deprecatedVariables', "'env.', 'config.' and 'command.' are deprecated, use 'env:', 'config:' and 'command:' instead.");
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlc29sdmVyVXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uUmVzb2x2ZXIvY29tbW9uL2NvbmZpZ3VyYXRpb25SZXNvbHZlclV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQU9BLHdFQUlDO0lBSkQsU0FBZ0IsOEJBQThCLENBQUMsTUFBbUI7UUFDakUsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxJQUFJLHNDQUFzQyxDQUFDO1FBQzFFLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUMsbUJBQW1CO1lBQ3RELEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsZ0dBQWdHLENBQUMsQ0FBQztJQUN4SSxDQUFDIn0=
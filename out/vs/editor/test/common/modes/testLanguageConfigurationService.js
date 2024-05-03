define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, event_1, lifecycle_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestLanguageConfigurationService = void 0;
    class TestLanguageConfigurationService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._registry = this._register(new languageConfigurationRegistry_1.LanguageConfigurationRegistry());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this._registry.onDidChange((e) => this._onDidChange.fire(new languageConfigurationRegistry_1.LanguageConfigurationServiceChangeEvent(e.languageId))));
        }
        register(languageId, configuration, priority) {
            return this._registry.register(languageId, configuration, priority);
        }
        getLanguageConfiguration(languageId) {
            return this._registry.getLanguageConfiguration(languageId) ??
                new languageConfigurationRegistry_1.ResolvedLanguageConfiguration('unknown', {});
        }
    }
    exports.TestLanguageConfigurationService = TestLanguageConfigurationService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdExhbmd1YWdlQ29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2Rlcy90ZXN0TGFuZ3VhZ2VDb25maWd1cmF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBU0EsTUFBYSxnQ0FBaUMsU0FBUSxzQkFBVTtRQVEvRDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBTlEsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2REFBNkIsRUFBRSxDQUFDLENBQUM7WUFFaEUsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEyQyxDQUFDLENBQUM7WUFDdkYsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUlyRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLHVFQUF1QyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0SSxDQUFDO1FBRUQsUUFBUSxDQUFDLFVBQWtCLEVBQUUsYUFBb0MsRUFBRSxRQUFpQjtZQUNuRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELHdCQUF3QixDQUFDLFVBQWtCO1lBQzFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUM7Z0JBQ3pELElBQUksNkRBQTZCLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELENBQUM7S0FDRDtJQXJCRCw0RUFxQkMifQ==
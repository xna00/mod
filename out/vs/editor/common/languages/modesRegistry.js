/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/mime", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, nls, event_1, platform_1, mime_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PLAINTEXT_EXTENSION = exports.PLAINTEXT_LANGUAGE_ID = exports.ModesRegistry = exports.EditorModesRegistry = exports.Extensions = void 0;
    // Define extension point ids
    exports.Extensions = {
        ModesRegistry: 'editor.modesRegistry'
    };
    class EditorModesRegistry {
        constructor() {
            this._onDidChangeLanguages = new event_1.Emitter();
            this.onDidChangeLanguages = this._onDidChangeLanguages.event;
            this._languages = [];
        }
        registerLanguage(def) {
            this._languages.push(def);
            this._onDidChangeLanguages.fire(undefined);
            return {
                dispose: () => {
                    for (let i = 0, len = this._languages.length; i < len; i++) {
                        if (this._languages[i] === def) {
                            this._languages.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getLanguages() {
            return this._languages;
        }
    }
    exports.EditorModesRegistry = EditorModesRegistry;
    exports.ModesRegistry = new EditorModesRegistry();
    platform_1.Registry.add(exports.Extensions.ModesRegistry, exports.ModesRegistry);
    exports.PLAINTEXT_LANGUAGE_ID = 'plaintext';
    exports.PLAINTEXT_EXTENSION = '.txt';
    exports.ModesRegistry.registerLanguage({
        id: exports.PLAINTEXT_LANGUAGE_ID,
        extensions: [exports.PLAINTEXT_EXTENSION],
        aliases: [nls.localize('plainText.alias', "Plain Text"), 'text'],
        mimetypes: [mime_1.Mimes.text]
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerDefaultConfigurations([{
            overrides: {
                '[plaintext]': {
                    'editor.unicodeHighlight.ambiguousCharacters': false,
                    'editor.unicodeHighlight.invisibleCharacters': false
                }
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZXNSZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvbW9kZXNSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsNkJBQTZCO0lBQ2hCLFFBQUEsVUFBVSxHQUFHO1FBQ3pCLGFBQWEsRUFBRSxzQkFBc0I7S0FDckMsQ0FBQztJQUVGLE1BQWEsbUJBQW1CO1FBTy9CO1lBSGlCLDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDN0MseUJBQW9CLEdBQWdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFHcEYsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVNLGdCQUFnQixDQUFDLEdBQTRCO1lBQ25ELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDM0MsT0FBTztnQkFDTixPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQzVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQzs0QkFDaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUM3QixPQUFPO3dCQUNSLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFTSxZQUFZO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUE3QkQsa0RBNkJDO0lBRVksUUFBQSxhQUFhLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0lBQ3ZELG1CQUFRLENBQUMsR0FBRyxDQUFDLGtCQUFVLENBQUMsYUFBYSxFQUFFLHFCQUFhLENBQUMsQ0FBQztJQUV6QyxRQUFBLHFCQUFxQixHQUFHLFdBQVcsQ0FBQztJQUNwQyxRQUFBLG1CQUFtQixHQUFHLE1BQU0sQ0FBQztJQUUxQyxxQkFBYSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLEVBQUUsRUFBRSw2QkFBcUI7UUFDekIsVUFBVSxFQUFFLENBQUMsMkJBQW1CLENBQUM7UUFDakMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsRUFBRSxNQUFNLENBQUM7UUFDaEUsU0FBUyxFQUFFLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQztLQUN2QixDQUFDLENBQUM7SUFFSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDO1NBQ3hFLDZCQUE2QixDQUFDLENBQUM7WUFDL0IsU0FBUyxFQUFFO2dCQUNWLGFBQWEsRUFBRTtvQkFDZCw2Q0FBNkMsRUFBRSxLQUFLO29CQUNwRCw2Q0FBNkMsRUFBRSxLQUFLO2lCQUNwRDthQUNEO1NBQ0QsQ0FBQyxDQUFDLENBQUMifQ==
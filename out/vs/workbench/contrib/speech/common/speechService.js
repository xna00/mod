/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform"], function (require, exports, nls_1, contextkey_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SPEECH_LANGUAGES = exports.SPEECH_LANGUAGE_CONFIG = exports.KeywordRecognitionStatus = exports.SpeechToTextStatus = exports.SpeechToTextInProgress = exports.HasSpeechProvider = exports.ISpeechService = void 0;
    exports.speechLanguageConfigToLanguage = speechLanguageConfigToLanguage;
    exports.ISpeechService = (0, instantiation_1.createDecorator)('speechService');
    exports.HasSpeechProvider = new contextkey_1.RawContextKey('hasSpeechProvider', false, { type: 'string', description: (0, nls_1.localize)('hasSpeechProvider', "A speech provider is registered to the speech service.") });
    exports.SpeechToTextInProgress = new contextkey_1.RawContextKey('speechToTextInProgress', false, { type: 'string', description: (0, nls_1.localize)('speechToTextInProgress', "A speech-to-text session is in progress.") });
    var SpeechToTextStatus;
    (function (SpeechToTextStatus) {
        SpeechToTextStatus[SpeechToTextStatus["Started"] = 1] = "Started";
        SpeechToTextStatus[SpeechToTextStatus["Recognizing"] = 2] = "Recognizing";
        SpeechToTextStatus[SpeechToTextStatus["Recognized"] = 3] = "Recognized";
        SpeechToTextStatus[SpeechToTextStatus["Stopped"] = 4] = "Stopped";
    })(SpeechToTextStatus || (exports.SpeechToTextStatus = SpeechToTextStatus = {}));
    var KeywordRecognitionStatus;
    (function (KeywordRecognitionStatus) {
        KeywordRecognitionStatus[KeywordRecognitionStatus["Recognized"] = 1] = "Recognized";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Stopped"] = 2] = "Stopped";
        KeywordRecognitionStatus[KeywordRecognitionStatus["Canceled"] = 3] = "Canceled";
    })(KeywordRecognitionStatus || (exports.KeywordRecognitionStatus = KeywordRecognitionStatus = {}));
    exports.SPEECH_LANGUAGE_CONFIG = 'accessibility.voice.speechLanguage';
    exports.SPEECH_LANGUAGES = {
        ['da-DK']: {
            name: (0, nls_1.localize)('speechLanguage.da-DK', "Danish (Denmark)")
        },
        ['de-DE']: {
            name: (0, nls_1.localize)('speechLanguage.de-DE', "German (Germany)")
        },
        ['en-AU']: {
            name: (0, nls_1.localize)('speechLanguage.en-AU', "English (Australia)")
        },
        ['en-CA']: {
            name: (0, nls_1.localize)('speechLanguage.en-CA', "English (Canada)")
        },
        ['en-GB']: {
            name: (0, nls_1.localize)('speechLanguage.en-GB', "English (United Kingdom)")
        },
        ['en-IE']: {
            name: (0, nls_1.localize)('speechLanguage.en-IE', "English (Ireland)")
        },
        ['en-IN']: {
            name: (0, nls_1.localize)('speechLanguage.en-IN', "English (India)")
        },
        ['en-NZ']: {
            name: (0, nls_1.localize)('speechLanguage.en-NZ', "English (New Zealand)")
        },
        ['en-US']: {
            name: (0, nls_1.localize)('speechLanguage.en-US', "English (United States)")
        },
        ['es-ES']: {
            name: (0, nls_1.localize)('speechLanguage.es-ES', "Spanish (Spain)")
        },
        ['es-MX']: {
            name: (0, nls_1.localize)('speechLanguage.es-MX', "Spanish (Mexico)")
        },
        ['fr-CA']: {
            name: (0, nls_1.localize)('speechLanguage.fr-CA', "French (Canada)")
        },
        ['fr-FR']: {
            name: (0, nls_1.localize)('speechLanguage.fr-FR', "French (France)")
        },
        ['hi-IN']: {
            name: (0, nls_1.localize)('speechLanguage.hi-IN', "Hindi (India)")
        },
        ['it-IT']: {
            name: (0, nls_1.localize)('speechLanguage.it-IT', "Italian (Italy)")
        },
        ['ja-JP']: {
            name: (0, nls_1.localize)('speechLanguage.ja-JP', "Japanese (Japan)")
        },
        ['ko-KR']: {
            name: (0, nls_1.localize)('speechLanguage.ko-KR', "Korean (South Korea)")
        },
        ['nl-NL']: {
            name: (0, nls_1.localize)('speechLanguage.nl-NL', "Dutch (Netherlands)")
        },
        ['pt-PT']: {
            name: (0, nls_1.localize)('speechLanguage.pt-PT', "Portuguese (Portugal)")
        },
        ['pt-BR']: {
            name: (0, nls_1.localize)('speechLanguage.pt-BR', "Portuguese (Brazil)")
        },
        ['ru-RU']: {
            name: (0, nls_1.localize)('speechLanguage.ru-RU', "Russian (Russia)")
        },
        ['sv-SE']: {
            name: (0, nls_1.localize)('speechLanguage.sv-SE', "Swedish (Sweden)")
        },
        ['tr-TR']: {
            // allow-any-unicode-next-line
            name: (0, nls_1.localize)('speechLanguage.tr-TR', "Turkish (Türkiye)")
        },
        ['zh-CN']: {
            name: (0, nls_1.localize)('speechLanguage.zh-CN', "Chinese (Simplified, China)")
        },
        ['zh-HK']: {
            name: (0, nls_1.localize)('speechLanguage.zh-HK', "Chinese (Traditional, Hong Kong)")
        },
        ['zh-TW']: {
            name: (0, nls_1.localize)('speechLanguage.zh-TW', "Chinese (Traditional, Taiwan)")
        }
    };
    function speechLanguageConfigToLanguage(config, lang = platform_1.language) {
        if (typeof config === 'string') {
            if (config === 'auto') {
                if (lang !== 'en') {
                    const langParts = lang.split('-');
                    return speechLanguageConfigToLanguage(`${langParts[0]}-${(langParts[1] ?? langParts[0]).toUpperCase()}`);
                }
            }
            else {
                if (exports.SPEECH_LANGUAGES[config]) {
                    return config;
                }
            }
        }
        return 'en-US';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3BlZWNoL2NvbW1vbi9zcGVlY2hTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFMaEcsd0VBZ0JDO0lBMUxZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUFFbEUsUUFBQSxpQkFBaUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsd0RBQXdELENBQUMsRUFBRSxDQUFDLENBQUM7SUFDck0sUUFBQSxzQkFBc0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsMENBQTBDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFPbk4sSUFBWSxrQkFLWDtJQUxELFdBQVksa0JBQWtCO1FBQzdCLGlFQUFXLENBQUE7UUFDWCx5RUFBZSxDQUFBO1FBQ2YsdUVBQWMsQ0FBQTtRQUNkLGlFQUFXLENBQUE7SUFDWixDQUFDLEVBTFcsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFLN0I7SUFXRCxJQUFZLHdCQUlYO0lBSkQsV0FBWSx3QkFBd0I7UUFDbkMsbUZBQWMsQ0FBQTtRQUNkLDZFQUFXLENBQUE7UUFDWCwrRUFBWSxDQUFBO0lBQ2IsQ0FBQyxFQUpXLHdCQUF3Qix3Q0FBeEIsd0JBQXdCLFFBSW5DO0lBd0RZLFFBQUEsc0JBQXNCLEdBQUcsb0NBQW9DLENBQUM7SUFFOUQsUUFBQSxnQkFB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
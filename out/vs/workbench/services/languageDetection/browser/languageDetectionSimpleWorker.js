/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stopwatch", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, stopwatch_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionSimpleWorker = void 0;
    exports.create = create;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new LanguageDetectionSimpleWorker(host, null);
    }
    /**
     * @internal
     */
    class LanguageDetectionSimpleWorker extends editorSimpleWorker_1.EditorSimpleWorker {
        constructor() {
            super(...arguments);
            this._regexpLoadFailed = false;
            this._loadFailed = false;
            this.modelIdToCoreId = new Map();
        }
        static { this.expectedRelativeConfidence = 0.2; }
        static { this.positiveConfidenceCorrectionBucket1 = 0.05; }
        static { this.positiveConfidenceCorrectionBucket2 = 0.025; }
        static { this.negativeConfidenceCorrection = 0.5; }
        async detectLanguage(uri, langBiases, preferHistory, supportedLangs) {
            const languages = [];
            const confidences = [];
            const stopWatch = new stopwatch_1.StopWatch();
            const documentTextSample = this.getTextForDetection(uri);
            if (!documentTextSample) {
                return;
            }
            const neuralResolver = async () => {
                for await (const language of this.detectLanguagesImpl(documentTextSample)) {
                    if (!this.modelIdToCoreId.has(language.languageId)) {
                        this.modelIdToCoreId.set(language.languageId, await this._host.fhr('getLanguageId', [language.languageId]));
                    }
                    const coreId = this.modelIdToCoreId.get(language.languageId);
                    if (coreId && (!supportedLangs?.length || supportedLangs.includes(coreId))) {
                        languages.push(coreId);
                        confidences.push(language.confidence);
                    }
                }
                stopWatch.stop();
                if (languages.length) {
                    this._host.fhr('sendTelemetryEvent', [languages, confidences, stopWatch.elapsed()]);
                    return languages[0];
                }
                return undefined;
            };
            const historicalResolver = async () => this.runRegexpModel(documentTextSample, langBiases ?? {}, supportedLangs);
            if (preferHistory) {
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
            }
            else {
                const neural = await neuralResolver();
                if (neural) {
                    return neural;
                }
                const history = await historicalResolver();
                if (history) {
                    return history;
                }
            }
            return undefined;
        }
        getTextForDetection(uri) {
            const editorModel = this._getModel(uri);
            if (!editorModel) {
                return;
            }
            const end = editorModel.positionAt(10000);
            const content = editorModel.getValueInRange({
                startColumn: 1,
                startLineNumber: 1,
                endColumn: end.column,
                endLineNumber: end.lineNumber
            });
            return content;
        }
        async getRegexpModel() {
            if (this._regexpLoadFailed) {
                return;
            }
            if (this._regexpModel) {
                return this._regexpModel;
            }
            const uri = await this._host.fhr('getRegexpModelUri', []);
            try {
                this._regexpModel = await new Promise((resolve_1, reject_1) => { require([uri], resolve_1, reject_1); });
                return this._regexpModel;
            }
            catch (e) {
                this._regexpLoadFailed = true;
                // console.warn('error loading language detection model', e);
                return;
            }
        }
        async runRegexpModel(content, langBiases, supportedLangs) {
            const regexpModel = await this.getRegexpModel();
            if (!regexpModel) {
                return;
            }
            if (supportedLangs?.length) {
                // When using supportedLangs, normally computed biases are too extreme. Just use a "bitmask" of sorts.
                for (const lang of Object.keys(langBiases)) {
                    if (supportedLangs.includes(lang)) {
                        langBiases[lang] = 1;
                    }
                    else {
                        langBiases[lang] = 0;
                    }
                }
            }
            const detected = regexpModel.detect(content, langBiases, supportedLangs);
            return detected;
        }
        async getModelOperations() {
            if (this._modelOperations) {
                return this._modelOperations;
            }
            const uri = await this._host.fhr('getIndexJsUri', []);
            const { ModelOperations } = await new Promise((resolve_2, reject_2) => { require([uri], resolve_2, reject_2); });
            this._modelOperations = new ModelOperations({
                modelJsonLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getModelJsonUri', []));
                    try {
                        const modelJSON = await response.json();
                        return modelJSON;
                    }
                    catch (e) {
                        const message = `Failed to parse model JSON.`;
                        throw new Error(message);
                    }
                },
                weightsLoaderFunc: async () => {
                    const response = await fetch(await this._host.fhr('getWeightsUri', []));
                    const buffer = await response.arrayBuffer();
                    return buffer;
                }
            });
            return this._modelOperations;
        }
        // This adjusts the language confidence scores to be more accurate based on:
        // * VS Code's language usage
        // * Languages with 'problematic' syntaxes that have caused incorrect language detection
        adjustLanguageConfidence(modelResult) {
            switch (modelResult.languageId) {
                // For the following languages, we increase the confidence because
                // these are commonly used languages in VS Code and supported
                // by the model.
                case 'js':
                case 'html':
                case 'json':
                case 'ts':
                case 'css':
                case 'py':
                case 'xml':
                case 'php':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket1;
                    break;
                // case 'yaml': // YAML has been know to cause incorrect language detection because the language is pretty simple. We don't want to increase the confidence for this.
                case 'cpp':
                case 'sh':
                case 'java':
                case 'cs':
                case 'c':
                    modelResult.confidence += LanguageDetectionSimpleWorker.positiveConfidenceCorrectionBucket2;
                    break;
                // For the following languages, we need to be extra confident that the language is correct because
                // we've had issues like #131912 that caused incorrect guesses. To enforce this, we subtract the
                // negativeConfidenceCorrection from the confidence.
                // languages that are provided by default in VS Code
                case 'bat':
                case 'ini':
                case 'makefile':
                case 'sql':
                // languages that aren't provided by default in VS Code
                case 'csv':
                case 'toml':
                    // Other considerations for negativeConfidenceCorrection that
                    // aren't built in but suported by the model include:
                    // * Assembly, TeX - These languages didn't have clear language modes in the community
                    // * Markdown, Dockerfile - These languages are simple but they embed other languages
                    modelResult.confidence -= LanguageDetectionSimpleWorker.negativeConfidenceCorrection;
                    break;
                default:
                    break;
            }
            return modelResult;
        }
        async *detectLanguagesImpl(content) {
            if (this._loadFailed) {
                return;
            }
            let modelOperations;
            try {
                modelOperations = await this.getModelOperations();
            }
            catch (e) {
                console.log(e);
                this._loadFailed = true;
                return;
            }
            let modelResults;
            try {
                modelResults = await modelOperations.runModel(content);
            }
            catch (e) {
                console.warn(e);
            }
            if (!modelResults
                || modelResults.length === 0
                || modelResults[0].confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                return;
            }
            const firstModelResult = this.adjustLanguageConfidence(modelResults[0]);
            if (firstModelResult.confidence < LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                return;
            }
            const possibleLanguages = [firstModelResult];
            for (let current of modelResults) {
                if (current === firstModelResult) {
                    continue;
                }
                current = this.adjustLanguageConfidence(current);
                const currentHighest = possibleLanguages[possibleLanguages.length - 1];
                if (currentHighest.confidence - current.confidence >= LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                    while (possibleLanguages.length) {
                        yield possibleLanguages.shift();
                    }
                    if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                        possibleLanguages.push(current);
                        continue;
                    }
                    return;
                }
                else {
                    if (current.confidence > LanguageDetectionSimpleWorker.expectedRelativeConfidence) {
                        possibleLanguages.push(current);
                        continue;
                    }
                    return;
                }
            }
        }
    }
    exports.LanguageDetectionSimpleWorker = LanguageDetectionSimpleWorker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb25TaW1wbGVXb3JrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9sYW5ndWFnZURldGVjdGlvbi9icm93c2VyL2xhbmd1YWdlRGV0ZWN0aW9uU2ltcGxlV29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyx3QkFFQztJQU5EOzs7T0FHRztJQUNILFNBQWdCLE1BQU0sQ0FBQyxJQUF1QjtRQUM3QyxPQUFPLElBQUksNkJBQTZCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRDs7T0FFRztJQUNILE1BQWEsNkJBQThCLFNBQVEsdUNBQWtCO1FBQXJFOztZQU9TLHNCQUFpQixHQUFZLEtBQUssQ0FBQztZQUduQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztZQUU3QixvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBK09yRCxDQUFDO2lCQTFQd0IsK0JBQTBCLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ2pDLHdDQUFtQyxHQUFHLElBQUksQUFBUCxDQUFRO2lCQUMzQyx3Q0FBbUMsR0FBRyxLQUFLLEFBQVIsQ0FBUztpQkFDNUMsaUNBQTRCLEdBQUcsR0FBRyxBQUFOLENBQU87UUFVcEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFXLEVBQUUsVUFBOEMsRUFBRSxhQUFzQixFQUFFLGNBQXlCO1lBQ3pJLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztZQUMvQixNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7WUFDakMsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7WUFDbEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekQs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
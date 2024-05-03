/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/editor/common/languageSelector"], function (require, exports, event_1, lifecycle_1, model_1, languageSelector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeatureRegistry = void 0;
    function isExclusive(selector) {
        if (typeof selector === 'string') {
            return false;
        }
        else if (Array.isArray(selector)) {
            return selector.every(isExclusive);
        }
        else {
            return !!selector.exclusive; // TODO: microsoft/TypeScript#42768
        }
    }
    class MatchCandidate {
        constructor(uri, languageId, notebookUri, notebookType) {
            this.uri = uri;
            this.languageId = languageId;
            this.notebookUri = notebookUri;
            this.notebookType = notebookType;
        }
        equals(other) {
            return this.notebookType === other.notebookType
                && this.languageId === other.languageId
                && this.uri.toString() === other.uri.toString()
                && this.notebookUri?.toString() === other.notebookUri?.toString();
        }
    }
    class LanguageFeatureRegistry {
        constructor(_notebookInfoResolver) {
            this._notebookInfoResolver = _notebookInfoResolver;
            this._clock = 0;
            this._entries = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        register(selector, provider) {
            let entry = {
                selector,
                provider,
                _score: -1,
                _time: this._clock++
            };
            this._entries.push(entry);
            this._lastCandidate = undefined;
            this._onDidChange.fire(this._entries.length);
            return (0, lifecycle_1.toDisposable)(() => {
                if (entry) {
                    const idx = this._entries.indexOf(entry);
                    if (idx >= 0) {
                        this._entries.splice(idx, 1);
                        this._lastCandidate = undefined;
                        this._onDidChange.fire(this._entries.length);
                        entry = undefined;
                    }
                }
            });
        }
        has(model) {
            return this.all(model).length > 0;
        }
        all(model) {
            if (!model) {
                return [];
            }
            this._updateScores(model);
            const result = [];
            // from registry
            for (const entry of this._entries) {
                if (entry._score > 0) {
                    result.push(entry.provider);
                }
            }
            return result;
        }
        ordered(model) {
            const result = [];
            this._orderedForEach(model, entry => result.push(entry.provider));
            return result;
        }
        orderedGroups(model) {
            const result = [];
            let lastBucket;
            let lastBucketScore;
            this._orderedForEach(model, entry => {
                if (lastBucket && lastBucketScore === entry._score) {
                    lastBucket.push(entry.provider);
                }
                else {
                    lastBucketScore = entry._score;
                    lastBucket = [entry.provider];
                    result.push(lastBucket);
                }
            });
            return result;
        }
        _orderedForEach(model, callback) {
            this._updateScores(model);
            for (const entry of this._entries) {
                if (entry._score > 0) {
                    callback(entry);
                }
            }
        }
        _updateScores(model) {
            const notebookInfo = this._notebookInfoResolver?.(model.uri);
            // use the uri (scheme, pattern) of the notebook info iff we have one
            // otherwise it's the model's/document's uri
            const candidate = notebookInfo
                ? new MatchCandidate(model.uri, model.getLanguageId(), notebookInfo.uri, notebookInfo.type)
                : new MatchCandidate(model.uri, model.getLanguageId(), undefined, undefined);
            if (this._lastCandidate?.equals(candidate)) {
                // nothing has changed
                return;
            }
            this._lastCandidate = candidate;
            for (const entry of this._entries) {
                entry._score = (0, languageSelector_1.score)(entry.selector, candidate.uri, candidate.languageId, (0, model_1.shouldSynchronizeModel)(model), candidate.notebookUri, candidate.notebookType);
                if (isExclusive(entry.selector) && entry._score > 0) {
                    // support for one exclusive selector that overwrites
                    // any other selector
                    for (const entry of this._entries) {
                        entry._score = 0;
                    }
                    entry._score = 1000;
                    break;
                }
            }
            // needs sorting
            this._entries.sort(LanguageFeatureRegistry._compareByScoreAndTime);
        }
        static _compareByScoreAndTime(a, b) {
            if (a._score < b._score) {
                return 1;
            }
            else if (a._score > b._score) {
                return -1;
            }
            // De-prioritize built-in providers
            if (isBuiltinSelector(a.selector) && !isBuiltinSelector(b.selector)) {
                return 1;
            }
            else if (!isBuiltinSelector(a.selector) && isBuiltinSelector(b.selector)) {
                return -1;
            }
            if (a._time < b._time) {
                return 1;
            }
            else if (a._time > b._time) {
                return -1;
            }
            else {
                return 0;
            }
        }
    }
    exports.LanguageFeatureRegistry = LanguageFeatureRegistry;
    function isBuiltinSelector(selector) {
        if (typeof selector === 'string') {
            return false;
        }
        if (Array.isArray(selector)) {
            return selector.some(isBuiltinSelector);
        }
        return Boolean(selector.isBuiltin);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VGZWF0dXJlUmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VGZWF0dXJlUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLFNBQVMsV0FBVyxDQUFDLFFBQTBCO1FBQzlDLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDbEMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDcEMsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxDQUFDLENBQUUsUUFBMkIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxtQ0FBbUM7UUFDckYsQ0FBQztJQUNGLENBQUM7SUFXRCxNQUFNLGNBQWM7UUFDbkIsWUFDVSxHQUFRLEVBQ1IsVUFBa0IsRUFDbEIsV0FBNEIsRUFDNUIsWUFBZ0M7WUFIaEMsUUFBRyxHQUFILEdBQUcsQ0FBSztZQUNSLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDbEIsZ0JBQVcsR0FBWCxXQUFXLENBQWlCO1lBQzVCLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtRQUN0QyxDQUFDO1FBRUwsTUFBTSxDQUFDLEtBQXFCO1lBQzNCLE9BQU8sSUFBSSxDQUFDLFlBQVksS0FBSyxLQUFLLENBQUMsWUFBWTttQkFDM0MsSUFBSSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVTttQkFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTttQkFDNUMsSUFBSSxDQUFDLFdBQVcsRUFB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
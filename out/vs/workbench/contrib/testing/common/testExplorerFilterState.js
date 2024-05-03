var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, glob_1, lifecycle_1, instantiation_1, storage_1, observableValue_1, storedValue_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestFilterTerm = exports.TestExplorerFilterState = exports.ITestExplorerFilterState = void 0;
    exports.ITestExplorerFilterState = (0, instantiation_1.createDecorator)('testingFilterState');
    const tagRe = /!?@([^ ,:]+)/g;
    const trimExtraWhitespace = (str) => str.replace(/\s\s+/g, ' ').trim();
    let TestExplorerFilterState = class TestExplorerFilterState extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.focusEmitter = new event_1.Emitter();
            /**
             * Mapping of terms to whether they're included in the text.
             */
            this.termFilterState = {};
            /** @inheritdoc */
            this.globList = [];
            /** @inheritdoc */
            this.includeTags = new Set();
            /** @inheritdoc */
            this.excludeTags = new Set();
            /** @inheritdoc */
            this.text = this._register(new observableValue_1.MutableObservableValue(''));
            /** @inheritdoc */
            this.fuzzy = this._register(observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'testHistoryFuzzy',
                scope: 0 /* StorageScope.PROFILE */,
                target: 0 /* StorageTarget.USER */,
            }, this.storageService), false));
            this.reveal = this._register(new observableValue_1.MutableObservableValue(undefined));
            this.onDidRequestInputFocus = this.focusEmitter.event;
        }
        /** @inheritdoc */
        focusInput() {
            this.focusEmitter.fire();
        }
        /** @inheritdoc */
        setText(text) {
            if (text === this.text.value) {
                return;
            }
            this.termFilterState = {};
            this.globList = [];
            this.includeTags.clear();
            this.excludeTags.clear();
            let globText = '';
            let lastIndex = 0;
            for (const match of text.matchAll(tagRe)) {
                let nextIndex = match.index + match[0].length;
                const tag = match[0];
                if (allTestFilterTerms.includes(tag)) {
                    this.termFilterState[tag] = true;
                }
                // recognize and parse @ctrlId:tagId or quoted like @ctrlId:"tag \\"id"
                if (text[nextIndex] === ':') {
                    nextIndex++;
                    let delimiter = text[nextIndex];
                    if (delimiter !== `"` && delimiter !== `'`) {
                        delimiter = ' ';
                    }
                    else {
                        nextIndex++;
                    }
                    let tagId = '';
                    while (nextIndex < text.length && text[nextIndex] !== delimiter) {
                        if (text[nextIndex] === '\\') {
                            tagId += text[nextIndex + 1];
                            nextIndex += 2;
                        }
                        else {
                            tagId += text[nextIndex];
                            nextIndex++;
                        }
                    }
                    if (match[0].startsWith('!')) {
                        this.excludeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    else {
                        this.includeTags.add((0, testTypes_1.namespaceTestTag)(match[1], tagId));
                    }
                    nextIndex++;
                }
                globText += text.slice(lastIndex, match.index);
                lastIndex = nextIndex;
            }
            globText += text.slice(lastIndex).trim();
            if (globText.length) {
                for (const filter of (0, glob_1.splitGlobAware)(globText, ',').map(s => s.trim()).filter(s => !!s.length)) {
                    if (filter.startsWith('!')) {
                        this.globList.push({ include: false, text: filter.slice(1).toLowerCase() });
                    }
                    else {
                        this.globList.push({ include: true, text: filter.toLowerCase() });
                    }
                }
            }
            this.text.value = text; // purposely afterwards so everything is updated when the change event happen
        }
        /** @inheritdoc */
        isFilteringFor(term) {
            return !!this.termFilterState[term];
        }
        /** @inheritdoc */
        toggleFilteringFor(term, shouldFilter) {
            const text = this.text.value.trim();
            if (shouldFilter !== false && !this.termFilterState[term]) {
                this.setText(text ? `${text} ${term}` : term);
            }
            else if (shouldFilter !== true && this.termFilterState[term]) {
                this.setText(trimExtraWhitespace(text.replace(term, '')));
            }
        }
    };
    exports.TestExplorerFilterState = TestExplorerFilterState;
    exports.TestExplorerFilterState = TestExplorerFilterState = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExplorerFilterState);
    var TestFilterTerm;
    (function (TestFilterTerm) {
        TestFilterTerm["Failed"] = "@failed";
        TestFilterTerm["Executed"] = "@executed";
        TestFilterTerm["CurrentDoc"] = "@doc";
        TestFilterTerm["Hidden"] = "@hidden";
    })(TestFilterTerm || (exports.TestFilterTerm = TestFilterTerm = {}));
    const allTestFilterTerms = [
        "@failed" /* TestFilterTerm.Failed */,
        "@executed" /* TestFilterTerm.Executed */,
        "@doc" /* TestFilterTerm.CurrentDoc */,
        "@hidden" /* TestFilterTerm.Hidden */,
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4cGxvcmVyRmlsdGVyU3RhdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RFeHBsb3JlckZpbHRlclN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrRWEsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLG9CQUFvQixDQUFDLENBQUM7SUFFeEcsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDO0lBQzlCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBRXhFLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUErQnRELFlBQTZCLGNBQWdEO1lBQzVFLEtBQUssRUFBRSxDQUFDO1lBRHFDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQTdCNUQsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3BEOztlQUVHO1lBQ0ssb0JBQWUsR0FBcUMsRUFBRSxDQUFDO1lBRS9ELGtCQUFrQjtZQUNYLGFBQVEsR0FBeUMsRUFBRSxDQUFDO1lBRTNELGtCQUFrQjtZQUNYLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUV2QyxrQkFBa0I7WUFDWCxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFFdkMsa0JBQWtCO1lBQ0YsU0FBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3Q0FBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRFLGtCQUFrQjtZQUNGLFVBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLHdDQUFzQixD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
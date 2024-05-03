/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/tfIdf", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, tfIdf_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Generates all permutations of an array.
     *
     * This is useful for testing to make sure order does not effect the result.
     */
    function permutate(arr) {
        if (arr.length === 0) {
            return [[]];
        }
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const permutationsRest = permutate(rest);
            for (let j = 0; j < permutationsRest.length; j++) {
                result.push([arr[i], ...permutationsRest[j]]);
            }
        }
        return result;
    }
    function assertScoreOrdersEqual(actualScores, expectedScoreKeys) {
        actualScores.sort((a, b) => (b.score - a.score) || a.key.localeCompare(b.key));
        assert.strictEqual(actualScores.length, expectedScoreKeys.length);
        for (let i = 0; i < expectedScoreKeys.length; i++) {
            assert.strictEqual(actualScores[i].key, expectedScoreKeys[i]);
        }
    }
    suite('TF-IDF Calculator', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Should return no scores when no documents are given', () => {
            const tfidf = new tfIdf_1.TfIdfCalculator();
            const scores = tfidf.calculateScores('something', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
        test('Should return no scores for term not in document', () => {
            const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments([
                makeDocument('A', 'cat dog fish'),
            ]);
            const scores = tfidf.calculateScores('elepant', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
        test('Should return scores for document with exact match', () => {
            for (const docs of permutate([
                makeDocument('A', 'cat dog cat'),
                makeDocument('B', 'cat fish'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['A']);
            }
        });
        test('Should return document with more matches first', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat'),
                makeDocument('/B', 'cat fish'),
                makeDocument('/C', 'frog'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should return document with more matches first when term appears in all documents', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat cat'),
                makeDocument('/B', 'cat fish'),
                makeDocument('/C', 'frog cat cat'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/C', '/B']);
            }
        });
        test('Should weigh less common term higher', () => {
            for (const docs of permutate([
                makeDocument('/A', 'cat dog cat'),
                makeDocument('/B', 'fish'),
                makeDocument('/C', 'cat cat cat cat'),
                makeDocument('/D', 'cat fish')
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat the dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/C', '/D']);
            }
        });
        test('Should weigh chunks with less common terms higher', () => {
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/B', '/A']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B', '/B']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('cat the dog', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/B', '/A', '/B']);
            }
            for (const docs of permutate([
                makeDocument('/A', ['cat dog cat', 'fish']),
                makeDocument('/B', ['cat cat cat cat dog', 'dog'])
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('lake fish', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A']);
            }
        });
        test('Should ignore case and punctuation', () => {
            for (const docs of permutate([
                makeDocument('/A', 'Cat doG.cat'),
                makeDocument('/B', 'cAt fiSH'),
                makeDocument('/C', 'frOg'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('. ,CaT!  ', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should match on camelCase words', () => {
            for (const docs of permutate([
                makeDocument('/A', 'catDog cat'),
                makeDocument('/B', 'fishCatFish'),
                makeDocument('/C', 'frogcat'),
            ])) {
                const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments(docs);
                const scores = tfidf.calculateScores('catDOG', cancellation_1.CancellationToken.None);
                assertScoreOrdersEqual(scores, ['/A', '/B']);
            }
        });
        test('Should not match document after delete', () => {
            const docA = makeDocument('/A', 'cat dog cat');
            const docB = makeDocument('/B', 'cat fish');
            const docC = makeDocument('/C', 'frog');
            const tfidf = new tfIdf_1.TfIdfCalculator().updateDocuments([docA, docB, docC]);
            let scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/A', '/B']);
            tfidf.deleteDocument(docA.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/B']);
            tfidf.deleteDocument(docC.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, ['/B']);
            tfidf.deleteDocument(docB.key);
            scores = tfidf.calculateScores('cat', cancellation_1.CancellationToken.None);
            assertScoreOrdersEqual(scores, []);
        });
    });
    function makeDocument(key, content) {
        return {
            key,
            textChunks: Array.isArray(content) ? content : [content],
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGZJZGYudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi90ZklkZi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHOzs7O09BSUc7SUFDSCxTQUFTLFNBQVMsQ0FBSSxHQUFRO1FBQzdCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDO1FBRXpCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDckMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLFlBQTBCLEVBQUUsaUJBQTJCO1FBQ3RGLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztJQUNGLENBQUM7SUFFRCxLQUFLLENBQUMsbUJBQW1CLEVBQUU7UUFDMUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxxREFBcUQsRUFBRSxHQUFHLEVBQUU7WUFDaEUsTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUM7WUFDcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUUsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUM3RCxNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ25ELFlBQVksQ0FBQyxHQUFHLEVBQUUsY0FBYyxDQUFDO2FBQ2pDLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hFLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7WUFDL0QsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDO2dCQUNoQyxZQUFZLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQzthQUM3QixDQUFDLEVBQUUsQ0FBQztnQkFDSixNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDM0QsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO2dCQUNqQyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQztnQkFDOUIsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7YUFDMUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEUsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1GQUFtRixFQUFFLEdBQUcsRUFBRTtZQUM5RixLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztnQkFDckMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUM7Z0JBQzlCLFlBQVksQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDO2FBQ2xDLENBQUMsRUFBRSxDQUFDO2dCQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQWUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BFLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDO2dCQUM1QixZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQztnQkFDakMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7Z0JBQzFCLFlBQVksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ3JDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO2FBQzlCLENBQUMsRUFBRSxDQUFDO2dCQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQWUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1lBQzlELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDO2dCQUM1QixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEQsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEUsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDO2dCQUM1QixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEQsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEUsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDM0MsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2xELENBQUMsRUFBRSxDQUFDO2dCQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQWUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVFLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzNDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNsRCxDQUFDLEVBQUUsQ0FBQztnQkFDSixNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUM7Z0JBQzVCLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO2dCQUNqQyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQztnQkFDOUIsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7YUFDMUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUUsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQztnQkFDNUIsWUFBWSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO2dCQUNqQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQzthQUM3QixDQUFDLEVBQUUsQ0FBQztnQkFDSixNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ25ELE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDL0MsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM1QyxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXhDLE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQWUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRSxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUU3QyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUV2QyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUV2QyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsT0FBMEI7UUFDNUQsT0FBTztZQUNOLEdBQUc7WUFDSCxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztTQUN4RCxDQUFDO0lBQ0gsQ0FBQyJ9
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TfIdfCalculator = void 0;
    exports.normalizeTfIdfScores = normalizeTfIdfScores;
    function countMapFrom(values) {
        const map = new Map();
        for (const value of values) {
            map.set(value, (map.get(value) ?? 0) + 1);
        }
        return map;
    }
    /**
     * Implementation of tf-idf (term frequency-inverse document frequency) for a set of
     * documents where each document contains one or more chunks of text.
     * Each document is identified by a key, and the score for each document is computed
     * by taking the max score over all the chunks in the document.
     */
    class TfIdfCalculator {
        constructor() {
            /**
             * Total number of chunks
             */
            this.chunkCount = 0;
            this.chunkOccurrences = new Map();
            this.documents = new Map();
        }
        calculateScores(query, token) {
            const embedding = this.computeEmbedding(query);
            const idfCache = new Map();
            const scores = [];
            // For each document, generate one score
            for (const [key, doc] of this.documents) {
                if (token.isCancellationRequested) {
                    return [];
                }
                for (const chunk of doc.chunks) {
                    const score = this.computeSimilarityScore(chunk, embedding, idfCache);
                    if (score > 0) {
                        scores.push({ key, score });
                    }
                }
            }
            return scores;
        }
        /**
         * Count how many times each term (word) appears in a string.
         */
        static termFrequencies(input) {
            return countMapFrom(TfIdfCalculator.splitTerms(input));
        }
        /**
         * Break a string into terms (words).
         */
        static *splitTerms(input) {
            const normalize = (word) => word.toLowerCase();
            // Only match on words that are at least 3 characters long and start with a letter
            for (const [word] of input.matchAll(/\b\p{Letter}[\p{Letter}\d]{2,}\b/gu)) {
                yield normalize(word);
                const camelParts = word.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/g);
                if (camelParts.length > 1) {
                    for (const part of camelParts) {
                        // Require at least 3 letters in the parts of a camel case word
                        if (part.length > 2 && /\p{Letter}{3,}/gu.test(part)) {
                            yield normalize(part);
                        }
                    }
                }
            }
        }
        updateDocuments(documents) {
            for (const { key } of documents) {
                this.deleteDocument(key);
            }
            for (const doc of documents) {
                const chunks = [];
                for (const text of doc.textChunks) {
                    // TODO: See if we can compute the tf lazily
                    // The challenge is that we need to also update the `chunkOccurrences`
                    // and all of those updates need to get flushed before the real TF-IDF of
                    // anything is computed.
                    const tf = TfIdfCalculator.termFrequencies(text);
                    // Update occurrences list
                    for (const term of tf.keys()) {
                        this.chunkOccurrences.set(term, (this.chunkOccurrences.get(term) ?? 0) + 1);
                    }
                    chunks.push({ text, tf });
                }
                this.chunkCount += chunks.length;
                this.documents.set(doc.key, { chunks });
            }
            return this;
        }
        deleteDocument(key) {
            const doc = this.documents.get(key);
            if (!doc) {
                return;
            }
            this.documents.delete(key);
            this.chunkCount -= doc.chunks.length;
            // Update term occurrences for the document
            for (const chunk of doc.chunks) {
                for (const term of chunk.tf.keys()) {
                    const currentOccurrences = this.chunkOccurrences.get(term);
                    if (typeof currentOccurrences === 'number') {
                        const newOccurrences = currentOccurrences - 1;
                        if (newOccurrences <= 0) {
                            this.chunkOccurrences.delete(term);
                        }
                        else {
                            this.chunkOccurrences.set(term, newOccurrences);
                        }
                    }
                }
            }
        }
        computeSimilarityScore(chunk, queryEmbedding, idfCache) {
            // Compute the dot product between the chunk's embedding and the query embedding
            // Note that the chunk embedding is computed lazily on a per-term basis.
            // This lets us skip a large number of calculations because the majority
            // of chunks do not share any terms with the query.
            let sum = 0;
            for (const [term, termTfidf] of Object.entries(queryEmbedding)) {
                const chunkTf = chunk.tf.get(term);
                if (!chunkTf) {
                    // Term does not appear in chunk so it has no contribution
                    continue;
                }
                let chunkIdf = idfCache.get(term);
                if (typeof chunkIdf !== 'number') {
                    chunkIdf = this.computeIdf(term);
                    idfCache.set(term, chunkIdf);
                }
                const chunkTfidf = chunkTf * chunkIdf;
                sum += chunkTfidf * termTfidf;
            }
            return sum;
        }
        computeEmbedding(input) {
            const tf = TfIdfCalculator.termFrequencies(input);
            return this.computeTfidf(tf);
        }
        computeIdf(term) {
            const chunkOccurrences = this.chunkOccurrences.get(term) ?? 0;
            return chunkOccurrences > 0
                ? Math.log((this.chunkCount + 1) / chunkOccurrences)
                : 0;
        }
        computeTfidf(termFrequencies) {
            const embedding = Object.create(null);
            for (const [word, occurrences] of termFrequencies) {
                const idf = this.computeIdf(word);
                if (idf > 0) {
                    embedding[word] = occurrences * idf;
                }
            }
            return embedding;
        }
    }
    exports.TfIdfCalculator = TfIdfCalculator;
    /**
     * Normalize the scores to be between 0 and 1 and sort them decending.
     * @param scores array of scores from {@link TfIdfCalculator.calculateScores}
     * @returns normalized scores
     */
    function normalizeTfIdfScores(scores) {
        // copy of scores
        const result = scores.slice(0);
        // sort descending
        result.sort((a, b) => b.score - a.score);
        // normalize
        const max = result[0]?.score ?? 0;
        if (max > 0) {
            for (const score of result) {
                score.score /= max;
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGZJZGYuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3RmSWRmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJOaEcsb0RBaUJDO0lBcE9ELFNBQVMsWUFBWSxDQUFJLE1BQW1CO1FBQzNDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7UUFDakMsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUM1QixHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQTRCRDs7Ozs7T0FLRztJQUNILE1BQWEsZUFBZTtRQUE1QjtZQW1EQzs7ZUFFRztZQUNLLGVBQVUsR0FBRyxDQUFDLENBQUM7WUFFTixxQkFBZ0IsR0FBd0IsSUFBSSxHQUFHLEVBQXFELENBQUM7WUFFckcsY0FBUyxHQUFHLElBQUksR0FBRyxFQUVoQyxDQUFDO1FBd0dOLENBQUM7UUFuS0EsZUFBZSxDQUFDLEtBQWEsRUFBRSxLQUF3QjtZQUN0RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDM0MsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztZQUNoQyx3Q0FBd0M7WUFDeEMsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztv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
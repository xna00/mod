/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/filters", "vs/base/common/hash", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, comparers_1, filters_1, hash_1, path_1, platform_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scoreFuzzy = scoreFuzzy;
    exports.scoreFuzzy2 = scoreFuzzy2;
    exports.scoreItemFuzzy = scoreItemFuzzy;
    exports.compareItemsByFuzzyScore = compareItemsByFuzzyScore;
    exports.prepareQuery = prepareQuery;
    exports.pieceToQuery = pieceToQuery;
    const NO_MATCH = 0;
    const NO_SCORE = [NO_MATCH, []];
    // const DEBUG = true;
    // const DEBUG_MATRIX = false;
    function scoreFuzzy(target, query, queryLower, allowNonContiguousMatches) {
        if (!target || !query) {
            return NO_SCORE; // return early if target or query are undefined
        }
        const targetLength = target.length;
        const queryLength = query.length;
        if (targetLength < queryLength) {
            return NO_SCORE; // impossible for query to be contained in target
        }
        // if (DEBUG) {
        // 	console.group(`Target: ${target}, Query: ${query}`);
        // }
        const targetLower = target.toLowerCase();
        const res = doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength, allowNonContiguousMatches);
        // if (DEBUG) {
        // 	console.log(`%cFinal Score: ${res[0]}`, 'font-weight: bold');
        // 	console.groupEnd();
        // }
        return res;
    }
    function doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength, allowNonContiguousMatches) {
        const scores = [];
        const matches = [];
        //
        // Build Scorer Matrix:
        //
        // The matrix is composed of query q and target t. For each index we score
        // q[i] with t[i] and compare that with the previous score. If the score is
        // equal or larger, we keep the match. In addition to the score, we also keep
        // the length of the consecutive matches to use as boost for the score.
        //
        //      t   a   r   g   e   t
        //  q
        //  u
        //  e
        //  r
        //  y
        //
        for (let queryIndex = 0; queryIndex < queryLength; queryIndex++) {
            const queryIndexOffset = queryIndex * targetLength;
            const queryIndexPreviousOffset = queryIndexOffset - targetLength;
            const queryIndexGtNull = queryIndex > 0;
            const queryCharAtIndex = query[queryIndex];
            const queryLowerCharAtIndex = queryLower[queryIndex];
            for (let targetIndex = 0; targetIndex < targetLength; targetIndex++) {
                const targetIndexGtNull = targetIndex > 0;
                const currentIndex = queryIndexOffset + targetIndex;
                const leftIndex = currentIndex - 1;
                const diagIndex = queryIndexPreviousOffset + targetIndex - 1;
                const leftScore = targetIndexGtNull ? scores[leftIndex] : 0;
                const diagScore = queryIndexGtNull && targetIndexGtNull ? scores[diagIndex] : 0;
                const matchesSequenceLength = queryIndexGtNull && targetIndexGtNull ? matches[diagIndex] : 0;
                // If we are not matching on the first query character any more, we only produce a
                // score if we had a score previously for the last query index (by looking at the diagScore).
                // This makes sure that the query always matches in sequence on the target. For example
                // given a target of "ede" and a query of "de", we would otherwise produce a wrong high score
                // for query[1] ("e") matching on target[0] ("e") because of the "beginning of word" boost.
                let score;
                if (!diagScore && queryIndexGtNull) {
                    score = 0;
                }
                else {
                    score = computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength);
                }
                // We have a score and its equal or larger than the left score
                // Match: sequence continues growing from previous diag value
                // Score: increases by diag score value
                const isValidScore = score && diagScore + score >= leftScore;
                if (isValidScore && (
                // We don't need to check if it's contiguous if we allow non-contiguous matches
                allowNonContiguousMatches ||
                    // We must be looking for a contiguous match.
                    // Looking at an index higher than 0 in the query means we must have already
                    // found out this is contiguous otherwise there wouldn't have been a score
                    queryIndexGtNull ||
                    // lastly check if the query is completely contiguous at this index in the target
                    targetLower.startsWith(queryLower, targetIndex))) {
                    matches[currentIndex] = matchesSequenceLength + 1;
                    scores[currentIndex] = diagScore + score;
                }
                // We either have no score or the score is lower than the left score
                // Match: reset to 0
                // Score: pick up from left hand side
                else {
                    matches[currentIndex] = NO_MATCH;
                    scores[currentIndex] = leftScore;
                }
            }
        }
        // Restore Positions (starting from bottom right of matrix)
        const positions = [];
        let queryIndex = queryLength - 1;
        let targetIndex = targetLength - 1;
        while (queryIndex >= 0 && targetIndex >= 0) {
            const currentIndex = queryIndex * targetLength + targetIndex;
            const match = matches[currentIndex];
            if (match === NO_MATCH) {
                targetIndex--; // go left
            }
            else {
                positions.push(targetIndex);
                // go up and left
                queryIndex--;
                targetIndex--;
            }
        }
        // Print matrix
        // if (DEBUG_MATRIX) {
        // 	printMatrix(query, target, matches, scores);
        // }
        return [scores[queryLength * targetLength - 1], positions.reverse()];
    }
    function computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength) {
        let score = 0;
        if (!considerAsEqual(queryLowerCharAtIndex, targetLower[targetIndex])) {
            return score; // no match of characters
        }
        // if (DEBUG) {
        // 	console.groupCollapsed(`%cFound a match of char: ${queryLowerCharAtIndex} at index ${targetIndex}`, 'font-weight: normal');
        // }
        // Character match bonus
        score += 1;
        // if (DEBUG) {
        // 	console.log(`%cCharacter match bonus: +1`, 'font-weight: normal');
        // }
        // Consecutive match bonus
        if (matchesSequenceLength > 0) {
            score += (matchesSequenceLength * 5);
            // if (DEBUG) {
            // 	console.log(`Consecutive match bonus: +${matchesSequenceLength * 5}`);
            // }
        }
        // Same case bonus
        if (queryCharAtIndex === target[targetIndex]) {
            score += 1;
            // if (DEBUG) {
            // 	console.log('Same case bonus: +1');
            // }
        }
        // Start of word bonus
        if (targetIndex === 0) {
            score += 8;
            // if (DEBUG) {
            // 	console.log('Start of word bonus: +8');
            // }
        }
        else {
            // After separator bonus
            const separatorBonus = scoreSeparatorAtPos(target.charCodeAt(targetIndex - 1));
            if (separatorBonus) {
                score += separatorBonus;
                // if (DEBUG) {
                // 	console.log(`After separator bonus: +${separatorBonus}`);
                // }
            }
            // Inside word upper case bonus (camel case). We only give this bonus if we're not in a contiguous sequence.
            // For example:
            // NPE => NullPointerException = boost
            // HTTP => HTTP = not boost
            else if ((0, filters_1.isUpper)(target.charCodeAt(targetIndex)) && matchesSequenceLength === 0) {
                score += 2;
                // if (DEBUG) {
                // 	console.log('Inside word upper case bonus: +2');
                // }
            }
        }
        // if (DEBUG) {
        // 	console.log(`Total score: ${score}`);
        // 	console.groupEnd();
        // }
        return score;
    }
    function considerAsEqual(a, b) {
        if (a === b) {
            return true;
        }
        // Special case path separators: ignore platform differences
        if (a === '/' || a === '\\') {
            return b === '/' || b === '\\';
        }
        return false;
    }
    function scoreSeparatorAtPos(charCode) {
        switch (charCode) {
            case 47 /* CharCode.Slash */:
            case 92 /* CharCode.Backslash */:
                return 5; // prefer path separators...
            case 95 /* CharCode.Underline */:
            case 45 /* CharCode.Dash */:
            case 46 /* CharCode.Period */:
            case 32 /* CharCode.Space */:
            case 39 /* CharCode.SingleQuote */:
            case 34 /* CharCode.DoubleQuote */:
            case 58 /* CharCode.Colon */:
                return 4; // ...over other separators
            default:
                return 0;
        }
    }
    const NO_SCORE2 = [undefined, []];
    function scoreFuzzy2(target, query, patternStart = 0, wordStart = 0) {
        // Score: multiple inputs
        const preparedQuery = query;
        if (preparedQuery.values && preparedQuery.values.length > 1) {
            return doScoreFuzzy2Multiple(target, preparedQuery.values, patternStart, wordStart);
        }
        // Score: single input
        return doScoreFuzzy2Single(target, query, patternStart, wordStart);
    }
    function doScoreFuzzy2Multiple(target, query, patternStart, wordStart) {
        let totalScore = 0;
        const totalMatches = [];
        for (const queryPiece of query) {
            const [score, matches] = doScoreFuzzy2Single(target, queryPiece, patternStart, wordStart);
            if (typeof score !== 'number') {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_SCORE2;
            }
            totalScore += score;
            totalMatches.push(...matches);
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return [totalScore, normalizeMatches(totalMatches)];
    }
    function doScoreFuzzy2Single(target, query, patternStart, wordStart) {
        const score = (0, filters_1.fuzzyScore)(query.original, query.originalLowercase, patternStart, target, target.toLowerCase(), wordStart, { firstMatchCanBeWeak: true, boostFullMatch: true });
        if (!score) {
            return NO_SCORE2;
        }
        return [score[0], (0, filters_1.createMatches)(score)];
    }
    const NO_ITEM_SCORE = Object.freeze({ score: 0 });
    const PATH_IDENTITY_SCORE = 1 << 18;
    const LABEL_PREFIX_SCORE_THRESHOLD = 1 << 17;
    const LABEL_SCORE_THRESHOLD = 1 << 16;
    function getCacheHash(label, description, allowNonContiguousMatches, query) {
        const values = query.values ? query.values : [query];
        const cacheHash = (0, hash_1.hash)({
            [query.normalized]: {
                values: values.map(v => ({ value: v.normalized, expectContiguousMatch: v.expectContiguousMatch })),
                label,
                description,
                allowNonContiguousMatches
            }
        });
        return cacheHash;
    }
    function scoreItemFuzzy(item, query, allowNonContiguousMatches, accessor, cache) {
        if (!item || !query.normalized) {
            return NO_ITEM_SCORE; // we need an item and query to score on at least
        }
        const label = accessor.getItemLabel(item);
        if (!label) {
            return NO_ITEM_SCORE; // we need a label at least
        }
        const description = accessor.getItemDescription(item);
        // in order to speed up scoring, we cache the score with a unique hash based on:
        // - label
        // - description (if provided)
        // - whether non-contiguous matching is enabled or not
        // - hash of the query (normalized) values
        const cacheHash = getCacheHash(label, description, allowNonContiguousMatches, query);
        const cached = cache[cacheHash];
        if (cached) {
            return cached;
        }
        const itemScore = doScoreItemFuzzy(label, description, accessor.getItemPath(item), query, allowNonContiguousMatches);
        cache[cacheHash] = itemScore;
        return itemScore;
    }
    function doScoreItemFuzzy(label, description, path, query, allowNonContiguousMatches) {
        const preferLabelMatches = !path || !query.containsPathSeparator;
        // Treat identity matches on full path highest
        if (path && (platform_1.isLinux ? query.pathNormalized === path : (0, strings_1.equalsIgnoreCase)(query.pathNormalized, path))) {
            return { score: PATH_IDENTITY_SCORE, labelMatch: [{ start: 0, end: label.length }], descriptionMatch: description ? [{ start: 0, end: description.length }] : undefined };
        }
        // Score: multiple inputs
        if (query.values && query.values.length > 1) {
            return doScoreItemFuzzyMultiple(label, description, path, query.values, preferLabelMatches, allowNonContiguousMatches);
        }
        // Score: single input
        return doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, allowNonContiguousMatches);
    }
    function doScoreItemFuzzyMultiple(label, description, path, query, preferLabelMatches, allowNonContiguousMatches) {
        let totalScore = 0;
        const totalLabelMatches = [];
        const totalDescriptionMatches = [];
        for (const queryPiece of query) {
            const { score, labelMatch, descriptionMatch } = doScoreItemFuzzySingle(label, description, path, queryPiece, preferLabelMatches, allowNonContiguousMatches);
            if (score === NO_MATCH) {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_ITEM_SCORE;
            }
            totalScore += score;
            if (labelMatch) {
                totalLabelMatches.push(...labelMatch);
            }
            if (descriptionMatch) {
                totalDescriptionMatches.push(...descriptionMatch);
            }
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return {
            score: totalScore,
            labelMatch: normalizeMatches(totalLabelMatches),
            descriptionMatch: normalizeMatches(totalDescriptionMatches)
        };
    }
    function doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, allowNonContiguousMatches) {
        // Prefer label matches if told so or we have no description
        if (preferLabelMatches || !description) {
            const [labelScore, labelPositions] = scoreFuzzy(label, query.normalized, query.normalizedLowercase, allowNonContiguousMatches && !query.expectContiguousMatch);
            if (labelScore) {
                // If we have a prefix match on the label, we give a much
                // higher baseScore to elevate these matches over others
                // This ensures that typing a file name wins over results
                // that are present somewhere in the label, but not the
                // beginning.
                const labelPrefixMatch = (0, filters_1.matchesPrefix)(query.normalized, label);
                let baseScore;
                if (labelPrefixMatch) {
                    baseScore = LABEL_PREFIX_SCORE_THRESHOLD;
                    // We give another boost to labels that are short, e.g. given
                    // files "window.ts" and "windowActions.ts" and a query of
                    // "window", we want "window.ts" to receive a higher score.
                    // As such we compute the percentage the query has within the
                    // label and add that to the baseScore.
                    const prefixLengthBoost = Math.round((query.normalized.length / label.length) * 100);
                    baseScore += prefixLengthBoost;
                }
                else {
                    baseScore = LABEL_SCORE_THRESHOLD;
                }
                return { score: baseScore + labelScore, labelMatch: labelPrefixMatch || createMatches(labelPositions) };
            }
        }
        // Finally compute description + label scores if we have a description
        if (description) {
            let descriptionPrefix = description;
            if (!!path) {
                descriptionPrefix = `${description}${path_1.sep}`; // assume this is a file path
            }
            const descriptionPrefixLength = descriptionPrefix.length;
            const descriptionAndLabel = `${descriptionPrefix}${label}`;
            const [labelDescriptionScore, labelDescriptionPositions] = scoreFuzzy(descriptionAndLabel, query.normalized, query.normalizedLowercase, allowNonContiguousMatches && !query.expectContiguousMatch);
            if (labelDescriptionScore) {
                const labelDescriptionMatches = createMatches(labelDescriptionPositions);
                const labelMatch = [];
                const descriptionMatch = [];
                // We have to split the matches back onto the label and description portions
                labelDescriptionMatches.forEach(h => {
                    // Match overlaps label and description part, we need to split it up
                    if (h.start < descriptionPrefixLength && h.end > descriptionPrefixLength) {
                        labelMatch.push({ start: 0, end: h.end - descriptionPrefixLength });
                        descriptionMatch.push({ start: h.start, end: descriptionPrefixLength });
                    }
                    // Match on label part
                    else if (h.start >= descriptionPrefixLength) {
                        labelMatch.push({ start: h.start - descriptionPrefixLength, end: h.end - descriptionPrefixLength });
                    }
                    // Match on description part
                    else {
                        descriptionMatch.push(h);
                    }
                });
                return { score: labelDescriptionScore, labelMatch, descriptionMatch };
            }
        }
        return NO_ITEM_SCORE;
    }
    function createMatches(offsets) {
        const ret = [];
        if (!offsets) {
            return ret;
        }
        let last;
        for (const pos of offsets) {
            if (last && last.end === pos) {
                last.end += 1;
            }
            else {
                last = { start: pos, end: pos + 1 };
                ret.push(last);
            }
        }
        return ret;
    }
    function normalizeMatches(matches) {
        // sort matches by start to be able to normalize
        const sortedMatches = matches.sort((matchA, matchB) => {
            return matchA.start - matchB.start;
        });
        // merge matches that overlap
        const normalizedMatches = [];
        let currentMatch = undefined;
        for (const match of sortedMatches) {
            // if we have no current match or the matches
            // do not overlap, we take it as is and remember
            // it for future merging
            if (!currentMatch || !matchOverlaps(currentMatch, match)) {
                currentMatch = match;
                normalizedMatches.push(match);
            }
            // otherwise we merge the matches
            else {
                currentMatch.start = Math.min(currentMatch.start, match.start);
                currentMatch.end = Math.max(currentMatch.end, match.end);
            }
        }
        return normalizedMatches;
    }
    function matchOverlaps(matchA, matchB) {
        if (matchA.end < matchB.start) {
            return false; // A ends before B starts
        }
        if (matchB.end < matchA.start) {
            return false; // B ends before A starts
        }
        return true;
    }
    //#endregion
    //#region Comparers
    function compareItemsByFuzzyScore(itemA, itemB, query, allowNonContiguousMatches, accessor, cache) {
        const itemScoreA = scoreItemFuzzy(itemA, query, allowNonContiguousMatches, accessor, cache);
        const itemScoreB = scoreItemFuzzy(itemB, query, allowNonContiguousMatches, accessor, cache);
        const scoreA = itemScoreA.score;
        const scoreB = itemScoreB.score;
        // 1.) identity matches have highest score
        if (scoreA === PATH_IDENTITY_SCORE || scoreB === PATH_IDENTITY_SCORE) {
            if (scoreA !== scoreB) {
                return scoreA === PATH_IDENTITY_SCORE ? -1 : 1;
            }
        }
        // 2.) matches on label are considered higher compared to label+description matches
        if (scoreA > LABEL_SCORE_THRESHOLD || scoreB > LABEL_SCORE_THRESHOLD) {
            if (scoreA !== scoreB) {
                return scoreA > scoreB ? -1 : 1;
            }
            // prefer more compact matches over longer in label (unless this is a prefix match where
            // longer prefix matches are actually preferred)
            if (scoreA < LABEL_PREFIX_SCORE_THRESHOLD && scoreB < LABEL_PREFIX_SCORE_THRESHOLD) {
                const comparedByMatchLength = compareByMatchLength(itemScoreA.labelMatch, itemScoreB.labelMatch);
                if (comparedByMatchLength !== 0) {
                    return comparedByMatchLength;
                }
            }
            // prefer shorter labels over longer labels
            const labelA = accessor.getItemLabel(itemA) || '';
            const labelB = accessor.getItemLabel(itemB) || '';
            if (labelA.length !== labelB.length) {
                return labelA.length - labelB.length;
            }
        }
        // 3.) compare by score in label+description
        if (scoreA !== scoreB) {
            return scoreA > scoreB ? -1 : 1;
        }
        // 4.) scores are identical: prefer matches in label over non-label matches
        const itemAHasLabelMatches = Array.isArray(itemScoreA.labelMatch) && itemScoreA.labelMatch.length > 0;
        const itemBHasLabelMatches = Array.isArray(itemScoreB.labelMatch) && itemScoreB.labelMatch.length > 0;
        if (itemAHasLabelMatches && !itemBHasLabelMatches) {
            return -1;
        }
        else if (itemBHasLabelMatches && !itemAHasLabelMatches) {
            return 1;
        }
        // 5.) scores are identical: prefer more compact matches (label and description)
        const itemAMatchDistance = computeLabelAndDescriptionMatchDistance(itemA, itemScoreA, accessor);
        const itemBMatchDistance = computeLabelAndDescriptionMatchDistance(itemB, itemScoreB, accessor);
        if (itemAMatchDistance && itemBMatchDistance && itemAMatchDistance !== itemBMatchDistance) {
            return itemBMatchDistance > itemAMatchDistance ? -1 : 1;
        }
        // 6.) scores are identical: start to use the fallback compare
        return fallbackCompare(itemA, itemB, query, accessor);
    }
    function computeLabelAndDescriptionMatchDistance(item, score, accessor) {
        let matchStart = -1;
        let matchEnd = -1;
        // If we have description matches, the start is first of description match
        if (score.descriptionMatch && score.descriptionMatch.length) {
            matchStart = score.descriptionMatch[0].start;
        }
        // Otherwise, the start is the first label match
        else if (score.labelMatch && score.labelMatch.length) {
            matchStart = score.labelMatch[0].start;
        }
        // If we have label match, the end is the last label match
        // If we had a description match, we add the length of the description
        // as offset to the end to indicate this.
        if (score.labelMatch && score.labelMatch.length) {
            matchEnd = score.labelMatch[score.labelMatch.length - 1].end;
            if (score.descriptionMatch && score.descriptionMatch.length) {
                const itemDescription = accessor.getItemDescription(item);
                if (itemDescription) {
                    matchEnd += itemDescription.length;
                }
            }
        }
        // If we have just a description match, the end is the last description match
        else if (score.descriptionMatch && score.descriptionMatch.length) {
            matchEnd = score.descriptionMatch[score.descriptionMatch.length - 1].end;
        }
        return matchEnd - matchStart;
    }
    function compareByMatchLength(matchesA, matchesB) {
        if ((!matchesA && !matchesB) || ((!matchesA || !matchesA.length) && (!matchesB || !matchesB.length))) {
            return 0; // make sure to not cause bad comparing when matches are not provided
        }
        if (!matchesB || !matchesB.length) {
            return -1;
        }
        if (!matchesA || !matchesA.length) {
            return 1;
        }
        // Compute match length of A (first to last match)
        const matchStartA = matchesA[0].start;
        const matchEndA = matchesA[matchesA.length - 1].end;
        const matchLengthA = matchEndA - matchStartA;
        // Compute match length of B (first to last match)
        const matchStartB = matchesB[0].start;
        const matchEndB = matchesB[matchesB.length - 1].end;
        const matchLengthB = matchEndB - matchStartB;
        // Prefer shorter match length
        return matchLengthA === matchLengthB ? 0 : matchLengthB < matchLengthA ? 1 : -1;
    }
    function fallbackCompare(itemA, itemB, query, accessor) {
        // check for label + description length and prefer shorter
        const labelA = accessor.getItemLabel(itemA) || '';
        const labelB = accessor.getItemLabel(itemB) || '';
        const descriptionA = accessor.getItemDescription(itemA);
        const descriptionB = accessor.getItemDescription(itemB);
        const labelDescriptionALength = labelA.length + (descriptionA ? descriptionA.length : 0);
        const labelDescriptionBLength = labelB.length + (descriptionB ? descriptionB.length : 0);
        if (labelDescriptionALength !== labelDescriptionBLength) {
            return labelDescriptionALength - labelDescriptionBLength;
        }
        // check for path length and prefer shorter
        const pathA = accessor.getItemPath(itemA);
        const pathB = accessor.getItemPath(itemB);
        if (pathA && pathB && pathA.length !== pathB.length) {
            return pathA.length - pathB.length;
        }
        // 7.) finally we have equal scores and equal length, we fallback to comparer
        // compare by label
        if (labelA !== labelB) {
            return (0, comparers_1.compareAnything)(labelA, labelB, query.normalized);
        }
        // compare by description
        if (descriptionA && descriptionB && descriptionA !== descriptionB) {
            return (0, comparers_1.compareAnything)(descriptionA, descriptionB, query.normalized);
        }
        // compare by path
        if (pathA && pathB && pathA !== pathB) {
            return (0, comparers_1.compareAnything)(pathA, pathB, query.normalized);
        }
        // equal
        return 0;
    }
    /*
     * If a query is wrapped in quotes, the user does not want to
     * use fuzzy search for this query.
     */
    function queryExpectsExactMatch(query) {
        return query.startsWith('"') && query.endsWith('"');
    }
    /**
     * Helper function to prepare a search value for scoring by removing unwanted characters
     * and allowing to score on multiple pieces separated by whitespace character.
     */
    const MULTIPLE_QUERY_VALUES_SEPARATOR = ' ';
    function prepareQuery(original) {
        if (typeof original !== 'string') {
            original = '';
        }
        const originalLowercase = original.toLowerCase();
        const { pathNormalized, normalized, normalizedLowercase } = normalizeQuery(original);
        const containsPathSeparator = pathNormalized.indexOf(path_1.sep) >= 0;
        const expectExactMatch = queryExpectsExactMatch(original);
        let values = undefined;
        const originalSplit = original.split(MULTIPLE_QUERY_VALUES_SEPARATOR);
        if (originalSplit.length > 1) {
            for (const originalPiece of originalSplit) {
                const expectExactMatchPiece = queryExpectsExactMatch(originalPiece);
                const { pathNormalized: pathNormalizedPiece, normalized: normalizedPiece, normalizedLowercase: normalizedLowercasePiece } = normalizeQuery(originalPiece);
                if (normalizedPiece) {
                    if (!values) {
                        values = [];
                    }
                    values.push({
                        original: originalPiece,
                        originalLowercase: originalPiece.toLowerCase(),
                        pathNormalized: pathNormalizedPiece,
                        normalized: normalizedPiece,
                        normalizedLowercase: normalizedLowercasePiece,
                        expectContiguousMatch: expectExactMatchPiece
                    });
                }
            }
        }
        return { original, originalLowercase, pathNormalized, normalized, normalizedLowercase, values, containsPathSeparator, expectContiguousMatch: expectExactMatch };
    }
    function normalizeQuery(original) {
        let pathNormalized;
        if (platform_1.isWindows) {
            pathNormalized = original.replace(/\//g, path_1.sep); // Help Windows users to search for paths when using slash
        }
        else {
            pathNormalized = original.replace(/\\/g, path_1.sep); // Help macOS/Linux users to search for paths when using backslash
        }
        // we remove quotes here because quotes are used for exact match search
        const normalized = (0, strings_1.stripWildcards)(pathNormalized).replace(/\s|"/g, '');
        return {
            pathNormalized,
            normalized,
            normalizedLowercase: normalized.toLowerCase()
        };
    }
    function pieceToQuery(arg1) {
        if (Array.isArray(arg1)) {
            return prepareQuery(arg1.map(piece => piece.original).join(MULTIPLE_QUERY_VALUES_SEPARATOR));
        }
        return prepareQuery(arg1.original);
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnV6enlTY29yZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2Z1enp5U2NvcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyxnQ0F5QkM7SUErT0Qsa0NBVUM7SUErRkQsd0NBMkJDO0lBd01ELDREQTREQztJQTBLRCxvQ0F3Q0M7SUFzQkQsb0NBTUM7SUFwNEJELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNuQixNQUFNLFFBQVEsR0FBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUU1QyxzQkFBc0I7SUFDdEIsOEJBQThCO0lBRTlCLFNBQWdCLFVBQVUsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLFVBQWtCLEVBQUUseUJBQWtDO1FBQy9HLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixPQUFPLFFBQVEsQ0FBQyxDQUFDLGdEQUFnRDtRQUNsRSxDQUFDO1FBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBRWpDLElBQUksWUFBWSxHQUFHLFdBQVcsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sUUFBUSxDQUFDLENBQUMsaURBQWlEO1FBQ25FLENBQUM7UUFFRCxlQUFlO1FBQ2Ysd0RBQXdEO1FBQ3hELElBQUk7UUFFSixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDekMsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLHlCQUF5QixDQUFDLENBQUM7UUFFdkgsZUFBZTtRQUNmLGlFQUFpRTtR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
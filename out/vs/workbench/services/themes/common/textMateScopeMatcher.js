/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMatchers = createMatchers;
    function createMatchers(selector, matchesName, results) {
        const tokenizer = newTokenizer(selector);
        let token = tokenizer.next();
        while (token !== null) {
            let priority = 0;
            if (token.length === 2 && token.charAt(1) === ':') {
                switch (token.charAt(0)) {
                    case 'R':
                        priority = 1;
                        break;
                    case 'L':
                        priority = -1;
                        break;
                    default:
                        console.log(`Unknown priority ${token} in scope selector`);
                }
                token = tokenizer.next();
            }
            const matcher = parseConjunction();
            if (matcher) {
                results.push({ matcher, priority });
            }
            if (token !== ',') {
                break;
            }
            token = tokenizer.next();
        }
        function parseOperand() {
            if (token === '-') {
                token = tokenizer.next();
                const expressionToNegate = parseOperand();
                if (!expressionToNegate) {
                    return null;
                }
                return matcherInput => {
                    const score = expressionToNegate(matcherInput);
                    return score < 0 ? 0 : -1;
                };
            }
            if (token === '(') {
                token = tokenizer.next();
                const expressionInParents = parseInnerExpression();
                if (token === ')') {
                    token = tokenizer.next();
                }
                return expressionInParents;
            }
            if (isIdentifier(token)) {
                const identifiers = [];
                do {
                    identifiers.push(token);
                    token = tokenizer.next();
                } while (isIdentifier(token));
                return matcherInput => matchesName(identifiers, matcherInput);
            }
            return null;
        }
        function parseConjunction() {
            let matcher = parseOperand();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                matcher = parseOperand();
            }
            return matcherInput => {
                let min = matchers[0](matcherInput);
                for (let i = 1; min >= 0 && i < matchers.length; i++) {
                    min = Math.min(min, matchers[i](matcherInput));
                }
                return min;
            };
        }
        function parseInnerExpression() {
            let matcher = parseConjunction();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                if (token === '|' || token === ',') {
                    do {
                        token = tokenizer.next();
                    } while (token === '|' || token === ','); // ignore subsequent commas
                }
                else {
                    break;
                }
                matcher = parseConjunction();
            }
            return matcherInput => {
                let max = matchers[0](matcherInput);
                for (let i = 1; i < matchers.length; i++) {
                    max = Math.max(max, matchers[i](matcherInput));
                }
                return max;
            };
        }
    }
    function isIdentifier(token) {
        return !!token && !!token.match(/[\w\.:]+/);
    }
    function newTokenizer(input) {
        const regex = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g;
        let match = regex.exec(input);
        return {
            next: () => {
                if (!match) {
                    return null;
                }
                const res = match[0];
                match = regex.exec(input);
                return res;
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVTY29wZU1hdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL3RleHRNYXRlU2NvcGVNYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOztJQUVoRyxZQUFZLENBQUM7O0lBV2Isd0NBa0dDO0lBbEdELFNBQWdCLGNBQWMsQ0FBSSxRQUFnQixFQUFFLFdBQXlELEVBQUUsT0FBaUM7UUFDL0ksTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3QixPQUFPLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN2QixJQUFJLFFBQVEsR0FBZSxDQUFDLENBQUM7WUFDN0IsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNuRCxRQUFRLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDekIsS0FBSyxHQUFHO3dCQUFFLFFBQVEsR0FBRyxDQUFDLENBQUM7d0JBQUMsTUFBTTtvQkFDOUIsS0FBSyxHQUFHO3dCQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxNQUFNO29CQUMvQjt3QkFDQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixLQUFLLG9CQUFvQixDQUFDLENBQUM7Z0JBQzdELENBQUM7Z0JBQ0QsS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQyxJQUFJLE9B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
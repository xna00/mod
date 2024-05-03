/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, json_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SmartSnippetInserter = void 0;
    class SmartSnippetInserter {
        static hasOpenBrace(scanner) {
            while (scanner.scan() !== 17 /* JSONSyntaxKind.EOF */) {
                const kind = scanner.getToken();
                if (kind === 1 /* JSONSyntaxKind.OpenBraceToken */) {
                    return true;
                }
            }
            return false;
        }
        static offsetToPosition(model, offset) {
            let offsetBeforeLine = 0;
            const eolLength = model.getEOL().length;
            const lineCount = model.getLineCount();
            for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
                const lineTotalLength = model.getLineLength(lineNumber) + eolLength;
                const offsetAfterLine = offsetBeforeLine + lineTotalLength;
                if (offsetAfterLine > offset) {
                    return new position_1.Position(lineNumber, offset - offsetBeforeLine + 1);
                }
                offsetBeforeLine = offsetAfterLine;
            }
            return new position_1.Position(lineCount, model.getLineMaxColumn(lineCount));
        }
        static insertSnippet(model, _position) {
            const desiredPosition = model.getValueLengthInRange(new range_1.Range(1, 1, _position.lineNumber, _position.column));
            // <INVALID> [ <BEFORE_OBJECT> { <INVALID> } <AFTER_OBJECT>, <BEFORE_OBJECT> { <INVALID> } <AFTER_OBJECT> ] <INVALID>
            let State;
            (function (State) {
                State[State["INVALID"] = 0] = "INVALID";
                State[State["AFTER_OBJECT"] = 1] = "AFTER_OBJECT";
                State[State["BEFORE_OBJECT"] = 2] = "BEFORE_OBJECT";
            })(State || (State = {}));
            let currentState = State.INVALID;
            let lastValidPos = -1;
            let lastValidState = State.INVALID;
            const scanner = (0, json_1.createScanner)(model.getValue());
            let arrayLevel = 0;
            let objLevel = 0;
            const checkRangeStatus = (pos, state) => {
                if (state !== State.INVALID && arrayLevel === 1 && objLevel === 0) {
                    currentState = state;
                    lastValidPos = pos;
                    lastValidState = state;
                }
                else {
                    if (currentState !== State.INVALID) {
                        currentState = State.INVALID;
                        lastValidPos = scanner.getTokenOffset();
                    }
                }
            };
            while (scanner.scan() !== 17 /* JSONSyntaxKind.EOF */) {
                const currentPos = scanner.getPosition();
                const kind = scanner.getToken();
                let goodKind = false;
                switch (kind) {
                    case 3 /* JSONSyntaxKind.OpenBracketToken */:
                        goodKind = true;
                        arrayLevel++;
                        checkRangeStatus(currentPos, State.BEFORE_OBJECT);
                        break;
                    case 4 /* JSONSyntaxKind.CloseBracketToken */:
                        goodKind = true;
                        arrayLevel--;
                        checkRangeStatus(currentPos, State.INVALID);
                        break;
                    case 5 /* JSONSyntaxKind.CommaToken */:
                        goodKind = true;
                        checkRangeStatus(currentPos, State.BEFORE_OBJECT);
                        break;
                    case 1 /* JSONSyntaxKind.OpenBraceToken */:
                        goodKind = true;
                        objLevel++;
                        checkRangeStatus(currentPos, State.INVALID);
                        break;
                    case 2 /* JSONSyntaxKind.CloseBraceToken */:
                        goodKind = true;
                        objLevel--;
                        checkRangeStatus(currentPos, State.AFTER_OBJECT);
                        break;
                    case 15 /* JSONSyntaxKind.Trivia */:
                    case 14 /* JSONSyntaxKind.LineBreakTrivia */:
                        goodKind = true;
                }
                if (currentPos >= desiredPosition && (currentState !== State.INVALID || lastValidPos !== -1)) {
                    let acceptPosition;
                    let acceptState;
                    if (currentState !== State.INVALID) {
                        acceptPosition = (goodKind ? currentPos : scanner.getTokenOffset());
                        acceptState = currentState;
                    }
                    else {
                        acceptPosition = lastValidPos;
                        acceptState = lastValidState;
                    }
                    if (acceptState === State.AFTER_OBJECT) {
                        return {
                            position: this.offsetToPosition(model, acceptPosition),
                            prepend: ',',
                            append: ''
                        };
                    }
                    else {
                        scanner.setPosition(acceptPosition);
                        return {
                            position: this.offsetToPosition(model, acceptPosition),
                            prepend: '',
                            append: this.hasOpenBrace(scanner) ? ',' : ''
                        };
                    }
                }
            }
            // no valid position found!
            const modelLineCount = model.getLineCount();
            return {
                position: new position_1.Position(modelLineCount, model.getLineMaxColumn(modelLineCount)),
                prepend: '\n[',
                append: ']'
            };
        }
    }
    exports.SmartSnippetInserter = SmartSnippetInserter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hcnRTbmlwcGV0SW5zZXJ0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2NvbW1vbi9zbWFydFNuaXBwZXRJbnNlcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxvQkFBb0I7UUFFeEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFvQjtZQUUvQyxPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsZ0NBQXVCLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUVoQyxJQUFJLElBQUksMENBQWtDLEVBQUUsQ0FBQztvQkFDNUMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBaUIsRUFBRSxNQUFjO1lBQ2hFLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDeEMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3ZDLEtBQUssSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDaEUsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsR0FBRyxTQUFTLENBQUM7Z0JBQ3BFLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztnQkFFM0QsSUFBSSxlQUFlLEdBQUcsTUFBTSxFQUFFLENBQUM7b0JBQzlCLE9BQU8sSUFBSSxtQkFBUSxDQUNsQixVQUFVLEVBQ1YsTUFBTSxHQUFHLGdCQUFnQixHQUFHLENBQUMsQ0FDN0IsQ0FBQztnQkFDSCxDQUFDO2dCQUNELGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUNwQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLG1CQUFRLENBQ2xCLFNBQVMsRUFDVCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQ2pDLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFpQixFQUFFLFNBQW1CO1lBRTFELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFN0cscUhBQXFIO1lBQ3JILElBQUssS0FJSjtZQUpELFdBQUssS0FBSztnQkFDVCx1Q0FBVyxDQUFBO2dCQUNYLGlEQUFnQixDQUFBO2dCQUNoQixtREFBaUIsQ0FBQTtZQUNsQixDQUFDLEVBSkksS0FBSyxLQUFMLEtBQUssUUFJVDtZQUNELElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDakMsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUVuQyxNQUFNLE9BQU8sR0FBRyxJQUFBLG9CQUFpQixFQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFFakIsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFZLEVBQUUsRUFBRTtnQkFDdEQsSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLE9BQU8sSUFBSSxVQUFVLEtBQUssQ0FBQyxJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkUsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDckIsWUFBWSxHQUFHLEdBQUcsQ0FBQztvQkFDbkIsY0FBYyxHQUFHLEtBQUssQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksWUFBWSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDcEMsWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7d0JBQzdCLFlBQVksR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3pDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUVGLE9BQU8sT0FBTyxDQUFDLElBQUksRUFBRSxnQ0FBdUIsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFFaEMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixRQUFRLElBQUksRUFBRSxDQUFDO29CQUNkO3dCQUNDLFFBQVEsR0FBRyxJQUFJLENBQUM7d0JBQ2hCLFVBQVUsRUFBRSxDQUFDO3dCQUNiLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQ2xELE1BQU07b0JBQ1A7d0JBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsVUFBVSxFQUFFLENBQUM7d0JBQ2IsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDNUMsTUFBTTtvQkFDUDt3QkFDQyxRQUFRLEdBQUcsSUFBSSxDQUFDO3dCQUNoQixnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO3dCQUNsRCxNQUFNO29CQUNQO3dCQUNDLFFBQVEsR0FBRyxJQUFJLENBQUM7d0JBQ2hCLFFBQVEsRUFBRSxDQUFDO3dCQUNYLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzVDLE1BQU07b0JBQ1A7d0JBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDaEIsUUFBUSxFQUFFLENBQUM7d0JBQ1gsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDakQsTUFBTTtvQkFDUCxvQ0FBMkI7b0JBQzNCO3dCQUNDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsSUFBSSxVQUFVLElBQUksZUFBZSxJQUFJLENBQUMsWUFBWSxLQUFLLEtBQUssQ0FBQyxPQUFPLElBQUksWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDOUYsSUFBSSxjQUFzQixDQUFDO29CQUMzQixJQUFJLFdBQWtCLENBQUM7b0JBRXZCLElBQUksWUFBWSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDcEMsY0FBYyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO3dCQUNwRSxXQUFXLEdBQUcsWUFBWSxDQUFDO29CQUM1QixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsY0FBYyxHQUFHLFlBQVksQ0FBQzt3QkFDOUIsV0FBVyxHQUFHLGNBQWMsQ0FBQztvQkFDOUIsQ0FBQztvQkFFRCxJQUFJLFdBQW9CLEtBQUssS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNqRCxPQUFPOzRCQUNOLFFBQVEsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQzs0QkFDdEQsT0FBTyxFQUFFLEdBQUc7NEJBQ1osTUFBTSxFQUFFLEVBQUU7eUJBQ1YsQ0FBQztvQkFDSCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDcEMsT0FBTzs0QkFDTixRQUFRLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7NEJBQ3RELE9BQU8sRUFBRSxFQUFFOzRCQUNYLE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7eUJBQzdDLENBQUM7b0JBQ0gsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsT0FBTztnQkFDTixRQUFRLEVBQUUsSUFBSSxtQkFBUSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzlFLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRSxHQUFHO2FBQ1gsQ0FBQztRQUNILENBQUM7S0FDRDtJQTVJRCxvREE0SUMifQ==
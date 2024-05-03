/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConsoleObservableLogger = void 0;
    exports.setLogger = setLogger;
    exports.getLogger = getLogger;
    let globalObservableLogger;
    function setLogger(logger) {
        globalObservableLogger = logger;
    }
    function getLogger() {
        return globalObservableLogger;
    }
    class ConsoleObservableLogger {
        constructor() {
            this.indentation = 0;
            this.changedObservablesSets = new WeakMap();
        }
        textToConsoleArgs(text) {
            return consoleTextToArgs([
                normalText(repeat('|  ', this.indentation)),
                text,
            ]);
        }
        formatInfo(info) {
            if (!info.hadValue) {
                return [
                    normalText(` `),
                    styled(formatValue(info.newValue, 60), {
                        color: 'green',
                    }),
                    normalText(` (initial)`),
                ];
            }
            return info.didChange
                ? [
                    normalText(` `),
                    styled(formatValue(info.oldValue, 70), {
                        color: 'red',
                        strikeThrough: true,
                    }),
                    normalText(` `),
                    styled(formatValue(info.newValue, 60), {
                        color: 'green',
                    }),
                ]
                : [normalText(` (unchanged)`)];
        }
        handleObservableChanged(observable, info) {
            console.log(...this.textToConsoleArgs([
                formatKind('observable value changed'),
                styled(observable.debugName, { color: 'BlueViolet' }),
                ...this.formatInfo(info),
            ]));
        }
        formatChanges(changes) {
            if (changes.size === 0) {
                return undefined;
            }
            return styled(' (changed deps: ' +
                [...changes].map((o) => o.debugName).join(', ') +
                ')', { color: 'gray' });
        }
        handleDerivedCreated(derived) {
            const existingHandleChange = derived.handleChange;
            this.changedObservablesSets.set(derived, new Set());
            derived.handleChange = (observable, change) => {
                this.changedObservablesSets.get(derived).add(observable);
                return existingHandleChange.apply(derived, [observable, change]);
            };
        }
        handleDerivedRecomputed(derived, info) {
            const changedObservables = this.changedObservablesSets.get(derived);
            console.log(...this.textToConsoleArgs([
                formatKind('derived recomputed'),
                styled(derived.debugName, { color: 'BlueViolet' }),
                ...this.formatInfo(info),
                this.formatChanges(changedObservables),
                { data: [{ fn: derived._computeFn }] }
            ]));
            changedObservables.clear();
        }
        handleFromEventObservableTriggered(observable, info) {
            console.log(...this.textToConsoleArgs([
                formatKind('observable from event triggered'),
                styled(observable.debugName, { color: 'BlueViolet' }),
                ...this.formatInfo(info),
                { data: [{ fn: observable._getValue }] }
            ]));
        }
        handleAutorunCreated(autorun) {
            const existingHandleChange = autorun.handleChange;
            this.changedObservablesSets.set(autorun, new Set());
            autorun.handleChange = (observable, change) => {
                this.changedObservablesSets.get(autorun).add(observable);
                return existingHandleChange.apply(autorun, [observable, change]);
            };
        }
        handleAutorunTriggered(autorun) {
            const changedObservables = this.changedObservablesSets.get(autorun);
            console.log(...this.textToConsoleArgs([
                formatKind('autorun'),
                styled(autorun.debugName, { color: 'BlueViolet' }),
                this.formatChanges(changedObservables),
                { data: [{ fn: autorun._runFn }] }
            ]));
            changedObservables.clear();
            this.indentation++;
        }
        handleAutorunFinished(autorun) {
            this.indentation--;
        }
        handleBeginTransaction(transaction) {
            let transactionName = transaction.getDebugName();
            if (transactionName === undefined) {
                transactionName = '';
            }
            console.log(...this.textToConsoleArgs([
                formatKind('transaction'),
                styled(transactionName, { color: 'BlueViolet' }),
                { data: [{ fn: transaction._fn }] }
            ]));
            this.indentation++;
        }
        handleEndTransaction() {
            this.indentation--;
        }
    }
    exports.ConsoleObservableLogger = ConsoleObservableLogger;
    function consoleTextToArgs(text) {
        const styles = new Array();
        const data = [];
        let firstArg = '';
        function process(t) {
            if ('length' in t) {
                for (const item of t) {
                    if (item) {
                        process(item);
                    }
                }
            }
            else if ('text' in t) {
                firstArg += `%c${t.text}`;
                styles.push(t.style);
                if (t.data) {
                    data.push(...t.data);
                }
            }
            else if ('data' in t) {
                data.push(...t.data);
            }
        }
        process(text);
        const result = [firstArg, ...styles];
        result.push(...data);
        return result;
    }
    function normalText(text) {
        return styled(text, { color: 'black' });
    }
    function formatKind(kind) {
        return styled(padStr(`${kind}: `, 10), { color: 'black', bold: true });
    }
    function styled(text, options = {
        color: 'black',
    }) {
        function objToCss(styleObj) {
            return Object.entries(styleObj).reduce((styleString, [propName, propValue]) => {
                return `${styleString}${propName}:${propValue};`;
            }, '');
        }
        const style = {
            color: options.color,
        };
        if (options.strikeThrough) {
            style['text-decoration'] = 'line-through';
        }
        if (options.bold) {
            style['font-weight'] = 'bold';
        }
        return {
            text,
            style: objToCss(style),
        };
    }
    function formatValue(value, availableLen) {
        switch (typeof value) {
            case 'number':
                return '' + value;
            case 'string':
                if (value.length + 2 <= availableLen) {
                    return `"${value}"`;
                }
                return `"${value.substr(0, availableLen - 7)}"+...`;
            case 'boolean':
                return value ? 'true' : 'false';
            case 'undefined':
                return 'undefined';
            case 'object':
                if (value === null) {
                    return 'null';
                }
                if (Array.isArray(value)) {
                    return formatArray(value, availableLen);
                }
                return formatObject(value, availableLen);
            case 'symbol':
                return value.toString();
            case 'function':
                return `[[Function${value.name ? ' ' + value.name : ''}]]`;
            default:
                return '' + value;
        }
    }
    function formatArray(value, availableLen) {
        let result = '[ ';
        let first = true;
        for (const val of value) {
            if (!first) {
                result += ', ';
            }
            if (result.length - 5 > availableLen) {
                result += '...';
                break;
            }
            first = false;
            result += `${formatValue(val, availableLen - result.length)}`;
        }
        result += ' ]';
        return result;
    }
    function formatObject(value, availableLen) {
        let result = '{ ';
        let first = true;
        for (const [key, val] of Object.entries(value)) {
            if (!first) {
                result += ', ';
            }
            if (result.length - 5 > availableLen) {
                result += '...';
                break;
            }
            first = false;
            result += `${key}: ${formatValue(val, availableLen - result.length)}`;
        }
        result += ' }';
        return result;
    }
    function repeat(str, count) {
        let result = '';
        for (let i = 1; i <= count; i++) {
            result += str;
        }
        return result;
    }
    function padStr(str, length) {
        while (str.length < length) {
            str += ' ';
        }
        return str;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vb2JzZXJ2YWJsZUludGVybmFsL2xvZ2dpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLDhCQUVDO0lBRUQsOEJBRUM7SUFSRCxJQUFJLHNCQUFxRCxDQUFDO0lBRTFELFNBQWdCLFNBQVMsQ0FBQyxNQUF5QjtRQUNsRCxzQkFBc0IsR0FBRyxNQUFNLENBQUM7SUFDakMsQ0FBQztJQUVELFNBQWdCLFNBQVM7UUFDeEIsT0FBTyxzQkFBc0IsQ0FBQztJQUMvQixDQUFDO0lBeUJELE1BQWEsdUJBQXVCO1FBQXBDO1lBQ1MsZ0JBQVcsR0FBRyxDQUFDLENBQUM7WUEwQ1AsMkJBQXNCLEdBQUcsSUFBSSxPQUFPLEVBQXNDLENBQUM7UUFxRjdGLENBQUM7UUE3SFEsaUJBQWlCLENBQUMsSUFBaUI7WUFDMUMsT0FBTyxpQkFBaUIsQ0FBQztnQkFDeEIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJO2FBQ0osQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLFVBQVUsQ0FBQyxJQUF3QjtZQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQixPQUFPO29CQUNOLFVBQVUsQ0FBQyxHQUFHLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUN0QyxLQUFLLEVBQUUsT0FBTztxQkFDZCxDQUFDO29CQUNGLFVBQVUsQ0FBQyxZQUFZLENBQUM7aUJBQ3hCLENBQUM7WUFDSCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUztnQkFDcEIsQ0FBQyxDQUFDO29C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
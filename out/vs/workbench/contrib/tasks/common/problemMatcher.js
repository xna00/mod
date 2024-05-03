/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/assert", "vs/base/common/path", "vs/base/common/types", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/base/common/parsers", "vs/base/common/arrays", "vs/base/common/network", "vs/platform/markers/common/markers", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/event", "vs/platform/files/common/files"], function (require, exports, nls_1, Objects, Strings, Assert, path_1, Types, UUID, Platform, severity_1, uri_1, parsers_1, arrays_1, network_1, markers_1, extensionsRegistry_1, event_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProblemMatcherRegistry = exports.ProblemMatcherParser = exports.ProblemPatternRegistry = exports.Schemas = exports.ExtensionRegistryReporter = exports.ProblemPatternParser = exports.Config = exports.ApplyToKind = exports.ProblemLocationKind = exports.FileLocationKind = void 0;
    exports.isNamedProblemMatcher = isNamedProblemMatcher;
    exports.getResource = getResource;
    exports.createLineMatcher = createLineMatcher;
    var FileLocationKind;
    (function (FileLocationKind) {
        FileLocationKind[FileLocationKind["Default"] = 0] = "Default";
        FileLocationKind[FileLocationKind["Relative"] = 1] = "Relative";
        FileLocationKind[FileLocationKind["Absolute"] = 2] = "Absolute";
        FileLocationKind[FileLocationKind["AutoDetect"] = 3] = "AutoDetect";
        FileLocationKind[FileLocationKind["Search"] = 4] = "Search";
    })(FileLocationKind || (exports.FileLocationKind = FileLocationKind = {}));
    (function (FileLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'absolute') {
                return FileLocationKind.Absolute;
            }
            else if (value === 'relative') {
                return FileLocationKind.Relative;
            }
            else if (value === 'autodetect') {
                return FileLocationKind.AutoDetect;
            }
            else if (value === 'search') {
                return FileLocationKind.Search;
            }
            else {
                return undefined;
            }
        }
        FileLocationKind.fromString = fromString;
    })(FileLocationKind || (exports.FileLocationKind = FileLocationKind = {}));
    var ProblemLocationKind;
    (function (ProblemLocationKind) {
        ProblemLocationKind[ProblemLocationKind["File"] = 0] = "File";
        ProblemLocationKind[ProblemLocationKind["Location"] = 1] = "Location";
    })(ProblemLocationKind || (exports.ProblemLocationKind = ProblemLocationKind = {}));
    (function (ProblemLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'file') {
                return ProblemLocationKind.File;
            }
            else if (value === 'location') {
                return ProblemLocationKind.Location;
            }
            else {
                return undefined;
            }
        }
        ProblemLocationKind.fromString = fromString;
    })(ProblemLocationKind || (exports.ProblemLocationKind = ProblemLocationKind = {}));
    var ApplyToKind;
    (function (ApplyToKind) {
        ApplyToKind[ApplyToKind["allDocuments"] = 0] = "allDocuments";
        ApplyToKind[ApplyToKind["openDocuments"] = 1] = "openDocuments";
        ApplyToKind[ApplyToKind["closedDocuments"] = 2] = "closedDocuments";
    })(ApplyToKind || (exports.ApplyToKind = ApplyToKind = {}));
    (function (ApplyToKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'alldocuments') {
                return ApplyToKind.allDocuments;
            }
            else if (value === 'opendocuments') {
                return ApplyToKind.openDocuments;
            }
            else if (value === 'closeddocuments') {
                return ApplyToKind.closedDocuments;
            }
            else {
                return undefined;
            }
        }
        ApplyToKind.fromString = fromString;
    })(ApplyToKind || (exports.ApplyToKind = ApplyToKind = {}));
    function isNamedProblemMatcher(value) {
        return value && Types.isString(value.name) ? true : false;
    }
    async function getResource(filename, matcher, fileService) {
        const kind = matcher.fileLocation;
        let fullPath;
        if (kind === FileLocationKind.Absolute) {
            fullPath = filename;
        }
        else if ((kind === FileLocationKind.Relative) && matcher.filePrefix && Types.isString(matcher.filePrefix)) {
            fullPath = (0, path_1.join)(matcher.filePrefix, filename);
        }
        else if (kind === FileLocationKind.AutoDetect) {
            const matcherClone = Objects.deepClone(matcher);
            matcherClone.fileLocation = FileLocationKind.Relative;
            if (fileService) {
                const relative = await getResource(filename, matcherClone);
                let stat = undefined;
                try {
                    stat = await fileService.stat(relative);
                }
                catch (ex) {
                    // Do nothing, we just need to catch file resolution errors.
                }
                if (stat) {
                    return relative;
                }
            }
            matcherClone.fileLocation = FileLocationKind.Absolute;
            return getResource(filename, matcherClone);
        }
        else if (kind === FileLocationKind.Search && fileService) {
            const fsProvider = fileService.getProvider(network_1.Schemas.file);
            if (fsProvider) {
                const uri = await searchForFileLocation(filename, fsProvider, matcher.filePrefix);
                fullPath = uri?.path;
            }
            if (!fullPath) {
                const absoluteMatcher = Objects.deepClone(matcher);
                absoluteMatcher.fileLocation = FileLocationKind.Absolute;
                return getResource(filename, absoluteMatcher);
            }
        }
        if (fullPath === undefined) {
            throw new Error('FileLocationKind is not actionable. Does the matcher have a filePrefix? This should never happen.');
        }
        fullPath = (0, path_1.normalize)(fullPath);
        fullPath = fullPath.replace(/\\/g, '/');
        if (fullPath[0] !== '/') {
            fullPath = '/' + fullPath;
        }
        if (matcher.uriProvider !== undefined) {
            return matcher.uriProvider(fullPath);
        }
        else {
            return uri_1.URI.file(fullPath);
        }
    }
    async function searchForFileLocation(filename, fsProvider, args) {
        const exclusions = new Set((0, arrays_1.asArray)(args.exclude || []).map(x => uri_1.URI.file(x).path));
        async function search(dir) {
            if (exclusions.has(dir.path)) {
                return undefined;
            }
            const entries = await fsProvider.readdir(dir);
            const subdirs = [];
            for (const [name, fileType] of entries) {
                if (fileType === files_1.FileType.Directory) {
                    subdirs.push(uri_1.URI.joinPath(dir, name));
                    continue;
                }
                if (fileType === files_1.FileType.File) {
                    /**
                     * Note that sometimes the given `filename` could be a relative
                     * path (not just the "name.ext" part). For example, the
                     * `filename` can be "/subdir/name.ext". So, just comparing
                     * `name` as `filename` is not sufficient. The workaround here
                     * is to form the URI with `dir` and `name` and check if it ends
                     * with the given `filename`.
                     */
                    const fullUri = uri_1.URI.joinPath(dir, name);
                    if (fullUri.path.endsWith(filename)) {
                        return fullUri;
                    }
                }
            }
            for (const subdir of subdirs) {
                const result = await search(subdir);
                if (result) {
                    return result;
                }
            }
            return undefined;
        }
        for (const dir of (0, arrays_1.asArray)(args.include || [])) {
            const hit = await search(uri_1.URI.file(dir));
            if (hit) {
                return hit;
            }
        }
        return undefined;
    }
    function createLineMatcher(matcher, fileService) {
        const pattern = matcher.pattern;
        if (Array.isArray(pattern)) {
            return new MultiLineMatcher(matcher, fileService);
        }
        else {
            return new SingleLineMatcher(matcher, fileService);
        }
    }
    const endOfLine = Platform.OS === 1 /* Platform.OperatingSystem.Windows */ ? '\r\n' : '\n';
    class AbstractLineMatcher {
        constructor(matcher, fileService) {
            this.matcher = matcher;
            this.fileService = fileService;
        }
        handle(lines, start = 0) {
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
        fillProblemData(data, pattern, matches) {
            if (data) {
                this.fillProperty(data, 'file', pattern, matches, true);
                this.appendProperty(data, 'message', pattern, matches, true);
                this.fillProperty(data, 'code', pattern, matches, true);
                this.fillProperty(data, 'severity', pattern, matches, true);
                this.fillProperty(data, 'location', pattern, matches, true);
                this.fillProperty(data, 'line', pattern, matches);
                this.fillProperty(data, 'character', pattern, matches);
                this.fillProperty(data, 'endLine', pattern, matches);
                this.fillProperty(data, 'endCharacter', pattern, matches);
                return true;
            }
            else {
                return false;
            }
        }
        appendProperty(data, property, pattern, matches, trim = false) {
            const patternProperty = pattern[property];
            if (Types.isUndefined(data[property])) {
                this.fillProperty(data, property, pattern, matches, trim);
            }
            else if (!Types.isUndefined(patternProperty) && patternProperty < matches.length) {
                let value = matches[patternProperty];
                if (trim) {
                    value = Strings.trim(value);
                }
                data[property] += endOfLine + value;
            }
        }
        fillProperty(data, property, pattern, matches, trim = false) {
            const patternAtProperty = pattern[property];
            if (Types.isUndefined(data[property]) && !Types.isUndefined(patternAtProperty) && patternAtProperty < matches.length) {
                let value = matches[patternAtProperty];
                if (value !== undefined) {
                    if (trim) {
                        value = Strings.trim(value);
                    }
                    data[property] = value;
                }
            }
        }
        getMarkerMatch(data) {
            try {
                const location = this.getLocation(data);
                if (data.file && location && data.message) {
                    const marker = {
                        severity: this.getSeverity(data),
                        startLineNumber: location.startLineNumber,
                        startColumn: location.startCharacter,
                        endLineNumber: location.endLineNumber,
                        endColumn: location.endCharacter,
                        message: data.message
                    };
                    if (data.code !== undefined) {
                        marker.code = data.code;
                    }
                    if (this.matcher.source !== undefined) {
                        marker.source = this.matcher.source;
                    }
                    return {
                        description: this.matcher,
                        resource: this.getResource(data.file),
                        marker: marker
                    };
                }
            }
            catch (err) {
                console.error(`Failed to convert problem data into match: ${JSON.stringify(data)}`);
            }
            return undefined;
        }
        getResource(filename) {
            return getResource(filename, this.matcher, this.fileService);
        }
        getLocation(data) {
            if (data.kind === ProblemLocationKind.File) {
                return this.createLocation(0, 0, 0, 0);
            }
            if (data.location) {
                return this.parseLocationInfo(data.location);
            }
            if (!data.line) {
                return null;
            }
            const startLine = parseInt(data.line);
            const startColumn = data.character ? parseInt(data.character) : undefined;
            const endLine = data.endLine ? parseInt(data.endLine) : undefined;
            const endColumn = data.endCharacter ? parseInt(data.endCharacter) : undefined;
            return this.createLocation(startLine, startColumn, endLine, endColumn);
        }
        parseLocationInfo(value) {
            if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
                return null;
            }
            const parts = value.split(',');
            const startLine = parseInt(parts[0]);
            const startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined;
            if (parts.length > 3) {
                return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]));
            }
            else {
                return this.createLocation(startLine, startColumn, undefined, undefined);
            }
        }
        createLocation(startLine, startColumn, endLine, endColumn) {
            if (startColumn !== undefined && endColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: endLine || startLine, endCharacter: endColumn };
            }
            if (startColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: startLine, endCharacter: startColumn };
            }
            return { startLineNumber: startLine, startCharacter: 1, endLineNumber: startLine, endCharacter: 2 ** 31 - 1 }; // See https://github.com/microsoft/vscode/issues/80288#issuecomment-650636442 for discussion
        }
        getSeverity(data) {
            let result = null;
            if (data.severity) {
                const value = data.severity;
                if (value) {
                    result = severity_1.default.fromValue(value);
                    if (result === severity_1.default.Ignore) {
                        if (value === 'E') {
                            result = severity_1.default.Error;
                        }
                        else if (value === 'W') {
                            result = severity_1.default.Warning;
                        }
                        else if (value === 'I') {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'hint')) {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'note')) {
                            result = severity_1.default.Info;
                        }
                    }
                }
            }
            if (result === null || result === severity_1.default.Ignore) {
                result = this.matcher.severity || severity_1.default.Error;
            }
            return markers_1.MarkerSeverity.fromSeverity(result);
        }
    }
    class SingleLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.pattern = matcher.pattern;
        }
        get matchLength() {
            return 1;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === 1);
            const data = Object.create(null);
            if (this.pattern.kind !== undefined) {
                data.kind = this.pattern.kind;
            }
            const matches = this.pattern.regexp.exec(lines[start]);
            if (matches) {
                this.fillProblemData(data, this.pattern, matches);
                const match = this.getMarkerMatch(data);
                if (match) {
                    return { match: match, continue: false };
                }
            }
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
    }
    class MultiLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.patterns = matcher.pattern;
        }
        get matchLength() {
            return this.patterns.length;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === this.patterns.length);
            this.data = Object.create(null);
            let data = this.data;
            data.kind = this.patterns[0].kind;
            for (let i = 0; i < this.patterns.length; i++) {
                const pattern = this.patterns[i];
                const matches = pattern.regexp.exec(lines[i + start]);
                if (!matches) {
                    return { match: null, continue: false };
                }
                else {
                    // Only the last pattern can loop
                    if (pattern.loop && i === this.patterns.length - 1) {
                        data = Objects.deepClone(data);
                    }
                    this.fillProblemData(data, pattern, matches);
                }
            }
            const loop = !!this.patterns[this.patterns.length - 1].loop;
            if (!loop) {
                this.data = undefined;
            }
            const markerMatch = data ? this.getMarkerMatch(data) : null;
            return { match: markerMatch ? markerMatch : null, continue: loop };
        }
        next(line) {
            const pattern = this.patterns[this.patterns.length - 1];
            Assert.ok(pattern.loop === true && this.data !== null);
            const matches = pattern.regexp.exec(line);
            if (!matches) {
                this.data = undefined;
                return null;
            }
            const data = Objects.deepClone(this.data);
            let problemMatch;
            if (this.fillProblemData(data, pattern, matches)) {
                problemMatch = this.getMarkerMatch(data);
            }
            return problemMatch ? problemMatch : null;
        }
    }
    var Config;
    (function (Config) {
        let CheckedProblemPattern;
        (function (CheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.regexp);
            }
            CheckedProblemPattern.is = is;
        })(CheckedProblemPattern = Config.CheckedProblemPattern || (Config.CheckedProblemPattern = {}));
        let NamedProblemPattern;
        (function (NamedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.name);
            }
            NamedProblemPattern.is = is;
        })(NamedProblemPattern = Config.NamedProblemPattern || (Config.NamedProblemPattern = {}));
        let NamedCheckedProblemPattern;
        (function (NamedCheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && NamedProblemPattern.is(candidate) && Types.isString(candidate.regexp);
            }
            NamedCheckedProblemPattern.is = is;
        })(NamedCheckedProblemPattern = Config.NamedCheckedProblemPattern || (Config.NamedCheckedProblemPattern = {}));
        let MultiLineProblemPattern;
        (function (MultiLineProblemPattern) {
            function is(value) {
                return value && Array.isArray(value);
            }
            MultiLineProblemPattern.is = is;
        })(MultiLineProblemPattern = Config.MultiLineProblemPattern || (Config.MultiLineProblemPattern = {}));
        let MultiLineCheckedProblemPattern;
        (function (MultiLineCheckedProblemPattern) {
            function is(value) {
                if (!MultiLineProblemPattern.is(value)) {
                    return false;
                }
                for (const element of value) {
                    if (!Config.CheckedProblemPattern.is(element)) {
                        return false;
                    }
                }
                return true;
            }
            MultiLineCheckedProblemPattern.is = is;
        })(MultiLineCheckedProblemPattern = Config.MultiLineCheckedProblemPattern || (Config.MultiLineCheckedProblemPattern = {}));
        let NamedMultiLineCheckedProblemPattern;
        (function (NamedMultiLineCheckedProblemPattern) {
            function is(value) {
                const candidate = value;
                return candidate && Types.isString(candidate.name) && Array.isArray(candidate.patterns) && MultiLineCheckedProblemPattern.is(candidate.patterns);
            }
            NamedMultiLineCheckedProblemPattern.is = is;
        })(NamedMultiLineCheckedProblemPattern = Config.NamedMultiLineCheckedProblemPattern || (Config.NamedMultiLineCheckedProblemPattern = {}));
        function isNamedProblemMatcher(value) {
            return Types.isString(value.name);
        }
        Config.isNamedProblemMatcher = isNamedProblemMatcher;
    })(Config || (exports.Config = Config = {}));
    class ProblemPatternParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(value) {
            if (Config.NamedMultiLineCheckedProblemPattern.is(value)) {
                return this.createNamedMultiLineProblemPattern(value);
            }
            else if (Config.MultiLineCheckedProblemPattern.is(value)) {
                return this.createMultiLineProblemPattern(value);
            }
            else if (Config.NamedCheckedProblemPattern.is(value)) {
                const result = this.createSingleProblemPattern(value);
                result.name = value.name;
                return result;
            }
            else if (Config.CheckedProblemPattern.is(value)) {
                return this.createSingleProblemPattern(value);
            }
            else {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingRegExp', 'The problem pattern is missing a regular expression.'));
                return null;
            }
        }
        createSingleProblemPattern(value) {
            const result = this.doCreateSingleProblemPattern(value, true);
            if (result === undefined) {
                return null;
            }
            else if (result.kind === undefined) {
                result.kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern([result]) ? result : null;
        }
        createNamedMultiLineProblemPattern(value) {
            const validPatterns = this.createMultiLineProblemPattern(value.patterns);
            if (!validPatterns) {
                return null;
            }
            const result = {
                name: value.name,
                label: value.label ? value.label : value.name,
                patterns: validPatterns
            };
            return result;
        }
        createMultiLineProblemPattern(values) {
            const result = [];
            for (let i = 0; i < values.length; i++) {
                const pattern = this.doCreateSingleProblemPattern(values[i], false);
                if (pattern === undefined) {
                    return null;
                }
                if (i < values.length - 1) {
                    if (!Types.isUndefined(pattern.loop) && pattern.loop) {
                        pattern.loop = false;
                        this.error((0, nls_1.localize)('ProblemPatternParser.loopProperty.notLast', 'The loop property is only supported on the last line matcher.'));
                    }
                }
                result.push(pattern);
            }
            if (result[0].kind === undefined) {
                result[0].kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern(result) ? result : null;
        }
        doCreateSingleProblemPattern(value, setDefaults) {
            const regexp = this.createRegularExpression(value.regexp);
            if (regexp === undefined) {
                return undefined;
            }
            let result = { regexp };
            if (value.kind) {
                result.kind = ProblemLocationKind.fromString(value.kind);
            }
            function copyProperty(result, source, resultKey, sourceKey) {
                const value = source[sourceKey];
                if (typeof value === 'number') {
                    result[resultKey] = value;
                }
            }
            copyProperty(result, value, 'file', 'file');
            copyProperty(result, value, 'location', 'location');
            copyProperty(result, value, 'line', 'line');
            copyProperty(result, value, 'character', 'column');
            copyProperty(result, value, 'endLine', 'endLine');
            copyProperty(result, value, 'endCharacter', 'endColumn');
            copyProperty(result, value, 'severity', 'severity');
            copyProperty(result, value, 'code', 'code');
            copyProperty(result, value, 'message', 'message');
            if (value.loop === true || value.loop === false) {
                result.loop = value.loop;
            }
            if (setDefaults) {
                if (result.location || result.kind === ProblemLocationKind.File) {
                    const defaultValue = {
                        file: 1,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
                else {
                    const defaultValue = {
                        file: 1,
                        line: 2,
                        character: 3,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
            }
            return result;
        }
        validateProblemPattern(values) {
            let file = false, message = false, location = false, line = false;
            const locationKind = (values[0].kind === undefined) ? ProblemLocationKind.Location : values[0].kind;
            values.forEach((pattern, i) => {
                if (i !== 0 && pattern.kind) {
                    this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.kindProperty.notFirst', 'The problem pattern is invalid. The kind property must be provided only in the first element'));
                }
                file = file || !Types.isUndefined(pattern.file);
                message = message || !Types.isUndefined(pattern.message);
                location = location || !Types.isUndefined(pattern.location);
                line = line || !Types.isUndefined(pattern.line);
            });
            if (!(file && message)) {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingProperty', 'The problem pattern is invalid. It must have at least have a file and a message.'));
                return false;
            }
            if (locationKind === ProblemLocationKind.Location && !(location || line)) {
                this.error((0, nls_1.localize)('ProblemPatternParser.problemPattern.missingLocation', 'The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
                return false;
            }
            return true;
        }
        createRegularExpression(value) {
            let result;
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error((0, nls_1.localize)('ProblemPatternParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemPatternParser = ProblemPatternParser;
    class ExtensionRegistryReporter {
        constructor(_collector, _validationStatus = new parsers_1.ValidationStatus()) {
            this._collector = _collector;
            this._validationStatus = _validationStatus;
        }
        info(message) {
            this._validationStatus.state = 1 /* ValidationState.Info */;
            this._collector.info(message);
        }
        warn(message) {
            this._validationStatus.state = 2 /* ValidationState.Warning */;
            this._collector.warn(message);
        }
        error(message) {
            this._validationStatus.state = 3 /* ValidationState.Error */;
            this._collector.error(message);
        }
        fatal(message) {
            this._validationStatus.state = 4 /* ValidationState.Fatal */;
            this._collector.error(message);
        }
        get status() {
            return this._validationStatus;
        }
    }
    exports.ExtensionRegistryReporter = ExtensionRegistryReporter;
    var Schemas;
    (function (Schemas) {
        Schemas.ProblemPattern = {
            default: {
                regexp: '^([^\\\\s].*)\\\\((\\\\d+,\\\\d+)\\\\):\\\\s*(.*)$',
                file: 1,
                location: 2,
                message: 3
            },
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemPatternSchema.regexp', 'The regular expression to find an error, warning or info in the output.')
                },
                kind: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemPatternSchema.kind', 'whether the pattern matches a location (file and line) or only a file.')
                },
                file: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.file', 'The match group index of the filename. If omitted 1 is used.')
                },
                location: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.location', 'The match group index of the problem\'s location. Valid location patterns are: (line), (line,column) and (startLine,startColumn,endLine,endColumn). If omitted (line,column) is assumed.')
                },
                line: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.line', 'The match group index of the problem\'s line. Defaults to 2')
                },
                column: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.column', 'The match group index of the problem\'s line character. Defaults to 3')
                },
                endLine: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.endLine', 'The match group index of the problem\'s end line. Defaults to undefined')
                },
                endColumn: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.endColumn', 'The match group index of the problem\'s end line character. Defaults to undefined')
                },
                severity: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.severity', 'The match group index of the problem\'s severity. Defaults to undefined')
                },
                code: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.code', 'The match group index of the problem\'s code. Defaults to undefined')
                },
                message: {
                    type: 'integer',
                    description: (0, nls_1.localize)('ProblemPatternSchema.message', 'The match group index of the message. If omitted it defaults to 4 if location is specified. Otherwise it defaults to 5.')
                },
                loop: {
                    type: 'boolean',
                    description: (0, nls_1.localize)('ProblemPatternSchema.loop', 'In a multi line matcher loop indicated whether this pattern is executed in a loop as long as it matches. Can only specified on a last pattern in a multi line pattern.')
                }
            }
        };
        Schemas.NamedProblemPattern = Objects.deepClone(Schemas.ProblemPattern);
        Schemas.NamedProblemPattern.properties = Objects.deepClone(Schemas.NamedProblemPattern.properties) || {};
        Schemas.NamedProblemPattern.properties['name'] = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemPatternSchema.name', 'The name of the problem pattern.')
        };
        Schemas.MultiLineProblemPattern = {
            type: 'array',
            items: Schemas.ProblemPattern
        };
        Schemas.NamedMultiLineProblemPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string',
                    description: (0, nls_1.localize)('NamedMultiLineProblemPatternSchema.name', 'The name of the problem multi line problem pattern.')
                },
                patterns: {
                    type: 'array',
                    description: (0, nls_1.localize)('NamedMultiLineProblemPatternSchema.patterns', 'The actual patterns.'),
                    items: Schemas.ProblemPattern
                }
            }
        };
    })(Schemas || (exports.Schemas = Schemas = {}));
    const problemPatternExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemPatterns',
        jsonSchema: {
            description: (0, nls_1.localize)('ProblemPatternExtPoint', 'Contributes problem patterns'),
            type: 'array',
            items: {
                anyOf: [
                    Schemas.NamedProblemPattern,
                    Schemas.NamedMultiLineProblemPattern
                ]
            }
        }
    });
    class ProblemPatternRegistryImpl {
        constructor() {
            this.patterns = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemPatternExtPoint.setHandler((extensions, delta) => {
                    // We get all statically know extension during startup in one batch
                    try {
                        delta.removed.forEach(extension => {
                            const problemPatterns = extension.value;
                            for (const pattern of problemPatterns) {
                                if (this.patterns[pattern.name]) {
                                    delete this.patterns[pattern.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            const problemPatterns = extension.value;
                            const parser = new ProblemPatternParser(new ExtensionRegistryReporter(extension.collector));
                            for (const pattern of problemPatterns) {
                                if (Config.NamedMultiLineCheckedProblemPattern.is(pattern)) {
                                    const result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* ValidationState.Error */) {
                                        this.add(result.name, result.patterns);
                                    }
                                    else {
                                        extension.collector.error((0, nls_1.localize)('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                else if (Config.NamedProblemPattern.is(pattern)) {
                                    const result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* ValidationState.Error */) {
                                        this.add(pattern.name, result);
                                    }
                                    else {
                                        extension.collector.error((0, nls_1.localize)('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                parser.reset();
                            }
                        });
                    }
                    catch (error) {
                        // Do nothing
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            return this.readyPromise;
        }
        add(key, value) {
            this.patterns[key] = value;
        }
        get(key) {
            return this.patterns[key];
        }
        fillDefaults() {
            this.add('msCompile', {
                regexp: /^(?:\s*\d+>)?(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\)\s*:\s+((?:fatal +)?error|warning|info)\s+(\w+\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('gulp-tsc', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(\d+)\s+(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                code: 3,
                message: 4
            });
            this.add('cpp', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(C\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('csc', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(CS\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('vb', {
                regexp: /^(\S.*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(BC\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('lessCompile', {
                regexp: /^\s*(.*) in file (.*) line no. (\d+)$/,
                kind: ProblemLocationKind.Location,
                message: 1,
                file: 2,
                line: 3
            });
            this.add('jshint', {
                regexp: /^(.*):\s+line\s+(\d+),\s+col\s+(\d+),\s(.+?)(?:\s+\((\w)(\d+)\))?$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                line: 2,
                character: 3,
                message: 4,
                severity: 5,
                code: 6
            });
            this.add('jshint-stylish', [
                {
                    regexp: /^(.+)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+line\s+(\d+)\s+col\s+(\d+)\s+(.+?)(?:\s+\((\w)(\d+)\))?$/,
                    line: 1,
                    character: 2,
                    message: 3,
                    severity: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('eslint-compact', {
                regexp: /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/,
                file: 1,
                kind: ProblemLocationKind.Location,
                line: 2,
                character: 3,
                severity: 4,
                message: 5,
                code: 6
            });
            this.add('eslint-stylish', [
                {
                    regexp: /^((?:[a-zA-Z]:)*[./\\]+.*?)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+(\d+):(\d+)\s+(error|warning|info)\s+(.+?)(?:\s\s+(.*))?$/,
                    line: 1,
                    character: 2,
                    severity: 3,
                    message: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('go', {
                regexp: /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+))?: (.*)$/,
                kind: ProblemLocationKind.Location,
                file: 2,
                line: 4,
                character: 6,
                message: 7
            });
        }
    }
    exports.ProblemPatternRegistry = new ProblemPatternRegistryImpl();
    class ProblemMatcherParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(json) {
            const result = this.createProblemMatcher(json);
            if (!this.checkProblemMatcherValid(json, result)) {
                return undefined;
            }
            this.addWatchingMatcher(json, result);
            return result;
        }
        checkProblemMatcherValid(externalProblemMatcher, problemMatcher) {
            if (!problemMatcher) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noProblemMatcher', 'Error: the description can\'t be converted into a problem matcher:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.pattern) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noProblemPattern', 'Error: the description doesn\'t define a valid problem pattern:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.owner) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noOwner', 'Error: the description doesn\'t define an owner:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (Types.isUndefined(problemMatcher.fileLocation)) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.noFileLocation', 'Error: the description doesn\'t define a file location:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            return true;
        }
        createProblemMatcher(description) {
            let result = null;
            const owner = Types.isString(description.owner) ? description.owner : UUID.generateUuid();
            const source = Types.isString(description.source) ? description.source : undefined;
            let applyTo = Types.isString(description.applyTo) ? ApplyToKind.fromString(description.applyTo) : ApplyToKind.allDocuments;
            if (!applyTo) {
                applyTo = ApplyToKind.allDocuments;
            }
            let fileLocation = undefined;
            let filePrefix = undefined;
            let kind;
            if (Types.isUndefined(description.fileLocation)) {
                fileLocation = FileLocationKind.Relative;
                filePrefix = '${workspaceFolder}';
            }
            else if (Types.isString(description.fileLocation)) {
                kind = FileLocationKind.fromString(description.fileLocation);
                if (kind) {
                    fileLocation = kind;
                    if ((kind === FileLocationKind.Relative) || (kind === FileLocationKind.AutoDetect)) {
                        filePrefix = '${workspaceFolder}';
                    }
                    else if (kind === FileLocationKind.Search) {
                        filePrefix = { include: ['${workspaceFolder}'] };
                    }
                }
            }
            else if (Types.isStringArray(description.fileLocation)) {
                const values = description.fileLocation;
                if (values.length > 0) {
                    kind = FileLocationKind.fromString(values[0]);
                    if (values.length === 1 && kind === FileLocationKind.Absolute) {
                        fileLocation = kind;
                    }
                    else if (values.length === 2 && (kind === FileLocationKind.Relative || kind === FileLocationKind.AutoDetect) && values[1]) {
                        fileLocation = kind;
                        filePrefix = values[1];
                    }
                }
            }
            else if (Array.isArray(description.fileLocation)) {
                const kind = FileLocationKind.fromString(description.fileLocation[0]);
                if (kind === FileLocationKind.Search) {
                    fileLocation = FileLocationKind.Search;
                    filePrefix = description.fileLocation[1] ?? { include: ['${workspaceFolder}'] };
                }
            }
            const pattern = description.pattern ? this.createProblemPattern(description.pattern) : undefined;
            let severity = description.severity ? severity_1.default.fromValue(description.severity) : undefined;
            if (severity === severity_1.default.Ignore) {
                this.info((0, nls_1.localize)('ProblemMatcherParser.unknownSeverity', 'Info: unknown severity {0}. Valid values are error, warning and info.\n', description.severity));
                severity = severity_1.default.Error;
            }
            if (Types.isString(description.base)) {
                const variableName = description.base;
                if (variableName.length > 1 && variableName[0] === '$') {
                    const base = exports.ProblemMatcherRegistry.get(variableName.substring(1));
                    if (base) {
                        result = Objects.deepClone(base);
                        if (description.owner !== undefined && owner !== undefined) {
                            result.owner = owner;
                        }
                        if (description.source !== undefined && source !== undefined) {
                            result.source = source;
                        }
                        if (description.fileLocation !== undefined && fileLocation !== undefined) {
                            result.fileLocation = fileLocation;
                            result.filePrefix = filePrefix;
                        }
                        if (description.pattern !== undefined && pattern !== undefined && pattern !== null) {
                            result.pattern = pattern;
                        }
                        if (description.severity !== undefined && severity !== undefined) {
                            result.severity = severity;
                        }
                        if (description.applyTo !== undefined && applyTo !== undefined) {
                            result.applyTo = applyTo;
                        }
                    }
                }
            }
            else if (fileLocation && pattern) {
                result = {
                    owner: owner,
                    applyTo: applyTo,
                    fileLocation: fileLocation,
                    pattern: pattern,
                };
                if (source) {
                    result.source = source;
                }
                if (filePrefix) {
                    result.filePrefix = filePrefix;
                }
                if (severity) {
                    result.severity = severity;
                }
            }
            if (Config.isNamedProblemMatcher(description)) {
                result.name = description.name;
                result.label = Types.isString(description.label) ? description.label : description.name;
            }
            return result;
        }
        createProblemPattern(value) {
            if (Types.isString(value)) {
                const variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    const result = exports.ProblemPatternRegistry.get(variableName.substring(1));
                    if (!result) {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noDefinedPatter', 'Error: the pattern with the identifier {0} doesn\'t exist.', variableName));
                    }
                    return result;
                }
                else {
                    if (variableName.length === 0) {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noIdentifier', 'Error: the pattern property refers to an empty identifier.'));
                    }
                    else {
                        this.error((0, nls_1.localize)('ProblemMatcherParser.noValidIdentifier', 'Error: the pattern property {0} is not a valid pattern variable name.', variableName));
                    }
                }
            }
            else if (value) {
                const problemPatternParser = new ProblemPatternParser(this.problemReporter);
                if (Array.isArray(value)) {
                    return problemPatternParser.parse(value);
                }
                else {
                    return problemPatternParser.parse(value);
                }
            }
            return null;
        }
        addWatchingMatcher(external, internal) {
            const oldBegins = this.createRegularExpression(external.watchedTaskBeginsRegExp);
            const oldEnds = this.createRegularExpression(external.watchedTaskEndsRegExp);
            if (oldBegins && oldEnds) {
                internal.watching = {
                    activeOnStart: false,
                    beginsPattern: { regexp: oldBegins },
                    endsPattern: { regexp: oldEnds }
                };
                return;
            }
            const backgroundMonitor = external.background || external.watching;
            if (Types.isUndefinedOrNull(backgroundMonitor)) {
                return;
            }
            const begins = this.createWatchingPattern(backgroundMonitor.beginsPattern);
            const ends = this.createWatchingPattern(backgroundMonitor.endsPattern);
            if (begins && ends) {
                internal.watching = {
                    activeOnStart: Types.isBoolean(backgroundMonitor.activeOnStart) ? backgroundMonitor.activeOnStart : false,
                    beginsPattern: begins,
                    endsPattern: ends
                };
                return;
            }
            if (begins || ends) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.problemPattern.watchingMatcher', 'A problem matcher must define both a begin pattern and an end pattern for watching.'));
            }
        }
        createWatchingPattern(external) {
            if (Types.isUndefinedOrNull(external)) {
                return null;
            }
            let regexp;
            let file;
            if (Types.isString(external)) {
                regexp = this.createRegularExpression(external);
            }
            else {
                regexp = this.createRegularExpression(external.regexp);
                if (Types.isNumber(external.file)) {
                    file = external.file;
                }
            }
            if (!regexp) {
                return null;
            }
            return file ? { regexp, file } : { regexp, file: 1 };
        }
        createRegularExpression(value) {
            let result = null;
            if (!value) {
                return result;
            }
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error((0, nls_1.localize)('ProblemMatcherParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemMatcherParser = ProblemMatcherParser;
    (function (Schemas) {
        Schemas.WatchingPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: (0, nls_1.localize)('WatchingPatternSchema.regexp', 'The regular expression to detect the begin or end of a background task.')
                },
                file: {
                    type: 'integer',
                    description: (0, nls_1.localize)('WatchingPatternSchema.file', 'The match group index of the filename. Can be omitted.')
                },
            }
        };
        Schemas.PatternType = {
            anyOf: [
                {
                    type: 'string',
                    description: (0, nls_1.localize)('PatternTypeSchema.name', 'The name of a contributed or predefined pattern')
                },
                Schemas.ProblemPattern,
                Schemas.MultiLineProblemPattern
            ],
            description: (0, nls_1.localize)('PatternTypeSchema.description', 'A problem pattern or the name of a contributed or predefined problem pattern. Can be omitted if base is specified.')
        };
        Schemas.ProblemMatcher = {
            type: 'object',
            additionalProperties: false,
            properties: {
                base: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.base', 'The name of a base problem matcher to use.')
                },
                owner: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.owner', 'The owner of the problem inside Code. Can be omitted if base is specified. Defaults to \'external\' if omitted and base is not specified.')
                },
                source: {
                    type: 'string',
                    description: (0, nls_1.localize)('ProblemMatcherSchema.source', 'A human-readable string describing the source of this diagnostic, e.g. \'typescript\' or \'super lint\'.')
                },
                severity: {
                    type: 'string',
                    enum: ['error', 'warning', 'info'],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.severity', 'The default severity for captures problems. Is used if the pattern doesn\'t define a match group for severity.')
                },
                applyTo: {
                    type: 'string',
                    enum: ['allDocuments', 'openDocuments', 'closedDocuments'],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.applyTo', 'Controls if a problem reported on a text document is applied only to open, closed or all documents.')
                },
                pattern: Schemas.PatternType,
                fileLocation: {
                    oneOf: [
                        {
                            type: 'string',
                            enum: ['absolute', 'relative', 'autoDetect', 'search']
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                {
                                    type: 'string',
                                    enum: ['absolute', 'relative', 'autoDetect', 'search']
                                },
                            ],
                            minItems: 1,
                            maxItems: 1,
                            additionalItems: false
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                { type: 'string', enum: ['relative', 'autoDetect'] },
                                { type: 'string' },
                            ],
                            minItems: 2,
                            maxItems: 2,
                            additionalItems: false,
                            examples: [
                                ['relative', '${workspaceFolder}'],
                                ['autoDetect', '${workspaceFolder}'],
                            ]
                        },
                        {
                            type: 'array',
                            prefixItems: [
                                { type: 'string', enum: ['search'] },
                                {
                                    type: 'object',
                                    properties: {
                                        'include': {
                                            oneOf: [
                                                { type: 'string' },
                                                { type: 'array', items: { type: 'string' } }
                                            ]
                                        },
                                        'exclude': {
                                            oneOf: [
                                                { type: 'string' },
                                                { type: 'array', items: { type: 'string' } }
                                            ]
                                        },
                                    },
                                    required: ['include']
                                }
                            ],
                            minItems: 2,
                            maxItems: 2,
                            additionalItems: false,
                            examples: [
                                ['search', { 'include': ['${workspaceFolder}'] }],
                                ['search', { 'include': ['${workspaceFolder}'], 'exclude': [] }]
                            ],
                        }
                    ],
                    description: (0, nls_1.localize)('ProblemMatcherSchema.fileLocation', 'Defines how file names reported in a problem pattern should be interpreted. A relative fileLocation may be an array, where the second element of the array is the path of the relative file location. The search fileLocation mode, performs a deep (and, possibly, heavy) file system search within the directories specified by the include/exclude properties of the second element (or the current workspace directory if not specified).')
                },
                background: {
                    type: 'object',
                    additionalProperties: false,
                    description: (0, nls_1.localize)('ProblemMatcherSchema.background', 'Patterns to track the begin and end of a matcher active on a background task.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.activeOnStart', 'If set to true the background monitor is in active mode when the task starts. This is equals of issuing a line that matches the beginsPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.beginsPattern', 'If matched in the output the start of a background task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.background.endsPattern', 'If matched in the output the end of a background task is signaled.')
                        }
                    }
                },
                watching: {
                    type: 'object',
                    additionalProperties: false,
                    deprecationMessage: (0, nls_1.localize)('ProblemMatcherSchema.watching.deprecated', 'The watching property is deprecated. Use background instead.'),
                    description: (0, nls_1.localize)('ProblemMatcherSchema.watching', 'Patterns to track the begin and end of a watching matcher.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.activeOnStart', 'If set to true the watcher is in active mode when the task starts. This is equals of issuing a line that matches the beginPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.beginsPattern', 'If matched in the output the start of a watching task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: (0, nls_1.localize)('ProblemMatcherSchema.watching.endsPattern', 'If matched in the output the end of a watching task is signaled.')
                        }
                    }
                }
            }
        };
        Schemas.LegacyProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.LegacyProblemMatcher.properties = Objects.deepClone(Schemas.LegacyProblemMatcher.properties) || {};
        Schemas.LegacyProblemMatcher.properties['watchedTaskBeginsRegExp'] = {
            type: 'string',
            deprecationMessage: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedBegin.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedBegin', 'A regular expression signaling that a watched tasks begins executing triggered through file watching.')
        };
        Schemas.LegacyProblemMatcher.properties['watchedTaskEndsRegExp'] = {
            type: 'string',
            deprecationMessage: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedEnd.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: (0, nls_1.localize)('LegacyProblemMatcherSchema.watchedEnd', 'A regular expression signaling that a watched tasks ends executing.')
        };
        Schemas.NamedProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.NamedProblemMatcher.properties = Objects.deepClone(Schemas.NamedProblemMatcher.properties) || {};
        Schemas.NamedProblemMatcher.properties.name = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemMatcherSchema.name', 'The name of the problem matcher used to refer to it.')
        };
        Schemas.NamedProblemMatcher.properties.label = {
            type: 'string',
            description: (0, nls_1.localize)('NamedProblemMatcherSchema.label', 'A human readable label of the problem matcher.')
        };
    })(Schemas || (exports.Schemas = Schemas = {}));
    const problemMatchersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemMatchers',
        deps: [problemPatternExtPoint],
        jsonSchema: {
            description: (0, nls_1.localize)('ProblemMatcherExtPoint', 'Contributes problem matchers'),
            type: 'array',
            items: Schemas.NamedProblemMatcher
        }
    });
    class ProblemMatcherRegistryImpl {
        constructor() {
            this._onMatchersChanged = new event_1.Emitter();
            this.onMatcherChanged = this._onMatchersChanged.event;
            this.matchers = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemMatchersExtPoint.setHandler((extensions, delta) => {
                    try {
                        delta.removed.forEach(extension => {
                            const problemMatchers = extension.value;
                            for (const matcher of problemMatchers) {
                                if (this.matchers[matcher.name]) {
                                    delete this.matchers[matcher.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            const problemMatchers = extension.value;
                            const parser = new ProblemMatcherParser(new ExtensionRegistryReporter(extension.collector));
                            for (const matcher of problemMatchers) {
                                const result = parser.parse(matcher);
                                if (result && isNamedProblemMatcher(result)) {
                                    this.add(result);
                                }
                            }
                        });
                        if ((delta.removed.length > 0) || (delta.added.length > 0)) {
                            this._onMatchersChanged.fire();
                        }
                    }
                    catch (error) {
                    }
                    const matcher = this.get('tsc-watch');
                    if (matcher) {
                        matcher.tscWatch = true;
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            exports.ProblemPatternRegistry.onReady();
            return this.readyPromise;
        }
        add(matcher) {
            this.matchers[matcher.name] = matcher;
        }
        get(name) {
            return this.matchers[name];
        }
        keys() {
            return Object.keys(this.matchers);
        }
        fillDefaults() {
            this.add({
                name: 'msCompile',
                label: (0, nls_1.localize)('msCompile', 'Microsoft compiler problems'),
                owner: 'msCompile',
                source: 'cpp',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('msCompile')
            });
            this.add({
                name: 'lessCompile',
                label: (0, nls_1.localize)('lessCompile', 'Less problems'),
                deprecated: true,
                owner: 'lessCompile',
                source: 'less',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('lessCompile'),
                severity: severity_1.default.Error
            });
            this.add({
                name: 'gulp-tsc',
                label: (0, nls_1.localize)('gulp-tsc', 'Gulp TSC Problems'),
                owner: 'typescript',
                source: 'ts',
                applyTo: ApplyToKind.closedDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('gulp-tsc')
            });
            this.add({
                name: 'jshint',
                label: (0, nls_1.localize)('jshint', 'JSHint problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint')
            });
            this.add({
                name: 'jshint-stylish',
                label: (0, nls_1.localize)('jshint-stylish', 'JSHint stylish problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint-stylish')
            });
            this.add({
                name: 'eslint-compact',
                label: (0, nls_1.localize)('eslint-compact', 'ESLint compact problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('eslint-compact')
            });
            this.add({
                name: 'eslint-stylish',
                label: (0, nls_1.localize)('eslint-stylish', 'ESLint stylish problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('eslint-stylish')
            });
            this.add({
                name: 'go',
                label: (0, nls_1.localize)('go', 'Go problems'),
                owner: 'go',
                source: 'go',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('go')
            });
        }
    }
    exports.ProblemMatcherRegistry = new ProblemMatcherRegistryImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvYmxlbU1hdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2NvbW1vbi9wcm9ibGVtTWF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEySmhHLHNEQUVDO0lBa0NELGtDQW1EQztJQTBERCw4Q0FPQztJQTNSRCxJQUFZLGdCQU1YO0lBTkQsV0FBWSxnQkFBZ0I7UUFDM0IsNkRBQU8sQ0FBQTtRQUNQLCtEQUFRLENBQUE7UUFDUiwrREFBUSxDQUFBO1FBQ1IsbUVBQVUsQ0FBQTtRQUNWLDJEQUFNLENBQUE7SUFDUCxDQUFDLEVBTlcsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFNM0I7SUFFRCxXQUFjLGdCQUFnQjtRQUM3QixTQUFnQixVQUFVLENBQUMsS0FBYTtZQUN2QyxLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzVCLElBQUksS0FBSyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUMxQixPQUFPLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUNsQyxDQUFDO2lCQUFNLElBQUksS0FBSyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUNsQyxDQUFDO2lCQUFNLElBQUksS0FBSyxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUNuQyxPQUFPLGdCQUFnQixDQUFDLFVBQVUsQ0FBQztZQUNwQyxDQUFDO2lCQUFNLElBQUksS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztZQUNoQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFiZSwyQkFBVSxhQWF6QixDQUFBO0lB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
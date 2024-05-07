import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport, BrowserMessageReader, BrowserMessageWriter,
	SemanticTokenTypes, SemanticTokenModifiers
} from 'vscode-languageserver/browser';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import * as lib from '../../_build/default/jslib/main.bc.js'
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);
const connection = createConnection(messageReader, messageWriter);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

const tokenTypes = [SemanticTokenTypes.function, SemanticTokenTypes.variable, SemanticTokenTypes.keyword, SemanticTokenTypes.number];
const tokenModifiers = [SemanticTokenModifiers.definition];

connection.onInitialize((params: InitializeParams) => {
	console.log('onInitialize', params)
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	// const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},
			semanticTokensProvider: {
				legend: { tokenTypes, tokenModifiers },
				documentSelector: [{ language: 'mod' }],
				full: true,
			},
			hoverProvider: true,
			documentFormattingProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});


connection.onInitialized(() => {
	console.log('onInitialized')
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});


// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.languages.semanticTokens.on(async ({ textDocument }) => {
	const doc = documents.get(textDocument.uri)
	const text = doc.getText()

	let t: { start: [number, number], end: [number, number]; type: string }[] = []
	try {
		t = JSON.parse(lib.tokeninfo(textDocument.uri))
	} catch (e) {
		console.log(e)
	}
	const data = t.map((e, i) => {
		const len = doc.offsetAt({ line: e.end[0], character: e.end[1] })
			- doc.offsetAt({ line: e.start[0], character: e.start[1] })
		const type = tokenTypes.findIndex(t => t === e.type)
		if (i === 0) return [e.start[0], e.start[1], len, type, 0]
		else {
			const prev = t[i - 1]
			let deltaLine = e.start[0] - prev.start[0]
			let deltaChar = e.start[1]
			if (e.start[0] === prev.start[0]) deltaChar = deltaChar - prev.start[1]
			return [deltaLine, deltaChar, len, type, 0]
		}
	})
	return {
		data: data.flat()
	}
})
// Only keep settings for open documents
documents.onDidClose(e => {
	console.log('onDidClose', e)
	documentSettings.delete(e.document.uri);
});

connection.onHover(async ({ textDocument, position }) => {
	const text = documents.get(textDocument.uri).getText()
	console.log(text, position)
	const ty: string = lib.typeinfo(textDocument.uri, position.line, position.character)
	console.log(ty)
	return {

		'contents': ty
	}
})


connection.languages.diagnostics.on(async (params) => {
	return {
		kind: DocumentDiagnosticReportKind.Full,
		items: []
	};

});

type Pos = [number, number]
type DocData = {
	[K in string]: {
		tokens: { start: Pos; end: Pos; type: string }[],
		formatted: string,
		diagnostics: { start: Pos, end: Pos, msg: string }[]
	}
}

const docData: DocData = {}
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log('onDidChangeContent')
	const doc = change.document
	console.log(doc.uri)
	lib.filechange(doc.uri, doc.getText())

});


connection.onDocumentFormatting(async ({ textDocument }) => {
	const doc = documents.get(textDocument.uri)
	const text = doc.getText()
	const newText = lib.format(textDocument.uri)
	return [{
		range: {
			start: doc.positionAt(0),
			end: doc.positionAt(text.length)
		},
		newText
	}]
})



connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

connection.onDocumentHighlight
// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		console.log('onCompletion')
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		console.log('onCompletionResolve', item)
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

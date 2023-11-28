// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "http-mocker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('http-mocker.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VSCode!!!!!!!');
	});

	const provider = new EnabledProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(EnabledProvider.viewType, provider));

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	const kill = require('kill-port');
	kill(8080, 'tcp');
}

class EnabledProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'http-mocker-enabled';

	private _view?: vscode.WebviewView;

	private mockerEnabled: boolean = false;

	private app: any = null;
	private server: any = null;

	private requests: any = [];

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		let stopServer = () => {
			if (this.server) {
				this.server.close();
			}
		};

		let startServer = (forwardTo: string) => {
			const express = require('express');
			const axios = require('axios');
			this.app = express();
			this.app.use(express.json());
			this.app.use(express.urlencoded());
	
			this.app.all('*', function(req: any, res: any) {
				const reqMethod = req.method;
				const reqPath = req.url;
				const reqBody = req.body;
				let reqHeaders: any = {};
				for (let i = 0; i < req.rawHeaders.length; i += 2) {
					if (req.rawHeaders[i] !== 'Host') {
						reqHeaders[req.rawHeaders[i]] = req.rawHeaders[i + 1];
					}
				}
				let resStatusCode = res.status;
				let resBody = res.body;
				let resHeaders = res.headers;
				let resError: any = null;
				if (req.method === 'GET') {
					axios.get('http://' + forwardTo + req.path, {
						headers: reqHeaders
					}).then((response: any) => {
						res.status(response.status).send(response.data);
						resStatusCode = response.status;
						resBody = response.data;
						resHeaders = response.headers;
					}).catch((error: any) => {
						resError = error;
						if (error.response) {
							res.status(error.response.status).send(error.response.data);
							resStatusCode = error.response.status;
							resBody = error.response.data;
							resHeaders = error.response.headers;
						}
					}).finally(() => {
						webviewView.webview.postMessage({
							command: 'request',
							reqMethod: reqMethod || '',
							reqPath: reqPath || '',
							reqHeaders: reqHeaders || '',
							reqBody: reqBody || '',
							resStatusCode: resStatusCode || '',
							resHeaders: resHeaders || '',
							resBody: resBody || '',
							resError: resError || '',
							forwardTo: forwardTo
						});
					});
				} else if (req.method === 'POST') {
					axios.post('https://' + forwardTo + req.path, reqBody, {
						headers: reqHeaders
					}).then((response: any) => {
						console.log(response);
						res.status(response.status).send(response.data);
						resStatusCode = response.status;
						resBody = response.data;
						resHeaders = response.headers;
					}).catch((error: any) => {
						resError = error;
						if (error.response) {
							res.status(error.response.status).send(error.response.data);
							resStatusCode = error.response.status;
							resBody = error.response.data;
							resHeaders = error.response.headers;
						}
					}).finally(() => {
						webviewView.webview.postMessage({
							command: 'request',
							reqMethod: reqMethod || '',
							reqPath: reqPath || '',
							reqHeaders: reqHeaders || '',
							reqBody: reqBody || '',
							resStatusCode: resStatusCode || '',
							resBody: resBody || '',
							resError: resError || '',
							resHeaders: resHeaders || '',
							forwardTo: forwardTo
						});
					});
				}
			});

			this.server = this.app.listen(8080, () => {
				console.log(`Example app listening on port 8080`);
			});
		};

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.command) {
				case 'enableMocker':
					{
						startServer(data.forwardTo || '');
						break;
					}
				case 'disableMocker':
					{
						stopServer();
						break;
					}
				case 'changeForward':
					{
						if (this.server) {
							stopServer();
							console.log('forwardTo: ', data.forwardTo);
							startServer(data.forwardTo || '');
						}
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleMainUri}" rel="stylesheet">

				<title>Mocker Enabled</title>
			</head>
			<body>
				<label class="switch">
					<input type="checkbox" id="enable-switch">
					<span class="slider round"></span>
		 		</label>
				<span id="enabled-span">Mocker ${this.mockerEnabled ? 'Enabled' : 'Disabled'}</span>
				<span> (http://localhost:8080)</span>
				<div class="info">
					<i>Mocker reloads automatically when you make changes below.</i>
				</div>
				<div id="discoverPathsHeader" class="header clickable">
					<span id="discoverPathsIcon">
						<svg id="discoverPathsSvg" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon open"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
					</span>
					<b>DISCOVER PATHS</b>
				</div>
				<div id="discoverPathsBody" class="body">
					<div>
						<div>Forward requests with no matching mock endpoint to this host:</div>
						<label>http://</label><input id="forwardInput" placeholder="api.twilio.com">
						<span id="clearLog" class="clickable" hidden>Clear Log</span>
					</div>
					<div id="noRequests" class="info">
						<i>No requests have been made to http://localhost:8080 yet. Try enabling the mocker above, and configuring your service to make requests to http://localhost:8080, to see information here about requests that were made.</i>
					</div>
					<div id="requestsLog"></div>
				</div>
				<div id="mockEndpointsHeader" class="header clickable">
					<span id="mockEndpointsIcon" class="clickable">
						<svg id="mockEndpointsSvg" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="header-icon open"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
					</span>
					<b>MOCK ENDPOINTS</b>
				</div>
				<div id="mockEndpointsBody" class="body">
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
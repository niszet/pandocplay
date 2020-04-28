import * as vscode from 'vscode';
import { Pandocplay } from './pandocplay/main';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "pandocplay" is now active!');

	const main = new Pandocplay();

	// run for selection
	let disposable = vscode.commands.registerCommand('pandocplay.execute-cursor', () => {
		main.run_selection();
	});

	// run for codeblock
	let codeblock = vscode.commands.registerCommand('pandocplay.execute-in-codeblock', () => {
		main.run_codeblock();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(codeblock);

}

export function deactivate() {}

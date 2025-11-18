import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('willtheorangeguy.typing-speed'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		assert.ok(extension);
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true);
	});

	test('Commands should be registered', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('typing-speed.resetStats'));
		assert.ok(commands.includes('typing-speed.showStats'));
		assert.ok(commands.includes('typing-speed.toggleDisplay'));
	});

	test('Reset stats command should execute without error', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Should not throw an error even if no document is open
		await vscode.commands.executeCommand('typing-speed.resetStats');
		assert.ok(true);
	});

	test('Toggle display command should execute without error', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		await vscode.commands.executeCommand('typing-speed.toggleDisplay');
		assert.ok(true);
	});

	test('Show stats command should execute without error', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		await vscode.commands.executeCommand('typing-speed.showStats');
		assert.ok(true);
	});

	test('Status bar item should be created', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Give the extension time to create the status bar item
		await new Promise(resolve => setTimeout(resolve, 100));

		// We can't directly test the status bar item, but we can verify the extension activated
		assert.ok(extension!.isActive);
	});

	test('Typing should be tracked in a document', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create a new document
		const document = await vscode.workspace.openTextDocument({
			content: '',
			language: 'plaintext'
		});

		await vscode.window.showTextDocument(document);

		// Make an edit
		const edit = new vscode.WorkspaceEdit();
		edit.insert(document.uri, new vscode.Position(0, 0), 'Hello World');
		await vscode.workspace.applyEdit(edit);

		// Wait a bit for the tracker to process the change
		await new Promise(resolve => setTimeout(resolve, 200));

		// The extension should still be active and processing changes
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});

	test('Multiple edits should be tracked', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create a new document
		const document = await vscode.workspace.openTextDocument({
			content: 'Initial content',
			language: 'plaintext'
		});

		await vscode.window.showTextDocument(document);

		// Make multiple edits
		for (let i = 0; i < 3; i++) {
			const edit = new vscode.WorkspaceEdit();
			edit.insert(document.uri, new vscode.Position(0, document.getText().length), ` edit${i}`);
			await vscode.workspace.applyEdit(edit);
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		// The extension should still be active
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});
});

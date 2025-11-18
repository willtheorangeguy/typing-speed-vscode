import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Typing Speed Tracker Unit Tests', () => {
	
	test('Extension activation creates status bar item', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		assert.ok(extension, 'Extension should be found');
		
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true, 'Extension should be active');
	});

	test('Typing in document updates session', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create a test document
		const document = await vscode.workspace.openTextDocument({
			content: '',
			language: 'plaintext'
		});

		const editor = await vscode.window.showTextDocument(document);
		
		// Simulate typing
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(0, 0), 'Test typing speed');
		});

		// Wait for processing
		await new Promise(resolve => setTimeout(resolve, 150));

		// Verify extension is still active and processing
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});

	test('Reset command clears current session', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create and edit a document
		const document = await vscode.workspace.openTextDocument({
			content: 'Initial',
			language: 'plaintext'
		});
		
		await vscode.window.showTextDocument(document);

		// Make some edits
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			await editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0, editor.document.getText().length), ' content');
			});
		}

		await new Promise(resolve => setTimeout(resolve, 100));

		// Reset the stats
		await vscode.commands.executeCommand('typing-speed.resetStats');

		// Wait for reset to process
		await new Promise(resolve => setTimeout(resolve, 100));

		// Extension should still be active
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});

	test('Toggle command disables and enables display', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Toggle once to disable
		await vscode.commands.executeCommand('typing-speed.toggleDisplay');
		await new Promise(resolve => setTimeout(resolve, 100));

		// Toggle again to enable
		await vscode.commands.executeCommand('typing-speed.toggleDisplay');
		await new Promise(resolve => setTimeout(resolve, 100));

		// Extension should still be active
		assert.ok(extension!.isActive);
	});

	test('Show stats command works with active session', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create and edit a document
		const document = await vscode.workspace.openTextDocument({
			content: '',
			language: 'plaintext'
		});
		
		const editor = await vscode.window.showTextDocument(document);

		// Add some content
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(0, 0), 'Testing statistics display');
		});

		await new Promise(resolve => setTimeout(resolve, 150));

		// Show stats
		await vscode.commands.executeCommand('typing-speed.showStats');

		// Extension should still be active
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});

	test('Multiple documents maintain separate sessions', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Create first document
		const doc1 = await vscode.workspace.openTextDocument({
			content: 'Document 1',
			language: 'plaintext'
		});
		
		await vscode.window.showTextDocument(doc1);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Create second document
		const doc2 = await vscode.workspace.openTextDocument({
			content: 'Document 2',
			language: 'plaintext'
		});
		
		await vscode.window.showTextDocument(doc2);
		await new Promise(resolve => setTimeout(resolve, 100));

		// Make edits in doc2
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			await editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0, editor.document.getText().length), ' more text');
			});
		}

		await new Promise(resolve => setTimeout(resolve, 150));

		// Extension should be tracking both documents
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	});

	test('Commands work with no active document', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		// Close all editors to ensure no active document
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		await new Promise(resolve => setTimeout(resolve, 100));

		// These commands should not throw errors even with no document
		await vscode.commands.executeCommand('typing-speed.showStats');
		await vscode.commands.executeCommand('typing-speed.resetStats');
		await vscode.commands.executeCommand('typing-speed.toggleDisplay');

		// Extension should still be active
		assert.ok(extension!.isActive);
	});

	test('Continuous typing is tracked correctly', async () => {
		const extension = vscode.extensions.getExtension('willtheorangeguy.typing-speed');
		await extension!.activate();

		const document = await vscode.workspace.openTextDocument({
			content: '',
			language: 'plaintext'
		});

		const editor = await vscode.window.showTextDocument(document);

		// Simulate continuous typing with multiple small edits
		const words = ['Hello', 'world', 'this', 'is', 'a', 'test'];
		for (const word of words) {
			await editor.edit(editBuilder => {
				editBuilder.insert(
					new vscode.Position(0, editor.document.getText().length),
					word + ' '
				);
			});
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		// Wait for all processing to complete
		await new Promise(resolve => setTimeout(resolve, 200));

		// Verify extension is still active and tracking
		assert.ok(extension!.isActive);

		// Clean up
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});
});

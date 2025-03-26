const vscode = require('vscode');

/**
 * Activates the extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Register the command to insert a section header
    let disposable = vscode.commands.registerCommand('sectionHeader.insertHeader', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;
        let headerText = '';
        
        // Determine indentation
        let indentation = '';
        if (editor.document.languageId === 'python') {
            try {
                let lineToCheck = selection.isEmpty ? selection.active.line : selection.start.line;
                const line = editor.document.lineAt(lineToCheck);
                const match = line.text.match(/^(\s+)/);
                if (match) {
                    indentation = match[1];
                }
            } catch (error) {
                console.error("Error determining indentation:", error);
            }
        }

        // Get comment style
        const commentStyle = getCommentStyle(editor.document.languageId);
        
        // Handle selected text or prompt for input
        if (!selection.isEmpty) {
            // Get the selected text
            headerText = editor.document.getText(selection);
            
            // Delete the selected text first
            await editor.edit(editBuilder => {
                editBuilder.delete(selection);
            });
        } else {
            // If no selection, prompt for input
            headerText = await vscode.window.showInputBox({
                placeHolder: 'Enter section header text',
                prompt: 'The text will be centered in the header'
            });

            if (!headerText) {
                return; // User cancelled
            }
        }
        
        // Generate the header with indentation
        const header = generateHeader(headerText, commentStyle, indentation);
        
        // Insert at cursor position (which is now where the selection was)
        editor.edit(editBuilder => {
            const position = editor.selection.active;
            const line = editor.document.lineAt(position.line);
            
            // If current line is empty/whitespace-only, replace the whole line
            if (line.text.trim() === '') {
                editBuilder.replace(line.range, header);
            } else {
                editBuilder.insert(position, header);
            }
        });
    });

    context.subscriptions.push(disposable);
}

/**
 * Get the comment style for the given language
 * @param {string} languageId 
 * @returns {object} Comment style with prefix and suffix
 */
function getCommentStyle(languageId) {
    // Default to # style comments
    let prefix = '# ';
    let suffix = ' #';

    switch (languageId) {
        case 'javascript':
        case 'typescript':
        case 'javascriptreact':
        case 'typescriptreact':
        case 'java':
        case 'c':
        case 'cpp':
        case 'csharp':
        case 'php':
            prefix = '// ';
            suffix = ' //';
            break;
        case 'html':
        case 'xml':
        case 'svg':
            prefix = '<!-- ';
            suffix = ' -->';
            break;
        case 'css':
        case 'scss':
        case 'less':
            prefix = '/* ';
            suffix = ' */';
            break;
        case 'python':
        case 'yaml':
        case 'shellscript':
        case 'ruby':
        case 'dockerfile':
            prefix = '# ';
            suffix = ' #';
            break;
    }

    return { prefix, suffix };
}

/**
 * Generate a formatted header with the given text
 * @param {string} text 
 * @param {object} commentStyle 
 * @param {string} indentation - Optional indentation to prepend to each line
 * @returns {string} Formatted header
 */
function generateHeader(text, commentStyle, indentation = '') {
    const { prefix, suffix } = commentStyle;
    
    // Calculate the line width (adjust as needed)
    const lineWidth = 100;
    
    // First line: full separator
    const separatorLine = prefix + '-'.repeat(lineWidth - prefix.length - suffix.length) + suffix;
    
    // Middle line: centered text
    const paddingWidth = Math.floor((lineWidth - prefix.length - suffix.length - text.length) / 2);
    const centeredText = prefix + ' '.repeat(paddingWidth) + text + ' '.repeat(lineWidth - prefix.length - suffix.length - paddingWidth - text.length) + suffix;
    
    // Build the full header with optional indentation
    return `${indentation}${separatorLine}\n${indentation}${centeredText}\n${indentation}${separatorLine}\n`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 
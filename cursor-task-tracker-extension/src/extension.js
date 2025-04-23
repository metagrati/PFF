/**
 * Cursor Task Progress Tracker Extension
 * 
 * This extension provides visual tracking of task implementation progress
 * from task_list1.json within the Cursor IDE.
 */

// Cursor extension API
const cursor = require('cursor');

// Constants
const EXTENSION_NAME = 'Task Progress Tracker';
const DEFAULT_TASK_FILE = 'data/task_list1.json';
const DEFAULT_IMPL_DIR = 'implementations';

// Global state
let taskTreeProvider = null;
let statusBarItem = null;

/**
 * Called when the extension is activated
 * @param {Object} context - Extension context
 */
function activate(context) {
  console.log(`${EXTENSION_NAME} extension is now active!`);
  
  // Get configuration
  const config = cursor.workspace.getConfiguration('taskTracker');
  const taskFilePath = config.get('taskFilePath', DEFAULT_TASK_FILE);
  const implementationDir = config.get('implementationDir', DEFAULT_IMPL_DIR);
  
  // Register tree data provider for task view
  taskTreeProvider = new TaskTreeProvider(taskFilePath, implementationDir);
  cursor.window.registerTreeDataProvider('taskTrackerView', taskTreeProvider);
  
  // Create status bar item
  statusBarItem = cursor.window.createStatusBarItem(cursor.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(tasklist) Tasks';
  statusBarItem.tooltip = 'Show Task Tracker';
  statusBarItem.command = 'extension.showTaskTracker';
  statusBarItem.show();
  
  // Register commands
  context.subscriptions.push(
    cursor.commands.registerCommand('extension.showTaskTracker', () => {
      cursor.commands.executeCommand('workbench.view.extension.task-tracker');
    }),
    
    cursor.commands.registerCommand('extension.refreshTasks', () => {
      taskTreeProvider.refresh();
      cursor.window.showInformationMessage('Task list refreshed');
    }),
    
    cursor.commands.registerCommand('extension.generateReport', () => {
      generateReport(taskTreeProvider.tasks, implementationDir);
    })
  );
  
  // Watch for changes to the task file
  const taskFileWatcher = cursor.workspace.createFileSystemWatcher(taskFilePath);
  context.subscriptions.push(
    taskFileWatcher.onDidChange(() => taskTreeProvider.refresh()),
    taskFileWatcher,
    statusBarItem
  );
}

/**
 * Called when the extension is deactivated
 */
function deactivate() {
  console.log(`${EXTENSION_NAME} extension is now deactivated`);
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

/**
 * Task Tree Data Provider
 * Provides data for the task tree view
 */
class TaskTreeProvider {
  constructor(taskFilePath, implementationDir) {
    this.taskFilePath = taskFilePath;
    this.implementationDir = implementationDir;
    this.tasks = [];
    this._onDidChangeTreeData = new cursor.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.loadTasks();
  }
  
  /**
   * Load tasks from the task file
   */
  async loadTasks() {
    try {
      const taskFiles = await cursor.workspace.findFiles(this.taskFilePath, 1);
      if (!taskFiles || taskFiles.length === 0) {
        console.error(`Task file not found: ${this.taskFilePath}`);
        this.tasks = [];
        return;
      }
      
      const content = await cursor.workspace.fs.readFile(taskFiles[0]);
      this.tasks = JSON.parse(content);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('Error loading tasks:', error);
      cursor.window.showErrorMessage(`Error loading tasks: ${error.message}`);
      this.tasks = [];
    }
  }
  
  /**
   * Refresh the task tree view
   */
  refresh() {
    this.loadTasks();
  }
  
  /**
   * Get tree item for a task
   * @param {Object} task - Task object
   * @returns {TreeItem} Tree item
   */
  getTreeItem(task) {
    const treeItem = new cursor.TreeItem(
      `${task.task_id}: ${task.title}`,
      cursor.TreeItemCollapsibleState.None
    );
    
    // Set icon based on status
    if (task.status === 'Completed') {
      treeItem.iconPath = new cursor.ThemeIcon('check');
      treeItem.description = 'Completed';
    } else if (task.status === 'In Progress') {
      treeItem.iconPath = new cursor.ThemeIcon('sync');
      treeItem.description = 'In Progress';
    } else {
      treeItem.iconPath = new cursor.ThemeIcon('circle-outline');
      treeItem.description = 'Not Started';
    }
    
    // Command to open or create implementation file
    treeItem.command = {
      command: 'extension.openTask',
      title: 'Open Task',
      arguments: [task]
    };
    
    return treeItem;
  }
  
  /**
   * Get children of a tree item
   * @param {Object} element - Tree item element
   * @returns {Array} Children
   */
  getChildren(element) {
    if (!element) {
      return this.tasks;
    }
    return [];
  }
}

/**
 * Generate a Markdown report of task status
 * @param {Array} tasks - Array of tasks
 * @param {string} implementationDir - Implementation directory
 */
async function generateReport(tasks, implementationDir) {
  try {
    cursor.window.withProgress({
      location: cursor.ProgressLocation.Notification,
      title: 'Generating task report...',
      cancellable: false
    }, async (progress) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      
      // Calculate statistics
      let completedCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      
      tasks.forEach(task => {
        if (task.status === 'Completed') completedCount++;
        else if (task.status === 'In Progress') inProgressCount++;
        else notStartedCount++;
      });
      
      const totalTasks = tasks.length;
      const completionPercent = Math.round((completedCount / totalTasks) * 100);
      
      // Generate report content
      let report = `# Task Implementation Report
      
Generated: ${dateStr}

## Overview

- **Completion Rate**: ${completionPercent}% (${completedCount}/${totalTasks})
- **In Progress**: ${inProgressCount} tasks
- **Not Started**: ${notStartedCount} tasks

## Task Details

`;

      // Add task details
      tasks.forEach(task => {
        const statusEmoji = 
          task.status === 'Completed' ? '✅' : 
          task.status === 'In Progress' ? '🔄' : '⏳';
              
        report += `### ${statusEmoji} ${task.task_id}: ${task.title}

- **Status**: ${task.status}
- **Goal**: ${task.goal}
- **Estimated Time**: ${task.estimated_time}
- **Dependencies**: ${task.dependencies}

**Definition of Done**:
${task.definition_of_done.map(item => `- ${item}`).join('\n')}

`;
      });
      
      // Save report
      const reportFile = `task-implementation-report-${dateStr}.md`;
      const workspaceFolders = cursor.workspace.workspaceFolders;
      
      if (workspaceFolders && workspaceFolders.length > 0) {
        const reportUri = cursor.Uri.joinPath(workspaceFolders[0].uri, reportFile);
        await cursor.workspace.fs.writeFile(reportUri, Buffer.from(report));
        
        // Open report
        const document = await cursor.workspace.openTextDocument(reportUri);
        await cursor.window.showTextDocument(document);
        
        cursor.window.showInformationMessage(`Task report generated: ${reportFile}`);
      } else {
        cursor.window.showErrorMessage('No workspace folder found');
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    cursor.window.showErrorMessage(`Error generating report: ${error.message}`);
  }
}

/**
 * Open or create an implementation file for a task
 * @param {Object} task - Task object
 * @param {string} implementationDir - Implementation directory
 */
async function openTaskImplementation(task, implementationDir) {
  try {
    // Create implementation file name
    const fileName = `${task.task_id.toLowerCase().replace(/\./g, '_')}.js`;
    const filePath = `${implementationDir}/${fileName}`;
    
    // Check if file exists
    const files = await cursor.workspace.findFiles(filePath, 1);
    
    if (files && files.length > 0) {
      // File exists, open it
      const document = await cursor.workspace.openTextDocument(files[0]);
      await cursor.window.showTextDocument(document);
    } else {
      // File doesn't exist, offer to create it
      const choice = await cursor.window.showInformationMessage(
        `Create implementation file for ${task.task_id}: ${task.title}?`,
        'Create',
        'Cancel'
      );
      
      if (choice === 'Create') {
        // Create implementation file
        createImplementationFile(task, implementationDir);
      }
    }
  } catch (error) {
    console.error('Error opening task:', error);
    cursor.window.showErrorMessage(`Error opening task: ${error.message}`);
  }
}

/**
 * Create an implementation file for a task
 * @param {Object} task - Task object
 * @param {string} implementationDir - Implementation directory
 */
async function createImplementationFile(task, implementationDir) {
  try {
    // Create implementation file name
    const fileName = `${task.task_id.toLowerCase().replace(/\./g, '_')}.js`;
    const workspaceFolders = cursor.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      cursor.window.showErrorMessage('No workspace folder found');
      return;
    }
    
    // Create implementation directory if it doesn't exist
    const implDirUri = cursor.Uri.joinPath(workspaceFolders[0].uri, implementationDir);
    try {
      await cursor.workspace.fs.createDirectory(implDirUri);
    } catch (err) {
      // Directory may already exist
    }
    
    // Create file URI
    const fileUri = cursor.Uri.joinPath(implDirUri, fileName);
    
    // Template for the implementation file
    const template = `/**
 * ${task.task_id}: ${task.title}
 * 
 * Goal: ${task.goal}
 * 
 * Definition of Done:
 * ${task.definition_of_done.map(item => ` * - ${item}`).join('\n')}
 * 
 * Estimated Time: ${task.estimated_time}
 * Dependencies: ${task.dependencies}
 * UI Behavior: ${task.ui_behavior}
 */

// TODO: Implement this task

export function ${task.task_id.toLowerCase().replace(/\./g, '_')}() {
  // Implementation goes here
}

// Tests
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  
  describe('${task.task_id}', () => {
    it('should implement requirements', () => {
      // Test implementation
      expect(true).toBe(true);
    });
  });
}
`;
    
    // Write file
    await cursor.workspace.fs.writeFile(fileUri, Buffer.from(template));
    
    // Open file
    const document = await cursor.workspace.openTextDocument(fileUri);
    await cursor.window.showTextDocument(document);
    
    // Update task status
    await updateTaskStatus(task.task_id, 'In Progress');
    
    cursor.window.showInformationMessage(`Created implementation file for ${task.task_id}`);
  } catch (error) {
    console.error('Error creating implementation file:', error);
    cursor.window.showErrorMessage(`Error creating implementation file: ${error.message}`);
  }
}

/**
 * Update task status in the task file
 * @param {string} taskId - Task ID
 * @param {string} status - New status
 */
async function updateTaskStatus(taskId, status) {
  try {
    const taskFiles = await cursor.workspace.findFiles(DEFAULT_TASK_FILE, 1);
    if (!taskFiles || taskFiles.length === 0) {
      console.error(`Task file not found: ${DEFAULT_TASK_FILE}`);
      return;
    }
    
    // Read task file
    const content = await cursor.workspace.fs.readFile(taskFiles[0]);
    const tasks = JSON.parse(content);
    
    // Find and update task
    const taskIndex = tasks.findIndex(task => task.task_id === taskId);
    if (taskIndex === -1) {
      console.error(`Task not found: ${taskId}`);
      return;
    }
    
    tasks[taskIndex].status = status;
    
    // Write updated tasks
    await cursor.workspace.fs.writeFile(
      taskFiles[0],
      Buffer.from(JSON.stringify(tasks, null, 2))
    );
    
    // Refresh task view
    if (taskTreeProvider) {
      taskTreeProvider.refresh();
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    cursor.window.showErrorMessage(`Error updating task status: ${error.message}`);
  }
}

// Register command to open tasks
cursor.commands.registerCommand('extension.openTask', (task) => {
  const config = cursor.workspace.getConfiguration('taskTracker');
  const implementationDir = config.get('implementationDir', DEFAULT_IMPL_DIR);
  openTaskImplementation(task, implementationDir);
});

// Export extension API
module.exports = {
  activate,
  deactivate
}; 
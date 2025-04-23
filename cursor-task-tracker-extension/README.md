# Task Progress Tracker for Cursor IDE

A Cursor IDE extension that provides visual tracking of task implementation progress from `task_list1.json`.

## Features

- **Task Visualization**: View all tasks from your `task_list1.json` file with status indicators
- **Status Tracking**: Automatically track task status (Not Started, In Progress, Completed)
- **Implementation Generation**: Create template implementation files directly from the task view
- **Progress Reporting**: Generate detailed Markdown reports of task implementation status
- **Status Bar Integration**: Quick access to task tracker from status bar

![Task Tracker Screenshot](images/task-tracker-screenshot.png)

## Installation

### From Extension Marketplace

1. Open Cursor IDE
2. Open the Extensions view (Ctrl+Shift+X)
3. Search for "Task Progress Tracker"
4. Click Install

### Manual Installation

1. Download the `.vsix` file from the [releases page](https://github.com/cursor-extensions/task-progress-tracker/releases)
2. Run `cursor --install-extension task-progress-tracker-x.x.x.vsix`

### Development Build

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Copy the extension folder to Cursor extensions directory

## Usage

### Configuring the Extension

You can configure the extension in your Cursor settings:

```json
{
  "taskTracker.taskFilePath": "data/task_list1.json",
  "taskTracker.implementationDir": "implementations"
}
```

### Viewing Tasks

1. Click the checklist icon in the activity bar to show the Task Tracker view
2. Alternatively, click the "Tasks" button in the status bar

The task view shows:
- Task ID and title
- Current status (using icons)
- Progress statistics

### Working with Tasks

- **Open a task**: Click on a task to open its implementation file
- **Create implementation**: If the implementation file doesn't exist, you'll be prompted to create it
- **Refresh tasks**: Click the refresh button in the view title bar
- **Generate report**: Click the report button to create a detailed Markdown report

### Task Status Updates

Task status is updated automatically:
- Creating an implementation file sets status to "In Progress"
- You can manually update status by editing the `task_list1.json` file

## Task File Format

The extension expects a JSON file with the following structure:

```json
[
  {
    "task_id": "F1.1",
    "title": "Support Multi-Connector Detection",
    "goal": "Support environments with more than one ready connector",
    "definition_of_done": [
      "Auto-select connector if only one is `.ready`",
      "Render dropdown or modal selector if multiple available"
    ],
    "estimated_time": "20–30 min",
    "dependencies": "Base connect UI",
    "ui_behavior": "Show selector if multiple connectors detected",
    "status": "Not Started"
  }
]
```

## Requirements

- Cursor IDE v0.12.0 or later

## Extension Settings

This extension contributes the following settings:

* `taskTracker.taskFilePath`: Path to the JSON file containing task definitions
* `taskTracker.implementationDir`: Directory path where implementation files will be created

## Known Issues

See the [issue tracker](https://github.com/cursor-extensions/task-progress-tracker/issues) for current issues.

## Release Notes

### 1.0.0

- Initial release with basic task tracking functionality
- Task view with status indicators
- Implementation file generation
- Report generation
- Status bar integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
#!/usr/bin/env node
/**
 * Task Progress Tracker Extension Installation Script
 * 
 * This script helps install the Task Progress Tracker extension into Cursor IDE.
 * It copies the necessary files to the Cursor extensions directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Extension info
const EXTENSION_ID = 'cursor-task-tracker';
const EXTENSION_NAME = 'Task Progress Tracker';

// Try to find Cursor extensions directory
function getCursorExtensionsDir() {
  let extensionsDir;
  
  if (process.platform === 'win32') {
    extensionsDir = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'cursor', 'resources', 'app', 'extensions');
  } else if (process.platform === 'darwin') {
    extensionsDir = path.join('/Applications', 'Cursor.app', 'Contents', 'Resources', 'app', 'extensions');
  } else if (process.platform === 'linux') {
    extensionsDir = path.join(os.homedir(), '.cursor', 'extensions');
  }
  
  if (extensionsDir && fs.existsSync(extensionsDir)) {
    return extensionsDir;
  }
  
  // Try to get from environment variable or config
  if (process.env.CURSOR_EXTENSIONS_DIR) {
    return process.env.CURSOR_EXTENSIONS_DIR;
  }
  
  return null;
}

// Main install function
async function installExtension() {
  console.log(`Installing ${EXTENSION_NAME} extension...`);
  
  try {
    // Check if we have webpack installed
    try {
      execSync('npm list webpack', { stdio: 'ignore' });
    } catch (e) {
      console.log('Installing required dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Build the extension
    console.log('Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Find Cursor extensions directory
    const extensionsDir = getCursorExtensionsDir();
    if (!extensionsDir) {
      console.error('Error: Could not find Cursor extensions directory.');
      console.log('Please install the extension manually:');
      console.log('1. Run "npm run build"');
      console.log('2. Copy the contents of this directory to your Cursor extensions directory');
      return;
    }
    
    // Create extension directory in Cursor extensions
    const extensionDir = path.join(extensionsDir, EXTENSION_ID);
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    
    // Copy extension files
    console.log(`Copying extension files to ${extensionDir}...`);
    
    // List of files/directories to copy
    const filesToCopy = [
      'package.json',
      'README.md',
      'dist',
      'icons'
    ];
    
    for (const file of filesToCopy) {
      const src = path.join(__dirname, file);
      const dest = path.join(extensionDir, file);
      
      if (fs.existsSync(src)) {
        if (fs.lstatSync(src).isDirectory()) {
          // Copy directory
          copyDirectory(src, dest);
        } else {
          // Copy file
          fs.copyFileSync(src, dest);
        }
      }
    }
    
    console.log(`${EXTENSION_NAME} extension has been installed successfully!`);
    console.log('Please restart Cursor IDE to use the extension.');
  } catch (error) {
    console.error('Error installing extension:', error);
    process.exit(1);
  }
}

// Helper function to copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run installer
installExtension().catch(console.error); 
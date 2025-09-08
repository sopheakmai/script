const fs = require('fs');
const path = require('path');
const translations = require('./translation-scanner.json')

// File extensions to scan (add more as needed)
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.json'];

// Directories to ignore
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

class TranslationScanner {
  constructor(projectPaths, translationsObj) {
    // Handle both single path (string) and multiple paths (array)
    this.projectPaths = Array.isArray(projectPaths) ? projectPaths : [projectPaths];
    this.translations = translationsObj;
    this.processedFiles = [];
    this.replacements = [];
  }

  // Check if file should be processed
  shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return fileExtensions.includes(ext);
  }

  // Check if directory should be ignored
  shouldIgnoreDir(dirPath) {
    const dirName = path.basename(dirPath);
    return ignoreDirs.includes(dirName);
  }

  // Recursively scan directory
  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !this.shouldIgnoreDir(fullPath)) {
        this.scanDirectory(fullPath);
      } else if (stat.isFile() && this.shouldProcessFile(fullPath)) {
        this.processFile(fullPath);
      }
    }
  }

  // Process individual file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;
      
      // Replace each translation (only full phrase, not substring)
      for (const [chinese, english] of Object.entries(this.translations)) {
        if (content.includes(chinese)) {
          // Use negative lookahead/lookbehind to avoid partial matches inside other Chinese words
          // For Chinese, use (?<![\u4e00-\u9fff]) and (?![\u4e00-\u9fff])
          const regex = new RegExp(`(?<![\u4e00-\u9fff])${this.escapeRegex(chinese)}(?![\u4e00-\u9fff])`, 'g');
          const matches = content.match(regex);
          if (matches) {
            newContent = newContent.replace(regex, english);
            hasChanges = true;
            this.replacements.push({
              file: filePath,
              original: chinese,
              replacement: english,
              count: matches.length
            });
          }
        }
      }
      
      // Write back to file if changes were made
      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.processedFiles.push(filePath);
      }
      
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error.message);
    }
  }

  // Escape special regex characters
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Main scan method
  scan() {
    console.log('🔍 Starting translation scan...');
    console.log(`📁 Project paths: ${this.projectPaths.join(', ')}`);
    console.log(`🔤 Translations loaded: ${Object.keys(this.translations).length}`);
    console.log('');
    
    const startTime = Date.now();
    
    // Scan each directory
    for (const projectPath of this.projectPaths) {
      if (!fs.existsSync(projectPath)) {
        console.error(`❌ Project path does not exist: ${projectPath}`);
        continue;
      }
      
      console.log(`📂 Scanning: ${projectPath}`);
      this.scanDirectory(projectPath);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    this.printResults(duration);
  }

  // Print scan results
  printResults(duration) {
    console.log('✅ Scan completed!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📄 Files modified: ${this.processedFiles.length}`);
    console.log(`🔄 Total replacements: ${this.replacements.length}`);
    console.log('');
    
    if (this.replacements.length > 0) {
      console.log('📝 Replacement details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const replacement of this.replacements) {
        console.log(`📁 ${replacement.file}`);
        console.log(`   ${replacement.original} → ${replacement.replacement} (${replacement.count} occurrence${replacement.count > 1 ? 's' : ''})`);
        console.log('');
      }
    } else {
      console.log('ℹ️  No translations found in project files.');
    }
  }

  // Dry run - shows what would be changed without actually changing files
  dryRun() {
    console.log('🔍 Starting dry run (no files will be modified)...');
    console.log(`📁 Project paths: ${this.projectPaths.join(', ')}`);
    console.log('');
    
    const originalProcessFile = this.processFile.bind(this);
    
    // Override processFile to not write changes
    this.processFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const [chinese, english] of Object.entries(this.translations)) {
          if (content.includes(chinese)) {
            const regex = new RegExp(this.escapeRegex(chinese), 'g');
            const matches = content.match(regex);
            
            if (matches) {
              this.replacements.push({
                file: filePath,
                original: chinese,
                replacement: english,
                count: matches.length
              });
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
      }
    };
    
    // Scan each directory
    for (const projectPath of this.projectPaths) {
      if (!fs.existsSync(projectPath)) {
        console.error(`❌ Project path does not exist: ${projectPath}`);
        continue;
      }
      
      console.log(`📂 Scanning: ${projectPath}`);
      this.scanDirectory(projectPath);
    }
    
    console.log('🔍 Dry run completed!');
    console.log(`🔄 Would make ${this.replacements.length} replacements`);
    console.log('');
    
    if (this.replacements.length > 0) {
      console.log('📝 Would replace:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const replacement of this.replacements) {
        console.log(`📁 ${replacement.file}`);
        console.log(`   ${replacement.original} → ${replacement.replacement} (${replacement.count} occurrence${replacement.count > 1 ? 's' : ''})`);
        console.log('');
      }
    }
    
    // Restore original method
    this.processFile = originalProcessFile;
  }
}

// Usage examples:
// 1. Run dry run first to see what would be changed
function runDryRun(projectPath) {
  const scanner = new TranslationScanner(projectPath, translations);
  scanner.dryRun();
}

// 2. Actually perform the replacements
function runTranslation(projectPath) {
  const scanner = new TranslationScanner(projectPath, translations);
  scanner.scan();
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const projectPath = args.find(arg => !arg.startsWith('--')) || './';
  
  console.log('🌐 Project Translation Scanner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (isDryRun) {
    runDryRun(projectPath);
  } else {
    console.log('⚠️  This will modify your files! Run with --dry-run first to preview changes.');
    console.log('');
    runTranslation(projectPath);
  }
}

// Export for use as module
module.exports = { TranslationScanner, translations };

const fs = require('fs');
const path = require('path');

// File extensions to scan
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.json', '.md'];

// Directories to ignore
const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

class SimpleChineseExtractor {
  constructor() {
    this.chineseTexts = new Set();
  }

  // Check if text contains Chinese characters
  containsChinese(text) {
    return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f]/.test(text);
  }

  // Extract Chinese text from a string
  extractChineseText(text) {
    const regex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f]+/g;
    return text.match(regex) || [];
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

  // Process individual file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (this.containsChinese(content)) {
        const chineseMatches = this.extractChineseText(content);
        chineseMatches.forEach(match => {
          if (match.trim().length > 0) {
            this.chineseTexts.add(match.trim());
          }
        });
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error.message);
    }
  }

  // Recursively scan directory
  scanDirectory(dirPath) {
    try {
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
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  // Generate JSON translation template
  generateJSON() {
    const translations = {};
    Array.from(this.chineseTexts).sort().forEach(text => {
      translations[text] = text;
    });
    return translations;
  }

  // Main extraction method
  extract(directories, outputFile = 'chinese-detector.json') {
    console.log('🔍 Extracting Chinese text...');
    console.log(`📁 Scanning: ${directories.join(', ')}`);
    
    const startTime = Date.now();
    
    // Scan each directory
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        console.error(`❌ Directory does not exist: ${dir}`);
        continue;
      }
      
      this.scanDirectory(dir);
    }
    
    const duration = (Date.now() - startTime) / 1000;
    const uniqueTexts = Array.from(this.chineseTexts);
    
    console.log(`✅ Extraction completed in ${duration}s`);
    console.log(`🔤 Found ${uniqueTexts.length} unique Chinese texts`);
    
    if (uniqueTexts.length === 0) {
      console.log('🎉 No Chinese text found!');
      return;
    }
    
    // Generate and save JSON
    const translations = this.generateJSON();
    
    try {
      fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2), 'utf8');
      console.log(`💾 Saved to: ${outputFile}`);
      
      // Show preview
      console.log('\n📝 Preview (first 10 entries):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      uniqueTexts.slice(0, 10).forEach((text, index) => {
        console.log(`${index + 1}. "${text}"`);
      });
      
      if (uniqueTexts.length > 10) {
        console.log(`... and ${uniqueTexts.length - 10} more`);
      }
      
      console.log(`\n📄 Edit ${outputFile} to replace "TRANSLATE: ..." with English translations`);
      
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
    }
  }
}

// Simple usage function
function extractChinese(directories, outputFile) {
  const extractor = new SimpleChineseExtractor();
  extractor.extract(directories, outputFile);
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🌐 Simple Chinese Text Extractor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Usage:');
    console.log('  node simple-extractor.js <directory1> [directory2] ... [output.json]');
    console.log('');
    console.log('Examples:');
    console.log('  node simple-extractor.js ./src');
    console.log('  node simple-extractor.js ./src ./components');
    console.log('  node simple-extractor.js ./src ./components my-translations.json');
    console.log('');
    console.log('Output: chinese-detector.json (default) or specified filename');
    process.exit(1);
  }
  
  // Check if last argument is a JSON file (output filename)
  const lastArg = args[args.length - 1];
  const isOutputFile = lastArg.endsWith('.json');
  
  const directories = isOutputFile ? args.slice(0, -1) : args;
  const outputFile = isOutputFile ? lastArg : 'chinese-detector.json';
  
  if (directories.length === 0) {
    console.error('❌ Please specify at least one directory to scan');
    process.exit(1);
  }
  
  extractChinese(directories, outputFile);
}

module.exports = { SimpleChineseExtractor, extractChinese };

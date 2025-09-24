#!/usr/bin/env deno run --allow-read --allow-write

/**
 * Deno script to rename files from "Title Case" to "kebab-case"
 * Example: "Arrow To Down Left.svg" -> "arrow-to-down-left.svg"
 * Files are copied to a single output folder with renamed versions
 */

import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { basename, dirname, join } from "https://deno.land/std@0.208.0/path/mod.ts";

function toKebabCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[A-Z]/g, (match, offset) => {
      // Convert uppercase to lowercase, add hyphen before if not at start
      return offset > 0 ? '-' + match.toLowerCase() : match.toLowerCase();
    })
    .replace(/--+/g, '-')           // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}

function getNewFileName(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    // No extension
    return toKebabCase(originalName);
  }
  
  const nameWithoutExt = originalName.substring(0, lastDotIndex);
  const extension = originalName.substring(lastDotIndex);
  
  return toKebabCase(nameWithoutExt) + extension;
}

async function copyFileToOutput(sourcePath: string, outputDir: string, newFileName: string): Promise<boolean> {
  try {
    // Ensure output directory exists
    await ensureDir(outputDir);
    
    const outputPath = join(outputDir, newFileName);
    
    // Check if file already exists in output directory
    try {
      await Deno.stat(outputPath);
      console.log(`⚠️  File "${newFileName}" already exists in output directory, skipping...`);
      return false;
    } catch {
      // File doesn't exist, proceed with copy
    }
    
    await Deno.copyFile(sourcePath, outputPath);
    console.log(`✅ Copied: "${sourcePath}" -> "${outputPath}"`);
    return true;
  } catch (error) {
    // console.error(`❌ Failed to copy "${sourcePath}": ${error.message}`);
    return false;
  }
}

async function processDirectory(dirPath: string = ".", outputDir: string, recursive: boolean = true): Promise<{ processed: number; success: number }> {
  let totalProcessed = 0;
  let totalSuccess = 0;

  try {
    const entries = Deno.readDir(dirPath);

    for await (const entry of entries) {
      const fullPath = dirPath === "." ? entry.name : `${dirPath}/${entry.name}`;
      
      if (entry.isFile) {
        const originalName = entry.name;
        const newName = getNewFileName(originalName);
        
        // Always copy files that need renaming OR if they already have correct names
        if (originalName !== newName) {
          totalProcessed++;
          const success = await copyFileToOutput(fullPath, outputDir, newName);
          if (success) totalSuccess++;
        } else {
          // File already has correct naming, but copy it anyway to output folder
          const success = await copyFileToOutput(fullPath, outputDir, originalName);
          if (success) {
            console.log(`ℹ️  Copied (no rename needed): "${fullPath}" -> "${outputDir}/${originalName}"`);
            totalSuccess++;
          }
          totalProcessed++;
        }
      } else if (entry.isDirectory && recursive && basename(fullPath) !== basename(outputDir)) {
        // Recursively process subdirectories (but skip the output directory itself)
        console.log(`📁 Entering directory: ${fullPath}`);
        const subResult = await processDirectory(fullPath, outputDir, recursive);
        totalProcessed += subResult.processed;
        totalSuccess += subResult.success;
      }
    }

  } catch (error) {
    // console.error(`❌ Error reading directory "${dirPath}": ${error.message}`);
  }

  return { processed: totalProcessed, success: totalSuccess };
}

async function processSingleFile(filePath: string, outputDir: string): Promise<void> {
  try {
    const fileInfo = await Deno.stat(filePath);
    
    if (!fileInfo.isFile) {
      console.error(`❌ "${filePath}" is not a file`);
      return;
    }

    const originalName = basename(filePath);
    const newName = getNewFileName(originalName);
    
    if (originalName === newName) {
      console.log(`ℹ️  File "${filePath}" already has correct naming format`);
    }

    await copyFileToOutput(filePath, outputDir, newName);
    
  } catch (error) {
    // console.error(`❌ Error processing file "${filePath}": ${error.message}`);
  }
}

// Main execution
if (import.meta.main) {
  const args = Deno.args;
  let recursive = true;
  let outputDir = "./renamed-files";
  
  // Check for flags
  const flagIndex = args.indexOf('--no-recursive');
  if (flagIndex !== -1) {
    recursive = false;
    args.splice(flagIndex, 1);
  }
  
  // Check for custom output directory
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputDir = args[outputIndex + 1];
    args.splice(outputIndex, 2);
  }
  
  console.log(`📂 Output directory: ${outputDir}`);
  
  if (args.length === 0) {
    console.log(`🔄 Processing current directory${recursive ? ' (recursively)' : ' (current level only)'}...\n`);
    const result = await processDirectory(".", outputDir, recursive);
    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${result.processed}`);
    console.log(`   Successfully copied: ${result.success}`);
    console.log(`   Failed: ${result.processed - result.success}`);
    console.log(`   Output location: ${outputDir}`);
  } else if (args.length === 1) {
    const target = args[0];
    
    try {
      const stat = await Deno.stat(target);
      
      if (stat.isDirectory) {
        console.log(`🔄 Processing directory: "${target}"${recursive ? ' (recursively)' : ' (current level only)'}...\n`);
        const result = await processDirectory(target, outputDir, recursive);
        console.log(`\n📊 Summary:`);
        console.log(`   Files processed: ${result.processed}`);
        console.log(`   Successfully copied: ${result.success}`);
        console.log(`   Failed: ${result.processed - result.success}`);
        console.log(`   Output location: ${outputDir}`);
      } else {
        console.log(`🔄 Processing file: "${target}"...\n`);
        await processSingleFile(target, outputDir);
        console.log(`\n📂 Check output directory: ${outputDir}`);
      }
    } catch (error) {
      // console.error(`❌ Cannot access "${target}": ${error.message}`);
    }
  } else {
    console.log(`
Usage:
  deno run --allow-read --allow-write rename.ts [options]                     # Process current directory
  deno run --allow-read --allow-write rename.ts [options] <directory>         # Process specific directory  
  deno run --allow-read --allow-write rename.ts [options] <file>              # Process specific file

Options:
  --no-recursive       Only process files in the specified directory, not subdirectories
  --output <dir>       Specify output directory (default: ./renamed-files)

Examples:
  deno run --allow-read --allow-write rename.ts
  deno run --allow-read --allow-write rename.ts ./icons
  deno run --allow-read --allow-write rename.ts --no-recursive ./icons
  deno run --allow-read --allow-write rename.ts --output ./output-folder ./icons
  deno run --allow-read --allow-write rename.ts "Arrow To Down Left.svg"
    `);
  }
}

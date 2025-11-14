// ============================================
// FILE: app/api/saves/list/route.ts
// PURPOSE: List all save files
// ============================================

import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const savesDir = join(process.cwd(), 'saves');
    
    // Read all files in saves directory
    const files = await readdir(savesDir);
    
    // Filter only .json files
    const saveFiles = files.filter(file => file.endsWith('.json'));
    
    // Get metadata for each file
    const saves = await Promise.all(
      saveFiles.map(async (filename) => {
        try {
          const filePath = join(savesDir, filename);
          const content = await readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          return {
            filename,
            metadata: data.metadata,
            timestamp: data.timestamp,
            playtime: data.playtime,
          };
        } catch (error) {
          console.error(`Error reading ${filename}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed reads
    const validSaves = saves.filter(save => save !== null);
    
    return NextResponse.json({
      success: true,
      saves: validSaves,
    });
  } catch (error) {
    console.error('Error listing saves:', error);
    return NextResponse.json(
      { error: 'Failed to list saves' },
      { status: 500 }
    );
  }
}
// ============================================
// FILE: app/api/saves/save/route.ts
// PURPOSE: Save game to server file system
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filename, data } = await request.json();
    
    if (!filename || !data) {
      return NextResponse.json(
        { error: 'Missing filename or data' },
        { status: 400 }
      );
    }
    
    // Clean filename
    const cleanFilename = filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    // Ensure .json extension
    const finalFilename = cleanFilename.endsWith('.json') 
      ? cleanFilename 
      : `${cleanFilename}.json`;
    
    // Path to saves directory
    const savesDir = join(process.cwd(), 'saves');
    const filePath = join(savesDir, finalFilename);
    
    // Pretty print JSON
    const prettyJSON = JSON.stringify(data, null, 2);
    
    // Write file
    await writeFile(filePath, prettyJSON, 'utf-8');
    
    console.log(`✅ Save file created: saves/${finalFilename}`);
    
    return NextResponse.json({
      success: true,
      filename: finalFilename,
      path: `saves/${finalFilename}`,
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
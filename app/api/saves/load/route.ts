// ============================================
// FILE: app/api/saves/load/route.ts
// PURPOSE: Load save file from server
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Missing filename' },
        { status: 400 }
      );
    }
    
    const savesDir = join(process.cwd(), 'saves');
    const filePath = join(savesDir, filename);
    
    // Read file
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`✅ Save file loaded: saves/${filename}`);
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error loading file:', error);
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    );
  }
}
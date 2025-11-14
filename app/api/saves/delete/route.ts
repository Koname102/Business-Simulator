// ============================================
// FILE: app/api/saves/delete/route.ts
// PURPOSE: Delete save file from server
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
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
    
    // Delete file
    await unlink(filePath);
    
    console.log(`✅ Save file deleted: saves/${filename}`);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${filename}`,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
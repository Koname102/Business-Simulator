// ============================================
// FILE: app/api/saves/download/route.ts
// PURPOSE: Download save file (trigger browser download)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename');
    
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
    
    // Return as download
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
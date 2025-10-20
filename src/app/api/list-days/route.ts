import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'data', 'days');
    try {
      const files = await fs.readdir(dir);
      const days = files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));
      return NextResponse.json({ ok: true, days });
    } catch (e) {
      return NextResponse.json({ ok: true, days: [] });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    if (!date)
      return NextResponse.json(
        { ok: false, error: 'missing date' },
        { status: 400 }
      );

    const file = path.join(process.cwd(), 'data', 'days', `${date}.json`);
    try {
      const raw = await fs.readFile(file, 'utf8');
      const items = JSON.parse(raw || '[]');
      return NextResponse.json({ ok: true, items });
    } catch (e) {
      return NextResponse.json({ ok: true, items: [] });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

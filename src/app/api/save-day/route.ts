import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { date, items } = await req.json();
    if (!date)
      return NextResponse.json(
        { ok: false, error: 'missing date' },
        { status: 400 }
      );

    const dataDir = path.join(process.cwd(), 'data', 'days');
    await fs.mkdir(dataDir, { recursive: true });
    const file = path.join(dataDir, `${date}.json`);
    await fs.writeFile(file, JSON.stringify(items ?? [], null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

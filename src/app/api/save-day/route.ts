import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = body?.date;
    if (!date)
      return NextResponse.json(
        { ok: false, error: 'missing date' },
        { status: 400 }
      );

    // normalize body to DayMeals. Support legacy array shape: items: ItemWithQty[]
    let payload = body.items;
    if (!payload) payload = { breakfast: [], lunch: [], dinner: [] };

    // legacy: if payload is an array, migrate into dinner by default
    if (Array.isArray(payload)) {
      payload = { breakfast: [], lunch: [], dinner: payload };
    }

    const dataDir = path.join(process.cwd(), 'data', 'days');
    await fs.mkdir(dataDir, { recursive: true });
    const file = path.join(dataDir, `${date}.json`);
    await fs.writeFile(
      file,
      JSON.stringify(
        payload ?? { breakfast: [], lunch: [], dinner: [] },
        null,
        2
      ),
      'utf8'
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getFallbackDemoData } from '@/lib/api';

export async function POST() {
  return NextResponse.json(getFallbackDemoData());
}

export async function GET() {
  return NextResponse.json(getFallbackDemoData());
}

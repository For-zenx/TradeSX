import { json } from '@sveltejs/kit';
import type { SurveyEntry } from '$lib/interfaces/survey';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SURVEY_PATH = resolve(process.cwd(), 'static', 'trades_survey.json');

export async function GET() {
  try {
    const data = await readFile(SURVEY_PATH, 'utf8');
    return json(JSON.parse(data));
  } catch (error) {
    console.error('Error DETAILED:', {
      error: error instanceof Error ? error.message : 'Unknown',
      code: (error as any).code,
      path: SURVEY_PATH
    });
    return json([]);
  }
}

export async function POST({ request }) {
    try {
        const entry: SurveyEntry = await request.json();
        
        const currentData = JSON.parse(await readFile(SURVEY_PATH, 'utf-8'));
        const existingIndex = currentData.findIndex((item: SurveyEntry) => item.id === entry.id);
        
        if (existingIndex >= 0) {
            currentData[existingIndex] = entry;
        } else {
            currentData.push(entry);
        }
        
        await writeFile(SURVEY_PATH, JSON.stringify(currentData, null, 2));
        
        return json({ success: true });
    } catch (error) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error('API Error:', errorMessage);
        }
        return json({ success: false, error: errorMessage }, { status: 500 });
    }
}
import { JobLog } from './src/types';

export interface SheetRowData {
  rowIndex: number; // 0-indexed row number relative to sheet (after header)
  originalValues: string[];
  mappedData: Record<string, any>;
}

// Map human-friendly column names to clean Handlebars template keys
// e.g., "Business Name" -> "business_name", "Logo URL" -> "logo_url"
export function cleanHeaderKey(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

// Direct REST client for Google Sheets API v4
export class GoogleSheetsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // General Fetch handler with token authorization
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_) {}
      throw new Error(`Google Sheets API Error (${response.status}): ${response.statusText}. Details: ${errorBody}`);
    }

    return response.json();
  }

  // Read data spreadsheet values with exponential backoff retry mechanism
  async readSpreadsheetValues(spreadsheetId: string, range: string, retries = 3, delay = 1000): Promise<string[][]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const data = await this.request(url, { method: 'GET' });
        return data.values || [];
      } catch (err: any) {
        if (attempt === retries) throw err;
        console.warn(`[WARN] Sheets Read Retrying (${attempt}/${retries}) in ${delay}ms due to: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
    return [];
  }

  // Parse a 2D array of spreadsheet values into mapped row objects
  parseSpreadsheetValues(values: string[][]): { headers: string[]; rows: SheetRowData[] } {
    if (values.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = values[0].map((h) => h.trim());
    const cleanHeaders = headers.map(cleanHeaderKey);
    const rows: SheetRowData[] = [];

    // Starting from row index 1 (skip headers)
    for (let i = 1; i < values.length; i++) {
      const originalValues = values[i];
      const mappedData: Record<string, any> = {};

      cleanHeaders.forEach((key, colIdx) => {
        if (key) {
          mappedData[key] = originalValues[colIdx] !== undefined ? originalValues[colIdx] : '';
        }
      });

      rows.push({
        rowIndex: i, // row numbering helper relative to spreadsheet values
        originalValues,
        mappedData,
      });
    }

    return { headers, rows };
  }

  // Write a range back to Google Sheets
  async writeSpreadsheetValue(spreadsheetId: string, range: string, values: string[][]): Promise<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values
      })
    });
  }

  // Batch Write back rows (more efficient for written URLs)
  async batchUpdateSpreadsheetValues(spreadsheetId: string, updates: { range: string; values: string[][] }[]): Promise<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates.map(u => ({
          range: u.range,
          values: u.values
        }))
      })
    });
  }

  // Look for target column in headers, if not available return write index (1-based for A, B, C...)
  // Supports appending columns to rows automatically
  static getColumnLetter(colIndex: number): string {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}

export type Dataset = {
  headers: string[];
  rows: string[][];
};

export type ColumnProfile = {
  name: string;
  type: "number" | "boolean" | "date" | "text";
  missing: number;
  unique: number;
  sample: string[];
};

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 20_000;
export const MAX_COLUMNS = 80;

export function parseCsv(input: string): Dataset {
  const text = input.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ",") {
      record.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      record.push(cell);
      if (record.some((value) => value.trim() !== "")) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
    if (records.length > MAX_ROWS + 1) throw new Error(`This MVP supports up to ${MAX_ROWS.toLocaleString()} data rows.`);
  }
  if (quoted) throw new Error("This CSV has an unclosed quoted value. Check the file and try again.");
  record.push(cell);
  if (record.some((value) => value.trim() !== "")) records.push(record);
  if (records.length < 2) throw new Error("Add a header row and at least one data row to continue.");

  const width = Math.max(...records.map((row) => row.length));
  if (width > MAX_COLUMNS) throw new Error(`This MVP supports up to ${MAX_COLUMNS} columns.`);
  const headers = Array.from({ length: width }, (_, index) => {
    const raw = (records[0][index] ?? "").trim() || `Column ${index + 1}`;
    let name = raw;
    let suffix = 2;
    while (headersHasName(records[0], index, name)) {
      name = `${raw} (${suffix})`;
      suffix += 1;
    }
    return name;
  });
  const rows = records.slice(1).map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""));
  return { headers, rows };
}

function headersHasName(rawHeaders: string[], currentIndex: number, name: string) {
  return rawHeaders.slice(0, currentIndex).some((header, index) => ((header ?? "").trim() || `Column ${index + 1}`) === name);
}

function detectType(values: string[]): ColumnProfile["type"] {
  const present = values.map((value) => value.trim()).filter(Boolean);
  if (!present.length) return "text";
  if (present.every((value) => /^(true|false|yes|no)$/i.test(value))) return "boolean";
  const numeric = present.filter((value) => Number.isFinite(Number(value.replaceAll(",", ""))));
  if (numeric.length / present.length >= 0.85) return "number";
  const dates = present.filter((value) => !Number.isNaN(Date.parse(value)) && /[-/:]/.test(value));
  if (dates.length / present.length >= 0.85) return "date";
  return "text";
}

export function profileDataset(dataset: Dataset): ColumnProfile[] {
  return dataset.headers.map((name, columnIndex) => {
    const values = dataset.rows.map((row) => row[columnIndex] ?? "");
    return {
      name,
      type: detectType(values),
      missing: values.filter((value) => value.trim() === "").length,
      unique: new Set(values.filter((value) => value.trim() !== "")).size,
      sample: values.filter((value) => value.trim() !== "").slice(0, 3),
    };
  });
}

export function duplicateCount(rows: string[][]) {
  return rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
}

export function cleanDataset(dataset: Dataset, trimWhitespace: boolean, removeDuplicates: boolean): Dataset {
  const trimmed = dataset.rows.map((row) => trimWhitespace ? row.map((value) => value.trim()) : [...row]);
  const nonBlank = trimmed.filter((row) => row.some((value) => value.trim() !== ""));
  const rows = removeDuplicates ? nonBlank.filter((row, index) => nonBlank.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(row)) === index) : nonBlank;
  return { headers: [...dataset.headers], rows };
}

export function encodeCsv(dataset: Dataset) {
  const escape = (value: string) => {
    const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [dataset.headers, ...dataset.rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

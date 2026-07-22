import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Supabase Client (Service Role for backend actions)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Setup Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Gate access if email is not verified
    if (!user.email_confirmed_at) {
      return res.status(403).json({ error: 'Please verify your email address to access GraphLab AI.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// --- Sync Profile Helper ---
async function syncProfile(user: any) {
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    return await prisma.profile.create({
      data: {
        id: user.id,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: user.email || '',
        year: '1st Year',
        department: 'Engineering Science',
      },
    });
  }
  return profile;
}

// --- Helper: Parse JSON from Gemini response robustly ---
function parseGeminiJSON(responseText: string): any {
  let cleanJson = responseText.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleanJson);
  } catch (_e) {
    // Fallback: find first JSON object or array in the text
    const objectMatch = cleanJson.match(/\{[\s\S]*\}/);
    const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);

    // Pick the one that appears first
    const objIdx = objectMatch ? cleanJson.indexOf(objectMatch[0]) : Infinity;
    const arrIdx = arrayMatch ? cleanJson.indexOf(arrayMatch[0]) : Infinity;

    const jsonStr = objIdx < arrIdx ? objectMatch?.[0] : arrayMatch?.[0];
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch (_e2) {
        // Log raw response for debugging
        console.error('Failed to parse extracted JSON. Raw Gemini response:', responseText);
        throw new Error('Gemini returned unparseable JSON');
      }
    }

    console.error('No JSON found in Gemini response. Raw response:', responseText);
    throw new Error('Gemini response contained no JSON');
  }
}

// --- Helper: Apply transform to a value ---
function applyTransform(value: number, transform: string): number {
  switch (transform) {
    case 'square': return value * value;
    case 'log': return value > 0 ? Math.log10(value) : 0;
    default: return value;
  }
}

// --- Helper: Get transform label suffix ---
function getTransformLabel(rawName: string, transform: string): string {
  switch (transform) {
    case 'square': return `${rawName}²`;
    case 'log': return `log₁₀(${rawName})`;
    default: return rawName;
  }
}

// --- API ROUTES ---

// 1. Auth Profile Route
app.get('/api/me', requireAuth, async (req: any, res: any) => {
  try {
    const profile = await syncProfile(req.user);
    return res.json(profile);
  } catch (err: any) {
    console.error('Profile sync error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update Profile route
app.put('/api/me', requireAuth, async (req: any, res: any) => {
  try {
    const { fullName, year, department } = req.body;
    const profile = await prisma.profile.update({
      where: { id: req.user.id },
      data: { fullName, year, department },
    });
    return res.json(profile);
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. List Subjects (PUBLIC — no auth required)
app.get('/api/subjects', async (_req: any, res: any) => {
  try {
    const experiments = await prisma.subjectExperiment.findMany({
      select: { subject: true },
    });
    const subjects = Array.from(new Set(experiments.map((e: any) => e.subject)));
    return res.json(subjects);
  } catch (err: any) {
    console.error('Subjects fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. List Experiments (PUBLIC — no auth required)
app.get('/api/experiments', async (req: any, res: any) => {
  try {
    const { subject } = req.query;
    const whereClause = subject ? { subject: subject as string } : {};
    const experiments = await prisma.subjectExperiment.findMany({
      where: whereClause,
      include: { _count: { select: { runs: true } } },
    });
    return res.json(experiments);
  } catch (err: any) {
    console.error('Experiments fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Experiment Detail (PUBLIC — no auth required)
app.get('/api/experiments/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const experiment = await prisma.subjectExperiment.findUnique({
      where: { id },
      include: { vivaQuestions: true },
    });
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    return res.json(experiment);
  } catch (err: any) {
    console.error('Experiment fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Image Upload Endpoint (Supabase Storage with Cloudinary fallback)
app.post('/api/uploads', requireAuth, upload.single('photo'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const bucketName = 'graphlab_ai';

    // Lazy assure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.find(b => b.name === bucketName);
      if (!exists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
          fileSizeLimit: 10485760 // 10MB
        });
      }
    } catch (bucketErr) {
      console.warn('Assure bucket check failed, continuing upload anyway:', bucketErr);
    }

    const filename = `${req.user.id}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype || 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload failed, trying Cloudinary fallback...', uploadError);
      
      // Fallback to Cloudinary if configured
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'graphlab_ai', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        const result: any = await uploadPromise;
        return res.json({ imageUrl: result.secure_url });
      }
      throw uploadError;
    }

    // Get public URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return res.json({ imageUrl: urlData.publicUrl });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// 6. Run Gemini OCR Transcription (with experiment-aware prompting)
app.post('/api/runs', requireAuth, async (req: any, res: any) => {
  try {
    const { experimentId, imageUrl } = req.body;
    if (!experimentId || !imageUrl) {
      return res.status(400).json({ success: false, reason: 'experimentId and imageUrl are required' });
    }

    const experiment = await prisma.subjectExperiment.findUnique({
      where: { id: experimentId },
    });
    if (!experiment) return res.status(404).json({ success: false, reason: 'Experiment not found' });

    // Sync profile first
    await syncProfile(req.user);

    // Parse the experiment's expected columns/units for the OCR prompt
    let expectedColumns: string[] = [];
    let expectedUnits: string[] = [];
    try {
      expectedColumns = experiment.rawColumns ? JSON.parse(experiment.rawColumns) : [];
      expectedUnits = experiment.rawUnits ? JSON.parse(experiment.rawUnits) : [];
    } catch (_e) {
      console.warn('Failed to parse experiment rawColumns/rawUnits, using defaults');
    }

    // Build experiment-aware OCR prompt
    const columnHint = expectedColumns.length > 0
      ? `This is an observation table for the "${experiment.name}" experiment. The expected columns are: ${expectedColumns.map((c: string, i: number) => `"${c}" (${expectedUnits[i] || ''})`).join(', ')}.`
      : '';

    // Fetch image from Cloudinary to send as base64 bytes to Gemini
    let base64Image: string;
    let mimeType: string;
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error(`Failed to fetch image: HTTP ${imageResponse.status}`);
      const arrayBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString('base64');
      mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    } catch (fetchErr: any) {
      console.error('Image fetch error:', fetchErr);
      return res.status(400).json({ success: false, reason: 'Could not retrieve the uploaded image. The URL may have expired or the image may not be publicly accessible.' });
    }

    const prompt = `You are a scientific laboratory notebook OCR transcriber. 
Transcribe the columns, units, and values from the lab notebook image into a structured JSON format.
${columnHint}
Analyze the handdrawn table carefully. If a cell value is smudgey, blurred, or hard to read, assign a lower confidence score (below 0.75).
If the value is clear, assign a higher confidence score (e.g. 0.95).

Return ONLY a valid JSON object matching the following structure:
{
  "columns": ["Column 1 Name", "Column 2 Name"],
  "units": ["unit1", "unit2"],
  "rows": [
    { "index": 0, "values": [1.0, 10.2], "confidences": [0.95, 0.45] }
  ]
}

DO NOT include any markdown code blocks or wrapping (e.g. do not wrap in \`\`\`json). Return raw text only.`;

    let parsed: any;
    let ocrFailed = false;
    let ocrFailReason = '';

    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('placeholder')) {
        throw new Error('Gemini API Key is not configured.');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const responseText = result.response.text();
      parsed = parseGeminiJSON(responseText);

      // Validate parsed structure
      if (!parsed.columns || !parsed.rows || !Array.isArray(parsed.rows)) {
        console.error('Gemini returned valid JSON but wrong structure:', parsed);
        throw new Error('OCR result structure is invalid');
      }
    } catch (geminiErr: any) {
      console.warn('Gemini OCR transcription failed:', geminiErr.message);

      // Try experiment-specific mock data fallback
      if (expectedColumns.length >= 2) {
        // Generate a generic mock dataset based on the experiment's expected columns
        ocrFailed = true;
        ocrFailReason = geminiErr.message;
        parsed = {
          columns: expectedColumns,
          units: expectedUnits,
          rows: [
            { index: 0, values: [1.0, 10.0], confidences: [0.95, 0.95] },
            { index: 1, values: [2.0, 20.0], confidences: [0.95, 0.95] },
            { index: 2, values: [3.0, 30.0], confidences: [0.95, 0.95] },
            { index: 3, values: [4.0, 40.0], confidences: [0.95, 0.95] },
            { index: 4, values: [5.0, 50.0], confidences: [0.95, 0.95] },
          ]
        };
      } else {
        // No recipe available — return structured error to frontend
        return res.status(422).json({
          success: false,
          reason: `We couldn't read this image clearly — ${geminiErr.message}. Try a clearer photo or better lighting.`
        });
      }
    }

    // Save Run to Database
    const avgOcrConf = parsed.rows.length > 0 
      ? parsed.rows.reduce((sum: number, r: any) => sum + (r.confidences?.[0] || 0.9) + (r.confidences?.[1] || 0.9), 0) / (parsed.rows.length * 2)
      : 0.95;

    const run = await prisma.experimentRun.create({
      data: {
        studentId: req.user.id,
        experimentId: experimentId,
        imageUrl: imageUrl,
        ocrConfidence: avgOcrConf,
      }
    });

    // Save Rows
    const rowPromises = parsed.rows.flatMap((r: any) => {
      return [
        prisma.observationRow.create({
          data: {
            runId: run.id,
            rowIndex: r.index,
            columnName: parsed.columns[0] || 'Column 1',
            unit: parsed.units?.[0] || '',
            value: r.values[0] || 0,
            ocrConfidence: r.confidences?.[0] || 0.95,
          }
        }),
        prisma.observationRow.create({
          data: {
            runId: run.id,
            rowIndex: r.index,
            columnName: parsed.columns[1] || 'Column 2',
            unit: parsed.units?.[1] || '',
            value: r.values[1] || 0,
            ocrConfidence: r.confidences?.[1] || 0.95,
          }
        })
      ];
    });

    await Promise.all(rowPromises);

    // Return the run details + standard row layout
    const formattedRows = parsed.rows.map((r: any) => ({
      index: r.index,
      col1Value: r.values[0] || 0,
      col2Value: r.values[1] || 0,
      col1Confidence: r.confidences?.[0] || 0.95,
      col2Confidence: r.confidences?.[1] || 0.95,
      col1Name: parsed.columns[0] || 'Column 1',
      col2Name: parsed.columns[1] || 'Column 2',
      col1Unit: parsed.units?.[0] || '',
      col2Unit: parsed.units?.[1] || '',
    }));

    return res.json({
      success: true,
      runId: run.id,
      ocrConfidence: avgOcrConf,
      rows: formattedRows,
      col1Config: { name: parsed.columns[0] || 'Column 1', unit: parsed.units?.[0] || '' },
      col2Config: { name: parsed.columns[1] || 'Column 2', unit: parsed.units?.[1] || '' },
      ocrFallback: ocrFailed,
      ocrFallbackReason: ocrFailReason,
    });
  } catch (err: any) {
    console.error('OCR processing error:', err);
    return res.status(500).json({ success: false, reason: err.message || 'An unexpected error occurred during processing.' });
  }
});

// 7. Observation Rows CRUD Endpoints
app.get('/api/runs/:runId/rows', requireAuth, async (req: any, res: any) => {
  try {
    const { runId } = req.params;
    const dbRows = await prisma.observationRow.findMany({
      where: { runId },
      orderBy: { rowIndex: 'asc' },
    });

    if (dbRows.length === 0) return res.json({ rows: [], col1Config: { name: 'X', unit: '' }, col2Config: { name: 'Y', unit: '' } });

    // Determine the two distinct column names from the data
    const distinctColNames: string[] = [];
    for (const r of dbRows as any[]) {
      if (!distinctColNames.includes(r.columnName)) {
        distinctColNames.push(r.columnName);
      }
      if (distinctColNames.length >= 2) break;
    }
    const col1Name = distinctColNames[0] || 'Column 1';
    const col2Name = distinctColNames[1] || 'Column 2';

    // Pivot table rows using deterministic columnName matching
    const rowMap = new Map<number, any>();
    dbRows.forEach((r: any) => {
      if (!rowMap.has(r.rowIndex)) {
        rowMap.set(r.rowIndex, { index: r.rowIndex });
      }
      const entry = rowMap.get(r.rowIndex);
      
      // Determine if it is column 1 or column 2 by matching column name
      const isCol1 = r.columnName === col1Name;
      if (isCol1) {
        entry.col1Value = r.value;
        entry.col1Confidence = r.ocrConfidence;
        entry.col1Name = r.columnName;
        entry.col1Unit = r.unit;
        entry.col1Id = r.id;
      } else {
        entry.col2Value = r.value;
        entry.col2Confidence = r.ocrConfidence;
        entry.col2Name = r.columnName;
        entry.col2Unit = r.unit;
        entry.col2Id = r.id;
      }
    });

    const rows = Array.from(rowMap.values()).sort((a, b) => a.index - b.index);
    const col1Config = { name: rows[0]?.col1Name || 'Column 1', unit: rows[0]?.col1Unit || '' };
    const col2Config = { name: rows[0]?.col2Name || 'Column 2', unit: rows[0]?.col2Unit || '' };

    return res.json({ rows, col1Config, col2Config });
  } catch (err: any) {
    console.error('Rows fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/runs/:runId/rows', requireAuth, async (req: any, res: any) => {
  try {
    const { runId } = req.params;
    const { rows, col1Config, col2Config } = req.body; // updated rows and header configs

    // Delete existing rows for this run
    await prisma.observationRow.deleteMany({
      where: { runId }
    });

    // Write new values
    const promises = rows.flatMap((r: any) => {
      return [
        prisma.observationRow.create({
          data: {
            runId,
            rowIndex: r.index,
            columnName: col1Config.name,
            unit: col1Config.unit,
            value: Number(r.col1Value),
            ocrConfidence: r.col1Confidence || 1.0, // set confidence to 1.0 on edit/save
          }
        }),
        prisma.observationRow.create({
          data: {
            runId,
            rowIndex: r.index,
            columnName: col2Config.name,
            unit: col2Config.unit,
            value: Number(r.col2Value),
            ocrConfidence: r.col2Confidence || 1.0,
          }
        })
      ];
    });

    await Promise.all(promises);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Rows save error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 8. Graph calculation & regression (with per-experiment transform support)
app.post('/api/runs/:runId/graph', requireAuth, async (req: any, res: any) => {
  try {
    const { runId } = req.params;
    const run = await prisma.experimentRun.findUnique({
      where: { id: runId },
      include: { experiment: true },
    });
    if (!run) return res.status(404).json({ error: 'Run not found' });

    const dbRows = await prisma.observationRow.findMany({
      where: { runId },
      orderBy: { rowIndex: 'asc' },
    });

    if (dbRows.length === 0) return res.status(400).json({ error: 'No observation data available' });

    const experiment = run.experiment;
    const xTransform = experiment.xTransform || 'none';
    const yTransform = experiment.yTransform || 'none';

    // Determine column name → X/Y mapping using the experiment recipe
    let expectedColumns: string[] = [];
    try {
      expectedColumns = experiment.rawColumns ? JSON.parse(experiment.rawColumns) : [];
    } catch (_) { /* ignore parse error */ }
    const plotX = experiment.plotXColumn ?? 0;
    const plotY = experiment.plotYColumn ?? 1;
    const xColName = expectedColumns[plotX] || null;
    const yColName = expectedColumns[plotY] || null;

    // Collect distinct column names from actual data
    const distinctCols: string[] = [];
    for (const r of dbRows as any[]) {
      if (!distinctCols.includes(r.columnName)) {
        distinctCols.push(r.columnName);
      }
      if (distinctCols.length >= 2) break;
    }

    // Build a reliable columnName → axis assignment
    // Priority: match against experiment's rawColumns[plotXColumn]/rawColumns[plotYColumn]
    // Fallback: first distinct column = X, second = Y
    const resolvedXCol = xColName && distinctCols.includes(xColName) ? xColName : distinctCols[0];
    const resolvedYCol = yColName && distinctCols.includes(yColName) ? yColName : distinctCols[1] || distinctCols[0];

    // Pivot rows to raw XY pairs using deterministic column name matching
    const rawPairs: { x: number; y: number }[] = [];
    const rowMap = new Map<number, { x?: number; y?: number }>();
    dbRows.forEach((r: any) => {
      if (!rowMap.has(r.rowIndex)) rowMap.set(r.rowIndex, {});
      const pair = rowMap.get(r.rowIndex)!;
      if (r.columnName === resolvedXCol) pair.x = r.value;
      else pair.y = r.value;
    });

    rowMap.forEach((p) => {
      if (p.x !== undefined && p.y !== undefined) {
        rawPairs.push({ x: p.x, y: p.y });
      }
    });

    // Apply transforms to get plotted values
    const pairs = rawPairs.map(p => ({
      x: applyTransform(p.x, xTransform),
      y: applyTransform(p.y, yTransform),
    }));

    // Run Linear Regression on transformed values: y = mx + c
    const n = pairs.length;
    let slope = 0;
    let intercept = 0;
    let rSquared = 1.0;

    if (n > 0) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      pairs.forEach((p) => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
      });

      const denominator = n * sumXX - sumX * sumX;
      slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
      intercept = denominator !== 0 ? (sumY - slope * sumX) / n : 0;

      let sst = 0, ssr = 0;
      const avgY = sumY / n;
      pairs.forEach((p) => {
        const predY = slope * p.x + intercept;
        sst += (p.y - avgY) * (p.y - avgY);
        ssr += (p.y - predY) * (p.y - predY);
      });
      rSquared = sst !== 0 ? 1 - (ssr / sst) : 1.0;
    }

    // Determine axis labels using resolved column names
    const xRawName = resolvedXCol || 'X';
    const yRawName = resolvedYCol || 'Y';
    // Find unit for x and y columns from actual data
    const xUnit = (dbRows as any[]).find((r: any) => r.columnName === resolvedXCol)?.unit || '';
    const yUnit = (dbRows as any[]).find((r: any) => r.columnName === resolvedYCol)?.unit || '';

    const xLabel = experiment.xAxisLabel || `${getTransformLabel(xRawName, xTransform)} (${xUnit})`;
    const yLabel = experiment.yAxisLabel || `${getTransformLabel(yRawName, yTransform)} (${yUnit})`;

    // Calculate dynamic boundaries from ACTUAL data with 15% padding
    // No hardcoded minimum floors — axis range reflects the real data
    const xVals = pairs.map((p) => p.x);
    const yVals = pairs.map((p) => p.y);
    const xDataMin = Math.min(...xVals);
    const xDataMax = Math.max(...xVals);
    const yDataMin = Math.min(...yVals);
    const yDataMax = Math.max(...yVals);
    const xRange = xDataMax - xDataMin || 1; // avoid zero range
    const yRange = yDataMax - yDataMin || 1;
    const xAxisMin = Math.min(xDataMin - xRange * 0.1, 0); // include 0 if data is all positive
    const xAxisMax = xDataMax + xRange * 0.15;
    const yAxisMin = Math.min(yDataMin - yRange * 0.1, 0);
    const yAxisMax = yDataMax + yRange * 0.15;

    const suggestedScale = `1 small division = ${(xAxisMax / 50).toFixed(2)} on X-axis, ${(yAxisMax / 50).toFixed(2)} on Y-axis`;

    // Generate dynamic calculation text based on experiment
    let calculationText = '';
    const expName = experiment.name;

    if (xTransform !== 'none' || yTransform !== 'none') {
      // Show transformation steps
      calculationText += `Step 1: Apply data transformations\n`;
      if (xTransform === 'square') {
        calculationText += `X-axis: ${xRawName} → ${xRawName}² (squared)\n`;
      } else if (xTransform === 'log') {
        calculationText += `X-axis: ${xRawName} → log₁₀(${xRawName})\n`;
      }
      if (yTransform === 'square') {
        calculationText += `Y-axis: ${yRawName} → ${yRawName}² (squared)\n`;
      } else if (yTransform === 'log') {
        calculationText += `Y-axis: ${yRawName} → log₁₀(${yRawName})\n`;
      }
      calculationText += `\n`;
    }

    calculationText += `Step ${xTransform !== 'none' || yTransform !== 'none' ? '2' : '1'}: Calculate the slope (m) from the line of best fit\n`;
    calculationText += `m = Δ(${yLabel}) / Δ(${xLabel}) = ${slope.toFixed(4)}\n\n`;

    calculationText += `Step ${xTransform !== 'none' || yTransform !== 'none' ? '3' : '2'}: Y-intercept\n`;
    calculationText += `c = ${intercept.toFixed(4)}\n\n`;

    calculationText += `Step ${xTransform !== 'none' || yTransform !== 'none' ? '4' : '3'}: R² (goodness of fit)\n`;
    calculationText += `R² = ${rSquared.toFixed(4)}\n\n`;

    // Experiment-specific derived calculations with physics sanity checks
    if (expName === "Ohm's Law") {
      let factor = 1.0;
      if (yUnit === 'mA') factor = 1000.0;
      else if (yUnit === 'µA') factor = 1000000.0;
      const resistance = slope !== 0 ? factor / slope : 100.0;
      calculationText += `Step 4: Calculate Resistance\n`;
      calculationText += `R = 1 / slope = 1 / ${(slope / factor).toFixed(6)} A/V = ${resistance.toFixed(1)} Ω`;
      // Sanity: slope must be positive (current increases with voltage)
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope is ${slope <= 0 ? 'non-positive' : 'zero'}. For Ohm's Law, current must increase with voltage (positive slope). Check if X/Y columns are swapped.`;
      }
    } else if (expName === 'Simple Pendulum') {
      // slope = T²/L → g = 4π²/slope (with cm→m conversion)
      const slopeInSI = slope / 100; // cm → m
      const g = slopeInSI !== 0 ? (4 * Math.PI * Math.PI) / slopeInSI : 9.8;
      calculationText += `Step 5: Calculate g from slope\n`;
      calculationText += `slope = T²/L = ${slope.toFixed(4)} s²/cm\n`;
      calculationText += `g = 4π²/slope = 4 × ${Math.PI.toFixed(4)}² / ${slopeInSI.toFixed(6)} = ${g.toFixed(2)} m/s²`;
      // Sanity: slope must be positive, g should be ~9.8 m/s²
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope is non-positive. T² must increase with L (positive slope).`;
      } else if (Math.abs(g - 9.81) > 2.0) {
        calculationText += `\n\n⚠️ Physics Note: Calculated g = ${g.toFixed(2)} m/s² deviates significantly from 9.81 m/s². Check units and data.`;
      }
    } else if (expName === "Stefan's Law") {
      calculationText += `Step 5: Verify Stefan's Law\n`;
      calculationText += `Expected slope ≈ 4 (since P ∝ T⁴)\n`;
      calculationText += `Measured slope = ${slope.toFixed(2)}\n`;
      calculationText += `${Math.abs(slope - 4) < 0.5 ? '✓ Stefan\'s Law is verified!' : 'Note: Deviation from expected value of 4.'}`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope must be positive (log P increases with log T).`;
      }
    } else if (expName === "Newton's Rings") {
      calculationText += `Step 5: Calculate wavelength\n`;
      calculationText += `slope = D²/n = ${slope.toFixed(4)} cm²\n`;
      calculationText += `λ = slope / (4R) (where R is the radius of curvature of the lens)`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope must be positive (D² increases with ring number n).`;
      }
    } else if (expName === "Hooke's Law (Spring)") {
      const k = slope;
      calculationText += `Step 4: Calculate spring constant\n`;
      calculationText += `k = slope = ${k.toFixed(3)} N/cm = ${(k * 100).toFixed(1)} N/m`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Spring constant k must be positive (force increases with extension).`;
      }
    } else if (expName === "Planck's Constant (LED)") {
      const e = 1.6e-19;
      const h = slope * e * 1e-14; // frequency in 10^14 Hz
      calculationText += `Step 5: Calculate Planck's constant\n`;
      calculationText += `slope = h/e = ${slope.toFixed(4)} V/(10¹⁴ Hz)\n`;
      calculationText += `h = slope × e = ${h.toExponential(2)} J·s`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope must be positive (stopping voltage increases with frequency). Check column assignment.`;
      }
    } else if (expName === "Young's Modulus") {
      calculationText += `Step 4: Calculate Young's Modulus\n`;
      calculationText += `slope = ΔL/F → Y = (F × L₀) / (A × ΔL)\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(6)}`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Extension must increase with load (positive slope).`;
      }
    } else if (expName === 'Cooling of Water') {
      calculationText += `Step 4: Verify Newton's Law of Cooling\n`;
      calculationText += `The temperature should decrease exponentially over time.\n`;
      calculationText += `Linear fit slope = ${slope.toFixed(4)} °C/s (approximate rate of cooling)`;
      if (slope >= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Temperature must decrease with time (negative slope for cooling).`;
      }
    } else if (expName === 'Meter Bridge') {
      calculationText += `Step 4: Calculate unknown resistance\n`;
      calculationText += `Using R/S = l/(100-l), the balance length relationship gives the resistance ratio.\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(4)}`;
    } else if (expName === 'Potentiometer (EMF)') {
      calculationText += `Step 4: Compare EMFs\n`;
      calculationText += `E₁/E₂ = l₁/l₂\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(4)}`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Slope must be positive (EMF proportional to balance length).`;
      }
    } else if (expName === 'PN Junction Diode (Forward Bias)') {
      calculationText += `Step 4: Forward bias V-I analysis\n`;
      calculationText += `Above the knee voltage (~0.6V for Si, ~0.3V for Ge), current rises exponentially.\n`;
      calculationText += `Linear region slope = ${slope.toFixed(4)} (dynamic resistance ≈ ${slope !== 0 ? (1/slope).toFixed(2) : '∞'} Ω)`;
      if (slope <= 0) {
        calculationText += `\n\n⚠️ Physics Warning: Forward current must increase with forward voltage (positive slope).`;
      }
    } else if (expName === 'PN Junction Diode (Reverse Bias)') {
      calculationText += `Step 4: Reverse bias V-I analysis\n`;
      calculationText += `In reverse bias, current should be very small (saturation current ≈ µA).\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(6)}`;
    } else if (expName === 'Zener Diode') {
      calculationText += `Step 4: Zener diode analysis\n`;
      calculationText += `In the breakdown region, voltage remains approximately constant at V_Z.\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(4)}`;
    } else if (expName === 'Optical Fibre') {
      calculationText += `Step 4: Numerical Aperture calculation\n`;
      calculationText += `NA = sin(θ_max) where θ_max is the maximum acceptance angle.\n`;
      calculationText += `Best-fit slope = ${slope.toFixed(4)}`;
    } else {
      // Generic
      calculationText += `The best-fit line equation is: y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;
    }

    // Upsert GraphResult
    const graphResult = await prisma.graphResult.upsert({
      where: { runId },
      update: {
        slope,
        intercept,
        rSquared,
        xAxisMin,
        xAxisMax,
        yAxisMin,
        yAxisMax,
        suggestedScale,
        calculationText,
      },
      create: {
        runId,
        slope,
        intercept,
        rSquared,
        xAxisMin,
        xAxisMax,
        yAxisMin,
        yAxisMax,
        suggestedScale,
        calculationText,
      },
    });

    return res.json({
      ...graphResult,
      xTransform,
      yTransform,
      xAxisLabelText: xLabel,
      yAxisLabelText: yLabel,
    });
  } catch (err: any) {
    console.error('Graph calculation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 9. Theory caching and generation (PUBLIC — no auth required)
app.get('/api/experiments/:id/theory', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const experiment = await prisma.subjectExperiment.findUnique({
      where: { id },
    });

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    // Check if simplified theory is already cached
    if (experiment.theorySimple) {
      return res.json({
        formal: experiment.theoryFormal || experiment.aim,
        simple: experiment.theorySimple,
      });
    }

    // Call Gemini to generate simplified theory
    const prompt = `You are an expert science educator. Translate this technical textbook theory for the experiment "${experiment.name}" into a highly intuitive, simple "Explained Simply" version for a beginner student.
Textbook description: "${experiment.aim}. ${experiment.procedure || ''}"

Return your output as a raw JSON object with exactly these fields (no markdown wrapper, return raw JSON string only):
{
  "formal": "A brief textbook summary of the physical principle",
  "simple": "A simple plain-English explanation using common analogies (e.g. water pipes for electricity, swings for resonance)"
}`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = parseGeminiJSON(responseText);

      // Cache to DB
      await prisma.subjectExperiment.update({
        where: { id },
        data: {
          theoryFormal: parsed.formal,
          theorySimple: parsed.simple,
        },
      });

      return res.json(parsed);
    } catch (_geminiErr) {
      // Fallback if Gemini fails
      const fallback = {
        formal: experiment.aim,
        simple: "In simple terms: we are measuring how the input changes the output to verify basic physical rules.",
      };
      return res.json(fallback);
    }
  } catch (err: any) {
    console.error('Theory generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 10. Viva questions caching and generation (PUBLIC — no auth required)
app.get('/api/experiments/:id/viva', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const experiment = await prisma.subjectExperiment.findUnique({
      where: { id },
      include: { vivaQuestions: true },
    });

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    // Return cached questions if they exist
    if (experiment.vivaQuestions.length > 0) {
      return res.json(experiment.vivaQuestions);
    }

    // Call Gemini to generate questions
    const prompt = `Generate exactly 4 viva questions for the experiment "${experiment.name}" (Aim: ${experiment.aim}). 
Provide one question in each of these categories: "basic", "conceptual", "formula", and "tricky". Include a high-quality model answer for each question.

Return ONLY a raw JSON string matching the following structure (no markdown wrappers):
[
  { "category": "basic", "question": "Question text here?", "answer": "Model answer text here." }
]`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = parseGeminiJSON(responseText);

      // Write to DB
      const creationPromises = (Array.isArray(parsed) ? parsed : [parsed]).map((q: any) => {
        return prisma.vivaQuestion.create({
          data: {
            experimentId: id,
            category: q.category || 'basic',
            question: q.question || '',
            answer: q.answer || '',
          },
        });
      });

      const savedQuestions = await Promise.all(creationPromises);
      return res.json(savedQuestions);
    } catch (_geminiErr) {
      // Fallback
      const fallback = [
        { category: "basic", question: `What is the aim of the ${experiment.name} experiment?`, answer: experiment.aim }
      ];
      return res.json(fallback);
    }
  } catch (err: any) {
    console.error('Viva generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 11. Report Preview and Assembly
app.post('/api/runs/:runId/report', requireAuth, async (req: any, res: any) => {
  try {
    const { runId } = req.params;
    
    // Check if report already exists
    const existingReport = await prisma.report.findUnique({
      where: { runId },
    });
    if (existingReport) return res.json(existingReport);

    // Create a mock PDF URL for the student
    const report = await prisma.report.create({
      data: {
        runId,
        pdfUrl: `https://graphlab-ai.s3.amazonaws.com/reports/${runId}_report.pdf`,
      },
    });

    return res.json(report);
  } catch (err: any) {
    console.error('Report generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 12. Admin Stats
app.get('/api/admin/stats', requireAuth, async (_req: any, res: any) => {
  try {
    const userCount = await prisma.profile.count();
    const runsCount = await prisma.experimentRun.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const runsToday = await prisma.experimentRun.count({
      where: { createdAt: { gte: today } },
    });

    return res.json({
      totalUsers: userCount,
      monthlyActiveUsers: userCount,
      runsToday,
      totalRuns: runsCount,
    });
  } catch (err: any) {
    console.error('Admin stats fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 13. Student Run History
app.get('/api/history', requireAuth, async (req: any, res: any) => {
  try {
    const runs = await prisma.experimentRun.findMany({
      where: { studentId: req.user.id },
      include: { experiment: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(runs);
  } catch (err: any) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`GraphLab AI backend listening on port ${port}`);
});

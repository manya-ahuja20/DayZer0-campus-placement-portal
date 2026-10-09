const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse/lib/pdf-parse.js');

const STOP = new Set('a an the and or of to in for with on at by from as is are was were be been this that these those it its we you your our will can should must have has had not but if their they them who which what when where how all any each such more other than into over about also etc using use work working experience years year strong good ability able looking hiring candidates candidate role team'.split(' '));

const tokenize = (t) =>
  (t.toLowerCase().match(/[a-z][a-z0-9+#.]+/g) || [])
    .map((w) => w.replace(/\.+$/, ''))
    .filter((w) => w.length > 2 && !STOP.has(w));

const freq = (tokens) => tokens.reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {});

exports.extractText = async (fileName) => {
  const buf = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'resumes', fileName));
  return (await pdf(buf)).text;
};

exports.matchResume = (resumeText, jdText) => {
  const r = freq(tokenize(resumeText));
  const j = freq(tokenize(jdText));
  const jTerms = Object.keys(j);
  if (!jTerms.length) return { score: 0, feedback: 'No job description available to compare against.' };
  if (!Object.keys(r).length) return { score: 0, feedback: 'No readable text found in the resume (scanned PDFs are not supported).' };

  // cosine similarity on term-frequency vectors
  let dot = 0, rn = 0, jn = 0;
  for (const t of new Set([...Object.keys(r), ...jTerms])) {
    const a = r[t] || 0, b = j[t] || 0;
    dot += a * b; rn += a * a; jn += b * b;
  }
  const cosine = dot / (Math.sqrt(rn) * Math.sqrt(jn) || 1);

  // JD-weighted keyword coverage
  let total = 0, hit = 0;
  jTerms.forEach((t) => { total += j[t]; if (r[t]) hit += j[t]; });
  const coverage = hit / total;

  // cosine is scaled x3 (capped) because a resume is far longer than a JD
  const score = Math.round((0.6 * coverage + 0.4 * Math.min(cosine * 3, 1)) * 1000) / 10;

  const byWeight = (a, b) => j[b] - j[a];
  const missing = jTerms.filter((t) => !r[t]).sort(byWeight).slice(0, 8);
  const matched = jTerms.filter((t) => r[t]).sort(byWeight).slice(0, 8);

  let feedback = `Matched: ${matched.join(', ') || 'none'}.`;
  if (missing.length) feedback += ` Missing from resume: ${missing.join(', ')}. Consider adding relevant projects or skills.`;
  else feedback += ' Resume covers all key terms in the job description.';
  return { score, feedback };
};
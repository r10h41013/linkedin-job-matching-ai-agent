/**
 * This script converts the AI response into structured JSON
 * so it can be processed inside the n8n workflow.
 */

function cleanText(text) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function stripMarkdownDecorators(s) {
  return (s || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}

function extractMarkdownOrPlainUrl(text) {
  if (!text) return "";

  const markdownLink = text.match(/\[[^\]]*?\]\((https?:\/\/[^\s)]+)\)/i);
  if (markdownLink) return markdownLink[1].trim();

  const angleOrPlain = text.match(/https?:\/\/[^\s)\]]+/i);
  if (angleOrPlain) return angleOrPlain[0].trim();

  return "";
}

function getSection(text, label, nextLabels = []) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const nextPattern = nextLabels.length
    ? nextLabels
        .map(l => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .map(l => `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?(?:\\d+\\.\\s*)?${l}(?:\\*\\*)?\\s*:?[ \\t]*`)
        .join("|")
    : "$";

  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?(?:\\d+\\.\\s*)?${escapedLabel}(?:\\*\\*)?\\s*:?[ \\t]*\\n?([\\s\\S]*?)(?=${nextPattern}|$)`,
    "i"
  );

  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function parseMatchingScore(scoreText) {
  const t = cleanText(scoreText);

  let m = t.match(/(\d{1,3})\s*\/\s*100/i);
  if (m) return parseInt(m[1], 10);

  m = t.match(/\b(\d{1,3})\b/);
  if (m) return parseInt(m[1], 10);

  return null;
}

function parseChatGPTResult(text, recordId = 1) {
  const raw = cleanText(text);

  const titleSection = getSection(raw, "Title", [
    "Link",
    "Matching score",
    "An analysis of my strengths and weaknesses for this role"
  ]);

  const linkSection = getSection(raw, "Link", [
    "Matching score",
    "An analysis of my strengths and weaknesses for this role"
  ]);

  const scoreSection = getSection(raw, "Matching score", [
    "An analysis of my strengths and weaknesses for this role"
  ]);

  const analysisSection = getSection(
    raw,
    "An analysis of my strengths and weaknesses for this role",
    []
  );

  let title = stripMarkdownDecorators(titleSection)
    .replace(/\n+/g, " ")
    .trim();

  let link = extractMarkdownOrPlainUrl(linkSection);

  let matchingScore = parseMatchingScore(scoreSection);

  let analysis = analysisSection.trim();

  // Fallback: Title
  if (!title) {
    const fallbackTitle = raw.match(
      /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?(?:\d+\.\s*)?Title(?:\*\*)?\s*:?\s*(.+)/i
    );
    if (fallbackTitle) {
      title = stripMarkdownDecorators(fallbackTitle[1]).trim();
    }
  }

  // Fallback: Link
  if (!link) {
    link = extractMarkdownOrPlainUrl(raw);
  }

  // Fallback: Matching score
  if (matchingScore === null) {
    const fallbackScore = raw.match(
      /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?(?:\d+\.\s*)?Matching score(?:\*\*)?\s*:?\s*([\s\S]{0,30})/i
    );
    if (fallbackScore) {
      matchingScore = parseMatchingScore(fallbackScore[1]);
    }
  }

  // Fallback: Analysis
  if (!analysis) {
    const fallbackAnalysis = raw.match(
      /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?(?:\d+\.\s*)?An analysis of my strengths and weaknesses for this role(?:\*\*)?\s*:?\s*([\s\S]*)$/i
    );
    if (fallbackAnalysis) {
      analysis = fallbackAnalysis[1].trim();
    }
  }

  return {
    id: recordId,
    "Title": title || "",
    "Link": link || "",
    "Matching score": matchingScore,
    "An analysis of my strengths and weaknesses for this role": analysis || ""
  };
}

const items = $input.all();

const results = items.map((item, index) => {
  const text = item.json?.output?.[0]?.content?.[0]?.text || "";

  const parsed = parseChatGPTResult(text, index + 1);

  return {
    json: {
      ...parsed
    }
  };
});

// 按 Matching score ranking (high to low)
results.sort((a, b) => {
  return (b.json["Matching score"] || 0) - (a.json["Matching score"] || 0);
});

// pick top 3
const top3 = results.slice(0, 3);

return top3;
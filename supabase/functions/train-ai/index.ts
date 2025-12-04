
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, goal } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400, headers: corsHeaders });
    }

    console.log(`Scanning website: ${url}`);

    // 1. Fetch the website content
    // Note: In a production Deno Edge Function, some sites block basic fetch requests.
    // A real production version would use a headless browser service or proxy.
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LocalAI-Bot/1.0; +http://localai.com)'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Simple Heuristic Extraction (No external LLM dependency for this demo)
    // We strip tags and look for patterns.
    
    // Extract Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;

    // Extract Description
    const metaDescMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const description = metaDescMatch ? metaDescMatch[1] : "";

    // Extract Body Text (Very rough stripping of script/style)
    let text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    
    // Truncate text to avoid massive prompts (take first 2000 chars)
    const truncatedBody = text.substring(0, 2000);

    // 3. Construct the "AI Context" System Prompt
    const context = `
YOU ARE AN AI RECEPTIONIST FOR: ${title}
WEBSITE: ${url}

BUSINESS GOAL: ${goal}

WEBSITE SUMMARY:
${description ? `Description: ${description}\n` : ''}
Extracted Content:
${truncatedBody}...

INSTRUCTIONS:
1. You represent this business. Be polite, professional, and helpful.
2. Use the content above to answer questions about services, hours, and location.
3. If the user asks about something not in the text, ask them to call the business directly.
4. Your primary goal is to: ${goal}.
    `.trim();

    return new Response(JSON.stringify({ success: true, context }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Training Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

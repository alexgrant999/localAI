
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenAI } from "npm:@google/genai";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_question, admin_reply } = await req.json();

    if (!user_question || !admin_reply) {
      return new Response(JSON.stringify({ skipped: true, reason: "Missing input" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. Get User & Settings
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('ai_api_key, ai_context, business_goal')
      .eq('user_id', user.id)
      .single();

    if (intError || !integration?.ai_api_key) {
      return new Response(JSON.stringify({ skipped: true, reason: "No API Key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: integration.ai_api_key });
    const modelId = 'gemini-2.5-flash';

    // 3. Compare and Update
    // We ask the LLM to act as a knowledge base manager.
    const prompt = `
    CURRENT KNOWLEDGE BASE:
    "${integration.ai_context || ''}"

    NEW INTERACTION:
    User asked: "${user_question}"
    Admin replied: "${admin_reply}"

    TASK:
    Analyze the Admin's reply. Does it contain NEW factual information about the business (e.g. prices, hours, policy, location) that is NOT in the Current Knowledge Base?
    
    If YES: Merge the new facts into the Knowledge Base. Keep it concise, organized, and professional. Return ONLY the updated Knowledge Base text.
    If NO (e.g. just a greeting or confirmation): Return the string "NO_CHANGE".
    `;

    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const newContext = result.text.trim();

    if (newContext && newContext !== "NO_CHANGE") {
      console.log("Updating AI Context with new knowledge...");
      await supabase
        .from('integrations')
        .update({ ai_context: newContext })
        .eq('user_id', user.id);
        
      return new Response(JSON.stringify({ success: true, updated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ success: true, updated: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("Learning Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Return 200 to avoid client errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

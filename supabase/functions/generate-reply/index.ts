
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "npm:@google/genai";

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
    const { conversation_id, action = 'reply', user_id } = await req.json();

    if (!conversation_id) throw new Error("Missing conversation_id");

    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    let supabase;
    let userId = user_id;

    // Determine auth context
    if (authHeader.includes(supabaseServiceKey) && user_id) {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
        supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized user");
        userId = user.id;
    }

    const { data: integration } = await supabase
      .from('integrations')
      .select('ai_api_key, ai_context, business_goal, notification_phone')
      .eq('user_id', userId)
      .single();

    if (!integration?.ai_api_key) throw new Error("Gemini API Key not found.");

    const { data: messages } = await supabase
      .from('messages')
      .select('sender, text, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const history = (messages || []).reverse().map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));
    
    // Safety check: History must typically end with user turn for some chat models, 
    // though Gemini 2.5 is flexible, we ensure a user turn if empty or last was model.
    if (history.length === 0 || history[history.length - 1].role === 'model') {
        history.push({ role: 'user', parts: [{ text: "Please respond to the previous context." }] });
    }

    const ai = new GoogleGenAI({ apiKey: integration.ai_api_key });
    const systemInstruction = integration.ai_context 
      ? `${integration.ai_context}\n\nIMPORTANT: Be concise. If the user asks for a human or to speak to someone, add [HUMAN_REQUEST] to your response.`
      : `You are a helpful AI receptionist. Goal: ${integration.business_goal}. Be polite and concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction,
        maxOutputTokens: 200,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      }
    });

    let replyText = response.text || "I'm sorry, I'm having trouble connecting right now.";

    // Handle Human Handoff Notification
    if (replyText.includes('[HUMAN_REQUEST]')) {
       replyText = replyText.replace('[HUMAN_REQUEST]', '').trim();
       if (integration.notification_phone) {
          // Fire and forget notification
          fetch(`${supabaseUrl}/functions/v1/send-message`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
                 to: integration.notification_phone, 
                 body: `🚨 Human Handoff Requested for conversation: ${conversation_id}`,
                 channel: 'sms',
                 user_id: userId
             })
          }).catch(e => console.error("Notification Error:", e));
       }
    }

    // Auto-Send Logic
    if (action === 'reply_and_send') {
        await supabase.from('messages').insert({ conversation_id, sender: 'ai', text: replyText });
        await supabase.from('conversations').update({ last_message: replyText, last_message_at: new Date().toISOString(), status: 'replied' }).eq('id', conversation_id);

        const { data: conv } = await supabase.from('conversations').select('phone, channel').eq('id', conversation_id).single();
        if (conv) {
             await fetch(`${supabaseUrl}/functions/v1/send-message`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({ 
                     to: conv.phone, 
                     body: replyText,
                     channel: conv.channel,
                     user_id: userId
                 })
              });
        }
    }

    return new Response(JSON.stringify({ reply: replyText }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("AI Gen Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

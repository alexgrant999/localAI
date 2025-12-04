




import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    console.log(`SMS from ${from}: ${body}`);

    if (!from || !to) return new Response("Missing fields", { status: 400, headers: corsHeaders });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Identify Integration & Auto-Pilot Status
    let { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('user_id, auto_pilot_enabled')
      .eq('phone_number', to)
      .maybeSingle();

    if (!integration) {
      const toNoPlus = to.replace(/^\+/, '');
      const { data: retryData } = await supabaseAdmin
        .from('integrations')
        .select('user_id, auto_pilot_enabled')
        .eq('phone_number', toNoPlus)
        .maybeSingle();
      if (retryData) integration = retryData;
    }

    if (!integration) return new Response("No tenant found", { status: 200, headers: corsHeaders });

    const userId = integration.user_id;

    // 2. Find/Create Conversation
    let conversationId = null;
    const cleanFrom = from.replace(/\D/g, '').slice(-10);
    const { data: recentConvs } = await supabaseAdmin.from('conversations').select('id, phone').eq('user_id', userId).limit(50);
    
    if (recentConvs) {
      const match = recentConvs.find((c: any) => (c.phone || '').replace(/\D/g, '').slice(-10) === cleanFrom);
      if (match) conversationId = match.id;
    }

    if (!conversationId) {
        const { data: newConv } = await supabaseAdmin.from('conversations').insert({
          user_id: userId, phone: from, client_name: 'New Lead', last_message: body, status: 'new'
        }).select().single();
        conversationId = newConv.id;
    }

    // 3. Insert Message
    await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, sender: 'user', text: body });
    await supabaseAdmin.from('conversations').update({ last_message: body, last_message_at: new Date().toISOString(), status: 'new' }).eq('id', conversationId);

    // 4. TRIGGER AUTO-PILOT (Fire and Forget)
    if (integration.auto_pilot_enabled) {
        console.log("Auto-Pilot Triggered");
        // We use fetch without await to not block the response (or with a minimal timeout if runtime kills it)
        // Ideally utilize EdgeRuntime.waitUntil if available, but fetch is usually fine for short ops
        const generateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-reply`;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        fetch(generateUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, action: 'reply_and_send', user_id: userId })
        }).catch(e => console.error("Auto-Pilot Fetch Error:", e));
    }

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { ...corsHeaders, "Content-Type": "text/xml" } });

  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
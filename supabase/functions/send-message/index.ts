




import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, body, channel = 'sms', user_id } = await req.json(); // Accept user_id from body for admin calls
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    let user;

    // Check if this is a "System" call (from another Edge Function using Service Role)
    if (authHeader.includes(supabaseServiceKey)) {
        if (!user_id) throw new Error("Missing user_id for system call");
        user = { id: user_id };
    } else {
        // Normal user call
        const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData.user) throw new Error("Unauthorized user");
        user = userData.user;
    }

    // Initialize Admin Client to read secure settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: integration, error: intError } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (intError || !integration) throw new Error("Integration settings not found.");

    console.log(`Sending ${channel} message to ${to}`);
    let result;

    if (channel === 'sms') {
       if (!integration.account_sid) throw new Error("Twilio SID missing");
       
       const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.account_sid}/Messages.json`;
       const formData = new URLSearchParams();
       formData.append('To', to);
       formData.append('From', integration.phone_number);
       formData.append('Body', body);

       const res = await fetch(twilioUrl, {
         method: 'POST',
         headers: {
           'Authorization': `Basic ${btoa(`${integration.account_sid}:${integration.auth_token}`)}`,
           'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: formData,
       });
       
       const text = await res.text();
       try { result = JSON.parse(text); } catch { result = { text }; }
       if (!res.ok) throw new Error(`Twilio: ${result.message || result.detail}`);
    } 
    else if (channel === 'facebook' || channel === 'instagram') {
       if (!integration.meta_page_id) throw new Error("Meta Page ID missing");
       const url = `https://graph.facebook.com/v18.0/${integration.meta_page_id}/messages?access_token=${integration.meta_access_token}`;
       const res = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ recipient: { id: to }, message: { text: body } })
       });
       result = await res.json();
       if (result.error) throw new Error(`Meta: ${result.error.message}`);
    }
    else if (channel === 'whatsapp') {
       if (!integration.whatsapp_phone_id) throw new Error("WhatsApp Phone ID missing");
       const url = `https://graph.facebook.com/v18.0/${integration.whatsapp_phone_id}/messages`;
       const res = await fetch(url, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${integration.meta_access_token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: body } })
       });
       result = await res.json();
       if (result.error) throw new Error(`WhatsApp: ${result.error.message}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Send Message Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
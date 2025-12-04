
// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
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
    const supabaseClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Get the current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error("No user found in request");
      throw new Error("Unauthorized: Invalid user session");
    }

    // 2. Get the user's Twilio credentials from the database
    const { data: integration, error: intError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'twilio')
      .single();

    if (intError || !integration) {
      console.error("Integration not found for user:", user.id);
      throw new Error("Twilio integration not configured. Please add your keys in Settings.");
    }

    // 3. Parse request body
    const { to, body } = await req.json();

    // 4. Call Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.account_sid}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', integration.phone_number);
    formData.append('Body', body);

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${integration.account_sid}:${integration.auth_token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("Twilio API Error:", twilioData);
      throw new Error(`Twilio Error: ${twilioData.message || twilioData.detail || "Unknown error"}`);
    }

    return new Response(JSON.stringify({ success: true, data: twilioData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WishRequest {
  name: string;
  age: number | null;
  relationship: string | null;
  language: string;
  notes: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, age, relationship, language, notes } =
      (await req.json()) as WishRequest;

    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: "Claude API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isAfrikaans = language === "af";

    const systemPrompt = isAfrikaans
      ? `Jy is 'n vriendelike boodskap-assistent wat hartlike verjaardagwense skryf in Afrikaans. Skryf boodskappe wat warm, opreg en persoonlik voel. Hou boodskappe kort — 1 tot 3 sinne. Gebruik gepaste emojis. Antwoord SLEGS met 'n JSON-array van 3 strings.`
      : `You are a friendly message assistant that writes heartfelt birthday wishes. Write messages that feel warm, genuine, and personal. Keep messages short — 1 to 3 sentences. Use appropriate emojis. Respond ONLY with a JSON array of 3 strings.`;

    const ageInfo =
      age && age > 0
        ? isAfrikaans
          ? `Word ${age} jaar oud`
          : `Turning ${age}`
        : "";
    const relationInfo = relationship
      ? isAfrikaans
        ? `Verhouding: ${relationship}`
        : `Relationship: ${relationship}`
      : "";
    const notesInfo = notes
      ? isAfrikaans
        ? `Notas oor hulle: ${notes}`
        : `Notes about them: ${notes}`
      : "";

    const userPrompt = isAfrikaans
      ? `Skryf 3 verskillende verjaardagwense vir ${name}. ${ageInfo}${relationInfo ? `. ${relationInfo}` : ""}${notesInfo ? `. ${notesInfo}` : ""}.

Styl 1: Warm en tradisioneel
Styl 2: Pret en feestelik
Styl 3: Kort en soet

Antwoord as 'n JSON-array van 3 strings, bv.: ["wens1", "wens2", "wens3"]`
      : `Write 3 different birthday wishes for ${name}. ${ageInfo}${relationInfo ? `. ${relationInfo}` : ""}${notesInfo ? `. ${notesInfo}` : ""}.

Style 1: Warm and traditional
Style 2: Fun and celebratory
Style 3: Short and sweet

Respond as a JSON array of 3 strings, e.g.: ["wish1", "wish2", "wish3"]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return new Response(
        JSON.stringify({ error: "AI service error", detail: errorBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const claudeData = await response.json();
    const content = claudeData.content?.[0]?.text ?? "[]";

    // Parse the JSON array from Claude's response
    let wishes: string[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      wishes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse wishes:", content);
      wishes = [content];
    }

    return new Response(JSON.stringify({ wishes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

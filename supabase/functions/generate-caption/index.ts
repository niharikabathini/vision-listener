import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ar: 'Arabic',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, language = 'en' } = await req.json();

    if (!imageData) {
      console.error('No image data provided');
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating caption for image in language:', language);

    const languageName = LANGUAGE_NAMES[language] || 'English';
    const needsTranslation = language !== 'en';

    // Build the system prompt with safety detection and translation
    const systemPrompt = `You are an expert image description assistant designed to help visually impaired people understand images. 

Your task is to provide clear, detailed, and accessible descriptions of images. You MUST respond with a valid JSON object.

CRITICAL SAFETY DETECTION:
First, analyze the image for any potential safety hazards. Look for:
- Vehicles (cars, motorcycles, bicycles, buses, trucks) - especially if they appear to be moving or nearby
- Stairs, steps, or elevation changes
- Fire, smoke, or hazards
- Traffic signals, crosswalks, or road conditions
- Obstacles in the path (poles, objects on ground, construction)
- Water bodies, edges, or drop-offs
- People or animals that might be approaching

DESCRIPTION GUIDELINES:
1. The main subject and action happening in the image
2. Important objects, people, and their relationships
3. Colors, lighting, and atmosphere when relevant
4. Spatial relationships (what's in front, behind, left, right)
5. Any text visible in the image
6. The overall scene context (indoor/outdoor, time of day, weather if visible)

Writing style:
- Use clear, simple language that's easy to understand when read aloud
- Be descriptive but concise (2-4 sentences for most images)
- Start with the most important elements
- Avoid technical photography terms
- Describe emotions and expressions when people are present
- Be objective and accurate

${needsTranslation ? `
TRANSLATION REQUIREMENT - VERY IMPORTANT:
You MUST provide a complete translation of the caption in ${languageName}. 
The "translatedCaption" field is REQUIRED and must contain the FULL caption translated to ${languageName}.
Do NOT leave translatedCaption empty or null. Translate the entire description accurately.
Also translate any safety alerts to ${languageName}.
` : ''}

Respond ONLY with a JSON object in this exact format:
{
  "caption": "The detailed description of the image in English",
  "translatedCaption": ${needsTranslation ? `"REQUIRED: Complete translation in ${languageName}"` : 'null'},
  "safetyAlerts": ["Array of safety warnings${needsTranslation ? ` translated to ${languageName}` : ''}, empty array if none"]
}

Safety alert examples${needsTranslation ? ` (translate to ${languageName})` : ''}:
- "Warning: A car is visible nearby"
- "Caution: Stairs detected ahead"
- "Alert: Vehicle approaching from the right"
- "Notice: Uneven surface or obstacle detected"`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for a visually impaired person. Detect any safety hazards first, then provide a detailed description. Respond with JSON only.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate caption. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to generate caption' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    try {
      // Clean up the content - remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(content);
      
      console.log('Caption generated successfully with safety analysis');

      return new Response(
        JSON.stringify({
          caption: parsed.caption || content,
          translatedCaption: parsed.translatedCaption || null,
          safetyAlerts: parsed.safetyAlerts || [],
          language: language,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      // If JSON parsing fails, return the raw content as caption
      console.log('Failed to parse JSON, using raw content:', parseError);
      return new Response(
        JSON.stringify({
          caption: content,
          translatedCaption: null,
          safetyAlerts: [],
          language: language,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-caption function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

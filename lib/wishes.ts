import { supabase } from './supabase';

interface GenerateWishParams {
  name: string;
  age: number | null;
  relationship: string | null;
  language: string;
  notes: string | null;
}

export async function generateWishes(
  params: GenerateWishParams
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('generate-wish', {
    body: params,
  });

  if (error) {
    console.error('Generate wish error:', error);
    throw new Error('Failed to generate wishes');
  }

  return data?.wishes ?? [];
}

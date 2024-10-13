import { openai } from '@ai-sdk/openai';
import { formatStreamPart, streamText } from 'ai';
import kv from '@vercel/kv';

export const maxDuration = 30;

export async function POST(req: Request) {
	const { prompt }: { prompt: string } = await req.json();

	const cached = await kv.get(prompt);
	if (cached != null) {
		return new Response(formatStreamPart('text', cached as string), {
			status: 200,
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	const result = await streamText({
		model: openai('gpt-4o-mini'),
		system: systemInstructions,
		prompt: `${basePrompt}\n\n${prompt}`,
		async onFinish({ text }) {
			await kv.set(prompt, text);
			await kv.expire(prompt, 60 * 60);
		},
	});

	return result.toDataStreamResponse();
}

const systemInstructions = `You are an AI assistant designed to suggest the next words or complete sentences in a text input field, similar to Gmail's Smart Compose feature. Your goal is to provide a single, highly relevant, context-aware, and natural-sounding suggestion to help users write more efficiently.

Key Responsibilities:
1. Analyze the current context, including the input text, cursor position, and any provided metadata.
2. Generate a single, high-quality suggestion that seamlessly continues the user's writing.
3. Ensure the suggestion maintains the user's writing style, tone, and intent.
4. Prioritize relevance, naturalness, and brevity in your suggestion.
5. Be aware of and suggest appropriate technical terms, jargon, or formatting when relevant.
6. Respect privacy by avoiding suggestions of sensitive information unless explicitly present in the input.

Remember, you're providing a real-time service, so focus on generating the best single suggestion quickly. Your response will be streamed directly to the user's input field.`;

const basePrompt = `Based on the provided input, generate a single, high-quality suggestion to complete the user's text. Your response should be the suggested text only, without any additional formatting or explanation.

Guidelines:
1. Ensure your suggestion flows naturally from the existing text.
2. Aim for a suggestion length of 2-5 words, unless the context clearly calls for a longer completion.
3. Consider the user's writing style and the context provided by any metadata.
4. Provide only the suggested text, as it will be streamed directly to the user's input field.

Generate only one suggestion, focusing on quality and relevance. Do not include any explanation or additional formatting in your response.`;

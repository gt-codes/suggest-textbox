'use client';

import { useCompletion } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { KeyboardEvent } from 'react';

export default function Chat() {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [cursorPosition, setCursorPosition] = useState(0);

	const { input, isLoading, setInput, handleInputChange, complete, completion } = useCompletion({
		api: '/api/suggest',
	});
	const [value] = useDebounce(input, 250);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.key === 'Tab' || e.key === 'ArrowRight') && completion) {
			e.preventDefault();
			setInput(input + completion);
			setCursorPosition(input.length + completion.length);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		handleInputChange(e);
		setCursorPosition(e.target.selectionStart || 0);
	};

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
		}
	}, [cursorPosition, value]);

	useEffect(() => {
		if (value) {
			complete(value);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	useEffect(() => {
		if (completion) {
		}
	}, [completion]);

	return (
		<div className='flex flex-col w-full max-w-md py-24 mx-auto stretch'>
			<div className='max-w-md mx-auto p-4 font-sans w-full'>
				<div className='relative'>
					<textarea
						rows={4}
						id='textarea'
						value={input}
						aria-label='Message'
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder='Enter text here...'
						className='w-full px-4 py-2 text-lg text-gray-700 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out resize-none'
					/>
					<div className='absolute inset-0 pointer-events-none' aria-hidden='true'>
						<div className='px-4 py-2 text-lg'>
							<span className='invisible'>{value}</span>
							<span className='text-gray-400'>{completion}</span>
						</div>
					</div>
				</div>
				{isLoading && <p className='mt-2 text-sm text-gray-500'>Loading...</p>}
			</div>
		</div>
	);
}

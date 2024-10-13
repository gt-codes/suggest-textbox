'use client';

import { useCompletion } from 'ai/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { KeyboardEvent } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Chat() {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [cursorPosition, setCursorPosition] = useState(0);
	const [isSwipeActive, setIsSwipeActive] = useState(false);
	const [lastAcceptedLength, setLastAcceptedLength] = useState(0);

	const { input, isLoading, setInput, handleInputChange, complete, completion, setCompletion } = useCompletion({
		api: '/api/suggest',
	});
	const [value] = useDebounce(input, 300);

	const acceptSuggestion = useCallback(() => {
		const newInput = input + completion;
		setInput(newInput);
		setCursorPosition(newInput.length);
		setLastAcceptedLength(newInput.length);
		setCompletion('');
	}, [input, completion, setInput, setCompletion]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.key === 'Tab' || e.key === 'ArrowRight') && completion) {
			e.preventDefault();
			acceptSuggestion();
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
		if (value === '') {
			setLastAcceptedLength(0);
			setCompletion('');
		} else if (value && value.length > lastAcceptedLength) {
			complete(value);
		}
	}, [value, complete, setCompletion, lastAcceptedLength]);

	const swipeHandlers = useSwipeable({
		onSwipedRight: () => {
			if (completion) {
				acceptSuggestion();
			}
			setIsSwipeActive(false);
		},
		onSwipeStart: () => setIsSwipeActive(true),
		onSwiped: () => setIsSwipeActive(false),
		trackMouse: true,
	});

	return (
		<div className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='max-w-2xl mx-auto p-4 font-sans w-full'>
				<div
					className={`relative transition-transform duration-200 ${isSwipeActive ? 'scale-102' : ''}`}
					{...swipeHandlers}>
					<textarea
						ref={textareaRef}
						id='textarea'
						value={input}
						aria-label='Message'
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder='Enter text here...'
						className='w-full text-3xl text-gray-800 focus:outline-none resize-none'
					/>
					<div className='absolute inset-0 pointer-events-none z-10' aria-hidden='true'>
						<div className='text-3xl'>
							<span className='invisible'>{input}</span>
							<span className='text-gray-400'>{completion}</span>
						</div>
					</div>
				</div>
			</div>
			<AnimatePresence>
				{isLoading && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.3 }}
						className='absolute bottom-24 flex items-center space-x-2'>
						<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

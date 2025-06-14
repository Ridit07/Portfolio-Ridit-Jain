import React, { useState, useEffect } from 'react';
import '../styles/AnimatedCode.css';

const SNIPPETS = [
  'console.log("Hello, world!");',   
  'cout << "Hello, world!";',        
  'fmt.Println("Hello, world!")',    
  'print("Hello, world!")'          
];

export default function AnimatedCode() {

  const TYPING_SPEED = 100;       
  const DELETING_SPEED = 50;     
  const PAUSE_AFTER_FULL = 1000; 
  const PAUSE_AFTER_EMPTY = 500;  

  const [snippetIndex, setSnippetIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const currentLine = SNIPPETS[snippetIndex];
    let timeout;

    if (!isDeleting && displayText.length < currentLine.length) {
      timeout = setTimeout(() => {
        setDisplayText(currentLine.slice(0, displayText.length + 1));
      }, TYPING_SPEED);

    } else if (!isDeleting && displayText.length === currentLine.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, PAUSE_AFTER_FULL);

    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(currentLine.slice(0, displayText.length - 1));
      }, DELETING_SPEED);

    } else if (isDeleting && displayText.length === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setSnippetIndex((prev) => (prev + 1) % SNIPPETS.length);
      }, PAUSE_AFTER_EMPTY);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, snippetIndex]);

  return (
    <div className="animated-code-container">
      <pre className="animated-code">
        <code>
          {displayText}
          <span className="cursor">{showCursor ? '|' : ' '}</span>
        </code>
      </pre>
    </div>
  );
}

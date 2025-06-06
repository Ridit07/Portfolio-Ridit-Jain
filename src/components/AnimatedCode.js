import React, { useState, useEffect } from 'react';
import '../styles/AnimatedCode.css';

export default function AnimatedCode() {
  // 1) Four snippets to cycle through:
  const SNIPPETS = [
    'console.log("Hello, world!");',   // JavaScript
    'cout << "Hello, world!";',        // C++
    'fmt.Println("Hello, world!")',    // Go
    'print("Hello, world!")'           // Python
  ];

  // 2) Speeds (in milliseconds):
  const TYPING_SPEED = 100;       // time between typing each char
  const DELETING_SPEED = 50;      // time between deleting each char
  const PAUSE_AFTER_FULL = 1000;  // pause after a line is completely typed
  const PAUSE_AFTER_EMPTY = 500;  // pause after a line is completely deleted

  // 3) State:
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // We’ll keep track of “position” by looking at displayText.length,
  // so we don’t need a separate charIndex state.

  // 4) Blink cursor state:
  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // 5) Main typing/deleting effect:
  useEffect(() => {
    const currentLine = SNIPPETS[snippetIndex];
    let timeout;

    if (!isDeleting && displayText.length < currentLine.length) {
      // STILL TYPING:
      timeout = setTimeout(() => {
        setDisplayText(currentLine.slice(0, displayText.length + 1));
      }, TYPING_SPEED);

    } else if (!isDeleting && displayText.length === currentLine.length) {
      // FINISHED TYPING: pause before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, PAUSE_AFTER_FULL);

    } else if (isDeleting && displayText.length > 0) {
      // STILL DELETING:
      timeout = setTimeout(() => {
        setDisplayText(currentLine.slice(0, displayText.length - 1));
      }, DELETING_SPEED);

    } else if (isDeleting && displayText.length === 0) {
      // FINISHED DELETING: move to next snippet after a brief pause
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

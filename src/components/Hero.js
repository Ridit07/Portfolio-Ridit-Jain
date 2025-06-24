import React from 'react';
import '../styles/Hero.css';

import AnimatedCode from './AnimatedCode';

const cvUrl = 'https://drive.google.com/uc?export=download&id=1MKk86pcjkFOUkLc7B68uhO4T8VUTlqlC';


export default function Hero() {
  return (
    <header id="hero" className="hero">
      <div className="hero-content">
        <h1>Hey, I’m Ridit Jain.</h1>
        <p className="subtitle">
          Backend-Focused Full-Stack Developer | Go · C++ · MySQL · Redis
        </p>
        <a href="#about" className="btn">Discover More</a>

        <a
          href={cvUrl}
          className="btn btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download CV
        </a>

      </div>

      <div className="hero-code">
       <AnimatedCode />
      </div>
    </header>
  );
}

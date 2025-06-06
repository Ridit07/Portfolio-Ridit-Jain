import React, { useState } from 'react';
import '../styles/Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-logo">
        RI<span>DI</span>T
      </div>
      <ul className={`nav-links ${open ? 'open' : ''}`}>
        <li><a href="#about" className="nav-link" onClick={() => setOpen(false)}>About</a></li>
        <li><a href="#experience" className="nav-link" onClick={() => setOpen(false)}>Experience</a></li>
        <li><a href="#projects" className="nav-link" onClick={() => setOpen(false)}>Projects</a></li>
        <li><a href="#education" className="nav-link" onClick={() => setOpen(false)}>Education</a></li>
        <li><a href="#contact" className="nav-link" onClick={() => setOpen(false)}>Contact</a></li>
      </ul>
      <div className="nav-toggle" onClick={() => setOpen(!open)}>
        <i className="fas fa-bars"></i>
      </div>
    </nav>
  );
}

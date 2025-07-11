import React from 'react';
import '../styles/About.css';
import headshot from '../assets/RiditPhoto.jpeg'; 

export default function About() {
  return (
    <section id="about" className="about section">
      <h2 className="section-title">About Me</h2>
      <div className="about-container">
        <div className="about-text">
          <p>
            I'm a backend-first full-stack developer who’s passionate about building real-world systems that scale. From optimizing inventory at Zomato to delivering AI-powered platforms at HCL, I thrive at the intersection of code, systems, and impact.
          </p>
          <ul>
            <li>➤ Built Go-based services at Zomato, reducing inventory hold time by <strong>30%</strong></li>
            <li>➤ Saved <strong>12%</strong> in overpayments at HCL by building a full-stack recruitment invoice platform with AI and automation</li>
            <li>➤ Led the winning team in <strong>Smart India Hackathon</strong> (400+ teams)</li>
            <li>➤ VP & Treasurer, <strong>Robotics Club</strong> (grew participation by 40%)</li>
          </ul>
          <p>Always excited by big problems, fast teams, and clean code.</p>
        </div>
        <div className="about-image">
          {/* <img src={headshot} alt="Ridit Jain" /> */}
          <img src= {headshot} alt="Ridit Jain" loading="lazy" />
        </div>
      </div>
    </section>
  );
}

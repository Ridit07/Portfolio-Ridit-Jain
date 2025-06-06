import React from 'react';
import '../styles/Education.css';

export default function Education() {
  return (
    <section id="education" className="education section">
      <h2 className="section-title">Education</h2>
      <div className="edu-item">
        <h3>B.Tech in Computer Science &amp; Engineering</h3>
        <span className="edu-institution">BML Munjal University, Gurugram, India</span>
        <span className="edu-dates">Aug 2021 – Jun 2025</span>
        <ul className="edu-highlights">
          <li>CGPA: 7.9 / 10.0</li>
          <li>Smart India Hackathon Winner (400+ participants)</li>
          <li>VP, Robotics Club (40% ↑ engagement) &amp; Treasurer, Robotics Club</li>
          <li>Actively contributed to student residential affairs, ensuring smooth coordination of campus life activities</li>
        </ul>
      </div>
    </section>
  );
}

import React from 'react';
import '../styles/Projects.css';

export default function Projects() {
  const projectList = [
    {
        title: 'Interview Pro',
        desc: 'AI-powered interview analysis platform with cheat detection, emotion recognition, and analytics dashboards.',
        tech: ['Flask', 'Python', 'TensorFlow', 'React'],
        link: 'https://github.com/Ridit07/Interview-Pro',
    },
    {
        title: 'IPLITICS',
        desc: 'Android app providing real-time ball-by-ball cricket analysis using machine learning.',
        tech: ['Python', 'Flask', 'Flutter', 'ML Kit'],
        link: 'https://github.com/Ridit07/IPL-Prediction-App',
    },
    {
        title: 'Atithi Abhinandan',
        desc: `Internal SIH winner for AI travel platform with voice-assist, smart plans, reviews, and emergency support.`,
        tech: ['React', 'Node.js','Python'],
        link: 'https://github.com/Ridit07/SIH-ATITHI-ABHINANDAN-TRAVEL-APP', 
    },
    {
      title: 'MedBot AI',
      desc: 'Medical chatbot using Llama 2 + QLoRA for diagnostics and image analysis via Streamlit.',
      tech: ['Python', 'Streamlit', 'PyTorch'],
      link: 'https://github.com/Ridit07/Medical-Chatbot-LLM',
    },
    {
      title: 'Lane Detection System',
      desc: 'Deep learning-based Streamlit app achieving 92% precision for road lane detection.',
      tech: ['Python', 'OpenCV', 'TensorFlow'],
      link: 'https://github.com/Ridit07/Lane-Detection-Using-Deep-Learning',
    },
    {
      title: 'Hand Gesture → Text',
      desc: 'ML model converting hand gestures into English text—assistive communication for non-verbal users.',
      tech: ['Python', 'Mediapipe', 'TensorFlow'],
      link: 'https://github.com/Ridit07/Selective-Mutism-Hand-Gesture-To-Text',
    },
  ];

  return (
    <section id="projects" className="projects section">
      <h2 className="section-title">Projects</h2>
      <div className="projects-grid">
        {projectList.map((proj, idx) => (
          <div key={idx} className="project-card">
            <h3>{proj.title}</h3>
            <p>{proj.desc}</p>
            <ul className="tech-list">
              {proj.tech.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <a href={proj.link} className="project-link" target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

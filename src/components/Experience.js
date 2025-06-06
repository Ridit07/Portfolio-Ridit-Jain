import React, { useState } from 'react';
import '../styles/Experience.css';

export default function Experience() {
  const experiences = [
    {
      company: 'Zomato (Hyperpure)',
      role: 'Software Engineer Intern',
      timeline: 'Jan 2025 – Jun 2025',
      location: 'Gurugram, Haryana, India',
      techStack: ['Go', 'React.js', 'Redis', 'DynamoDB', 'SQL', 'gRPC', 'AWS'],
      summary:
        'Independently designed and deployed multiple production-critical backend systems to streamline procurement workflows, pricing governance, and internal debugging tools.',
      details: [
        {
          title: 'Intelligent Procurement Automation',
          bullets: [
            'Built a real-time dashboard for operations teams to track movement requests and their distribution details, with filters for delivery date, warehouse code, product code/name, and outlet code/name.',
            'Resolved major inventory blocking by integrating with a scheduler service to track unfulfilled goods receipt notes.',
            'Scheduled events to auto-resolve if no stock distribution arrived within 2 hours, using AWS Config for the timer.',
            'Upon timeout, a cron job auto-moved inventory from temporary to permanent storage—eliminating manual SQL interventions.',
            '➤ Impact: Reduced warehouse holding time by 30% and improved overall warehouse throughput.'
          ]
        },
        {
          title: 'System-wide Price Control Engine',
          bullets: [
            'Built a pricing safeguard mechanism to block updates below weighted-average procurement cost across all SKUs.',
            'Introduced override flows via Excel-based margin uploads (bulk XLSX validation → DynamoDB storage → Redash sync → downstream service updates).',
            'Supported both normal and account-based margin exceptions, validated expiry and duplicate entries before storing.',
            '➤ Impact: Prevented margin leakage and recovered ~15% pricing inefficiency across active inventory.'
          ]
        },
        {
          title: 'Internal Redis Debug Tool',
          bullets: [
            'Created a React + Go dashboard allowing engineers to run read-only Redis commands (GET, HGET, HGETALL, SMEMBERS) with whitelisting/validation.',
            'Implemented Redis pipelining for faster command execution and error handling.',
            '➤ Reduced debug time from 10+ minutes at the CLI to under 1 minute via the web UI.'
          ]
        },
        {
          title: 'Priority-Based Task Assignment',
          bullets: [
            'Developed logic to auto-assign storage transfer tasks based on zone-level priority and stock distribution status.',
            'Ensured time-sensitive inventory moved quickly from temp bins to outlet bins, preventing stock blocking.'
          ]
        },
        {
          title: 'Noise Reduction in Event Pipeline',
          bullets: [
            'Filtered non-actionable ASN events via a high-throughput, Redis-cached RPC call to order configurations.',
            '➤ Reduced event spam by 65%, preserving queue bandwidth and compute cycles.'
          ]
        }
      ]
    },
    {
      company: 'HCL Technologies',
      role: 'Software Engineer Intern',
      timeline: 'Jun 2023 – Jul 2023',
      location: 'Noida, Uttar Pradesh, India',
      techStack: ['Flutter', 'Python', 'SQL', 'Figma', 'REST APIs'],
      summary:
        'Built and deployed a full-stack AI-powered internal tool to automate vendor claim submissions, approvals, and invoicing—streamlining cross-team workflows.',
      details: [
        {
          title: 'Recruitment Invoice Tool (End-to-End)',
          bullets: [
            'Led development of a multi-role internal application for HR, sourcing, and finance teams to submit, validate, and approve vendor claims.',
            'UI/UX designed in Figma; frontend implemented in Flutter; backend written in Python with SQL schemas for persistence.',
            'Integrated an AI model to parse resumes and auto-generate rate cards based on experience, region, and skills.',
            'Ensured data security, role-based access, and audit logs for every stage.'
          ]
        },
        {
          title: 'Cross-Team Workflow & Architecture',
          bullets: [
            'Built a modular microservice architecture with REST APIs and verification modules, enabling seamless collaboration across HR, sourcing, and finance.',
            'Supported end-to-end flow from vendor claim intake to finance clearance, including notifications and status tracking.'
          ]
        },
        {
          title: 'Deployment & Optimization',
          bullets: [
            'Deployed the solution to HCL’s internal test environment, following DevOps best practices (CI/CD pipelines, environment configs).',
            'Collaborated with infrastructure teams to ensure staging-to-production readiness and basic observability (logs, metrics).'
          ]
        },
        {
          title: 'Measurable Impact',
          bullets: [
            '➤ Reduced claim processing time by ~40%.',
            '➤ Improved invoicing accuracy and transparency across stakeholders.',
            '➤ Saved an estimated 8–12% in vendor overpayments and operational overhead through early error detection.'
          ]
        }
      ]
    }
  ];

  return (
    <section id="experience" className="experience-section">
      <h2 className="section-title">Experience</h2>
      {experiences.map((exp, idx) => (
        <ExperienceCard key={idx} data={exp} />
      ))}
    </section>
  );
}

function ExperienceCard({ data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`exp-card ${isOpen ? 'open' : ''}`}>
      <div className="exp-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="exp-company">
          <h3>{data.company}</h3>
        </div>
        <div className="exp-meta">
          <span className="exp-role">{data.role}</span>
          <span className="exp-timeline">{data.timeline}</span>
          <span className="exp-location">{data.location}</span>
          <div className="exp-techstack">
            {data.techStack.map((tech, i) => (
              <span key={i} className="tech-pill">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="exp-summary">
          <p>{data.summary}</p>
        </div>
        <div className="exp-toggle-button">
          <button>{isOpen ? 'Hide Details ▲' : 'View More ▼'}</button>
        </div>
      </div>

      {isOpen && (
        <div className="exp-details">
          {data.details.map((section, i) => (
            <div key={i} className="exp-detail-section">
              <h4>{section.title}</h4>
              <ul>
                {section.bullets.map((bullet, j) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

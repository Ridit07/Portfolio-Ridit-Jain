import React, { useState } from 'react';
import '../styles/Contact.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FORM_ENDPOINT = 'https://formspree.io/f/xzzgdgbl';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });

      if (response.ok) {
        setFormData({ name: '', email: '', message: '' });
        toast.success('Thank you! Your message has been sent.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined
        });
      } else {
        toast.error('Oops! Something went wrong. Please try again later.', {
          position: 'top-center',
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error('Network error: Unable to send message.', {
        position: 'top-center',
        autoClose: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact section">
      <ToastContainer />

      <h2 className="section-title">Get In Touch</h2>
      <div className="contact-container">
        <div className="contact-info">
          <p>
            <i className="fas fa-envelope"></i>{' '}
            <a href="mailto:riditjain2@gmail.com">riditjain2@gmail.com</a>
          </p>
          {/* <p>
            <i className="fas fa-phone"></i> +91 12345 67890
          </p> */}
          <p>
            <i className="fas fa-map-marker-alt"></i> Gurugram, Haryana, India
          </p>
          <div className="social-links">
            <a href="https://github.com/Ridit07" target="_blank" rel="noreferrer">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://www.linkedin.com/in/ridit-jain-479230214/" target="_blank" rel="noreferrer">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="https://leetcode.com/u/ridit_jain19/" target="_blank" rel="noreferrer">
              <i className="fas fa-code"></i>
            </a>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <textarea
            name="message"
            rows="5"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}

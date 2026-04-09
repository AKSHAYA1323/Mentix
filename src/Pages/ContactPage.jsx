import { useState } from 'react';
import emailjs from '@emailjs/browser';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [selectedCountry, setSelectedCountry] = useState({ flag: '🇮🇳', code: '+91', name: 'India' });

  const countries = [
    { flag: '🇮🇳', code: '+91',  name: 'India' },
    { flag: '🇺🇸', code: '+1',   name: 'United States' },
    { flag: '🇬🇧', code: '+44',  name: 'United Kingdom' },
    { flag: '🇦🇺', code: '+61',  name: 'Australia' },
    { flag: '🇨🇦', code: '+1',   name: 'Canada' },
    { flag: '🇩🇪', code: '+49',  name: 'Germany' },
    { flag: '🇫🇷', code: '+33',  name: 'France' },
    { flag: '🇯🇵', code: '+81',  name: 'Japan' },
    { flag: '🇨🇳', code: '+86',  name: 'China' },
    { flag: '🇧🇷', code: '+55',  name: 'Brazil' },
    { flag: '🇷🇺', code: '+7',   name: 'Russia' },
    { flag: '🇰🇷', code: '+82',  name: 'South Korea' },
    { flag: '🇮🇹', code: '+39',  name: 'Italy' },
    { flag: '🇪🇸', code: '+34',  name: 'Spain' },
    { flag: '🇲🇽', code: '+52',  name: 'Mexico' },
    { flag: '🇿🇦', code: '+27',  name: 'South Africa' },
    { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
    { flag: '🇵🇰', code: '+92',  name: 'Pakistan' },
    { flag: '🇧🇩', code: '+880', name: 'Bangladesh' },
    { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia' },
    { flag: '🇦🇪', code: '+971', name: 'UAE' },
    { flag: '🇸🇬', code: '+65',  name: 'Singapore' },
    { flag: '🇲🇾', code: '+60',  name: 'Malaysia' },
    { flag: '🇹🇷', code: '+90',  name: 'Turkey' },
    { flag: '🇦🇷', code: '+54',  name: 'Argentina' },
  ];

  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          message: formData.message,
          to_email: 'korplz1408@gmail.com',
        },
        EMAILJS_PUBLIC_KEY
      );

      setSubmitStatus({
        type: 'success',
        message: "Thank you for reaching out! We'll get back to you shortly."
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please email us directly at korplz1408@gmail.com'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="git-contact-wrapper">
      <div className="git-glow"></div>

      <div className="git-inner">

        {/* Left Side */}
        <div className="git-left">
          <span className="git-badge">Contact Us</span>
          <h1 className="git-heading">Let's Get In Touch.</h1>
          <p className="git-subtext">
            Or just reach out manually to{' '}
            <a href="mailto:korplz1408@gmail.com" className="git-email-link">
              korplz1408@gmail.com
            </a>.
          </p>
        </div>

        {/* Right Side Form */}
        <div className="git-right">
          <form className="git-form" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="git-field">
              <label className="git-label">Full Name</label>
              <div className="git-input-wrap">
                <i className="far fa-user git-input-icon"></i>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="git-input"
                  placeholder="Enter your full name..."
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="git-field">
              <label className="git-label">Email Address</label>
              <div className="git-input-wrap">
                <i className="far fa-envelope git-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="git-input"
                  placeholder="Enter your email address..."
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="git-field">
              <label className="git-label">Phone Number</label>
              <div className="git-phone-wrap">
                <div className="git-phone-prefix">
                  <span className="git-prefix-flag">{selectedCountry.flag}</span>
                  <select
                    className="git-country-select"
                    value={selectedCountry.name}
                    onChange={(e) => {
                      const c = countries.find(c => c.name === e.target.value);
                      if (c) setSelectedCountry(c);
                    }}
                  >
                    {countries.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down git-chevron"></i>
                </div>
                <div className="git-phone-input-wrap">
                  <span className="git-dial-code">{selectedCountry.code}</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="git-phone-input"
                    placeholder="000 000 0000"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="git-field">
              <div className="git-label-row">
                <label className="git-label">Message</label>
                <span className="git-char-count">{formData.message.length}/300</span>
              </div>
              <div className="git-textarea-wrap">
                <textarea
                  name="message"
                  rows="3"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength="300"
                  className="git-textarea"
                  placeholder="Enter your main text here..."
                  required
                ></textarea>
                <svg className="git-resize-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M16 11.5L11.5 16H9.5L16 9.5V11.5ZM16 5.5L5.5 16H3.5L16 3.5V5.5ZM16 1.5L1.5 16H0L16 0V1.5L1.5 16Z" fill="#6b7280"/>
                </svg>
              </div>
            </div>

            {/* Checkbox */}
            <div className="git-checkbox-row">
              <input
                id="privacy"
                type="checkbox"
                className="git-checkbox"
                required
              />
              <label htmlFor="privacy" className="git-checkbox-label">
                I hereby agree to our{' '}
                <a href="#" className="git-policy-link">Privacy Policy</a> terms.
              </label>
            </div>

            {/* Status */}
            {submitStatus.message && (
              <div className={`git-status git-status--${submitStatus.type}`}>
                <i className={`fas ${submitStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {submitStatus.message}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="git-submit-btn">
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
              ) : (
                <>Submit Form <i className="fas fa-arrow-right git-btn-arrow"></i></>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

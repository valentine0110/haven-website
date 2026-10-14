import React, { useState } from "react";
import { ArrowRight, Check, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { addEnquiry } from "../lib/store";
import { useSEO } from "../lib/seo";
import { SITE_CONFIG, toTel } from "../lib/config";
import ScrollReveal from "../components/ScrollReveal";

export default function Contact() {
  useSEO({ title: "Contact us", description: "Contact Haven Property Co. about buying, renting, selling or property advisory services.", path: "/contact" });
  
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", purpose: "Buy a home", message: "", hp: "" });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const errors = {
    name: form.name.length < 2 ? "Please enter your name" : null,
    email: !validateEmail(form.email) ? "Please enter a valid email" : null,
    message: form.message.length < 5 ? "Please add more detail" : null,
  };

  const isFormValid = !errors.name && !errors.email && !errors.message;

  async function submit(e) {
    e.preventDefault();
    if (form.hp) return;
    
    setTouched({ name: true, email: true, message: true });
    if (!isFormValid) return;

    setSending(true); 
    setSubmitError("");
    
    try {
      await addEnquiry({ name: form.name, email: form.email, phone: form.phone, message: `[${form.purpose}] ${form.message}`, source: "Contact page" });
      await new Promise(r => setTimeout(r, 600)); // Brief delay for animation effect
      setSent(true);
    } catch (err) { 
      setSubmitError(err.message || "Couldn't send your message — please try again."); 
    } finally { 
      setSending(false); 
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <main className="contact-page container">
      <ScrollReveal direction="left">
        <div className="contact-intro">
          <span className="eyebrow">GET IN TOUCH</span>
          <h1>Tell us what<br />you're looking for.</h1>
          <p>Buying, renting, selling, or just figuring out your next move — we'll point you in the right direction.</p>
          <div className="contact-lines">
            {SITE_CONFIG.phone && <a href={`tel:${toTel(SITE_CONFIG.phone)}`}><Phone size={17} /> {SITE_CONFIG.phone}</a>}
            {SITE_CONFIG.email && <a href={`mailto:${SITE_CONFIG.email}`}><Mail size={17} /> {SITE_CONFIG.email}</a>}
            <span><Clock3 size={17} /> Mon–Sat · 9:30–18:30 IST</span>
            <span><MapPin size={17} /> {SITE_CONFIG.cities.join(", ")}</span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={200}>
        <div className="contact-form-wrap">
          {sent ? (
            <div className="sent-state sent-enter">
              <div className="sent-icon"><Check /></div>
              <h2>Thanks. We've got it.</h2>
              <p>Your enquiry is in the staff lead queue. Someone from the team can follow up during working hours.</p>
              <button type="button" className="outline-btn" onClick={() => { 
                setSent(false); 
                setForm({ name: "", email: "", phone: "", purpose: "Buy a home", message: "", hp: "" }); 
                setTouched({ name: false, email: false, message: false });
              }}>Send another message</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="honeypot" aria-hidden="true" />
              
              <div className="form-label">YOUR DETAILS</div>
              <div className="two-fields">
                <label>
                  Name
                  <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => handleBlur('name')} />
                  {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
                </label>
                <label>
                  Email
                  <input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => handleBlur('email')} />
                  {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
                </label>
              </div>
              <label>Phone (optional)<input autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              
              <div className="form-label">I'M HERE TO</div>
              <div className="choice-grid">
                {["Buy a home", "Find a rental", "Sell a property", "Talk to an agent"].map((x) => (
                  <label key={x}>
                    <input type="radio" name="purpose" checked={form.purpose === x} onChange={() => setForm({ ...form, purpose: x })} />
                    <span>{x}</span>
                  </label>
                ))}
              </div>
              
              <label>
                Message
                <textarea required minLength={5} rows={7} placeholder="Tell us a little about your search..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} onBlur={() => handleBlur('message')} />
                {touched.message && errors.message && <span className="field-error">{errors.message}</span>}
              </label>
              
              {submitError && <p className="form-error" role="alert">{submitError}</p>}
              
              <button className="dark-btn" type="submit" disabled={sending}>{sending ? "Sending..." : "Send message"} <ArrowRight size={16} /></button>
              <small>By sending this form, you agree to be contacted about your enquiry. See our <Link to="/privacy">privacy policy</Link>.</small>
            </form>
          )}
        </div>
      </ScrollReveal>
    </main>
  );
}

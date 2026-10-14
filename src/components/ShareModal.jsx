import React, { useState, useEffect } from "react";
import { X, Copy, Check, MessageCircle, Send, Mail, Share2 } from "lucide-react";
import { SITE_CONFIG } from "../lib/config";

export default function ShareModal({ property, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : `${SITE_CONFIG.url}/properties/${property.slug}`;
  const shareText = `Check out ${property.title} in ${property.location}, ${property.city} on Haven Property Co.`;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: shareText,
          url: url,
        });
        onClose();
      } catch (e) {
        // user cancelled or share failed
      }
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(`${shareText}\n\nView here: ${url}`)}`;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <div className="share-modal-dialog">
        <button
          type="button"
          className="modal-x"
          onClick={onClose}
          aria-label="Close share dialog"
        >
          <X size={17} />
        </button>

        <span className="eyebrow">SHARE PROPERTY</span>
        <h3 id="share-title" className="share-dialog-title">
          {property.title}
        </h3>
        <p className="share-dialog-sub">
          {property.location}, {property.city} · ID: {property.id}
        </p>

        <div className="share-copy-box">
          <input
            type="text"
            readOnly
            value={url}
            className="share-url-input"
            onClick={(e) => e.target.select()}
            aria-label="Property URL"
          />
          <button
            type="button"
            className={`dark-btn small ${copied ? "copied-btn" : ""}`}
            onClick={handleCopy}
            aria-label="Copy property link"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy link
              </>
            )}
          </button>
        </div>

        <div className="share-actions-grid">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn share-wa"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn share-x"
            aria-label="Share on X (Twitter)"
          >
            <Send size={18} />
            <span>X / Twitter</span>
          </a>

          <a
            href={mailUrl}
            className="share-btn share-email"
            aria-label="Share via Email"
          >
            <Mail size={18} />
            <span>Email</span>
          </a>

          {typeof navigator !== "undefined" && navigator.share && (
            <button
              type="button"
              className="share-btn share-more"
              onClick={handleNativeShare}
              aria-label="More share options"
            >
              <Share2 size={18} />
              <span>More...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


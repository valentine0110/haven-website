import React, { useEffect, useRef } from "react";
import { X, Check, Minus, ArrowRight, ExternalLink, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { priceLabel, formatMoney, AMENITY_OPTIONS } from "../lib/store";
import { usePreferences } from "../lib/preferences";

export default function CompareModal({ properties = [], onClose, onRemove }) {
  const modalRef = useRef(null);
  const { formatArea } = usePreferences();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (!properties || properties.length === 0) return null;

  return (
    <div
      className="modal-backdrop compare-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-heading"
    >
      <div className="compare-dialog" ref={modalRef}>
        <div className="compare-header">
          <div>
            <span className="eyebrow">HEAD TO HEAD</span>
            <h2 id="compare-heading">Compare Properties ({properties.length})</h2>
          </div>
          <div className="compare-header-actions">
            <button
              type="button"
              className="outline-btn small"
              onClick={() => window.print()}
              aria-label="Print comparison"
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              className="modal-x"
              onClick={onClose}
              aria-label="Close comparison"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="compare-table-container">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="feature-col">Property Details</th>
                {properties.map((p) => (
                  <th key={p.id} className="prop-col">
                    <div className="compare-card-head">
                      {onRemove && properties.length > 1 && (
                        <button
                          type="button"
                          className="compare-remove-btn"
                          onClick={() => onRemove(p.id)}
                          aria-label={`Remove ${p.title} from comparison`}
                          title="Remove"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <img
                        src={p.image || "/placeholder-property.svg"}
                        alt={p.title}
                        className="compare-thumb"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-property.svg";
                        }}
                      />
                      <h4>{p.title}</h4>
                      <div className="compare-price">{priceLabel(p)}</div>
                      <Link
                        to={`/properties/${p.slug}`}
                        className="compare-view-link"
                        target="_blank"
                      >
                        View details <ExternalLink size={12} />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feature-col">Price / Sq Ft</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    {p.area > 0
                      ? `₹${Math.round(p.price / p.area).toLocaleString("en-IN")}/sqft`
                      : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Type &amp; Status</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    <span className="pill">{p.propertyType}</span> · {p.status}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Location</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    <b>{p.location}</b>
                    <br />
                    <span className="muted">{p.city}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Bedrooms / Baths</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    {p.bedrooms || 0} Beds · {p.bathrooms || 0} Baths
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Built-up Area</td>
                {properties.map((p) => (
                  <td key={p.id}><b>{formatArea(p.area)}</b></td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Floor</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    {p.floor !== null && p.floor !== undefined
                      ? `${p.floor === 0 ? "Ground" : p.floor}${
                          p.totalFloors ? ` of ${p.totalFloors}` : ""
                        }`
                      : "Independent"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Furnishing</td>
                {properties.map((p) => (
                  <td key={p.id}>{p.furnishing || "Unspecified"}</td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Parking</td>
                {properties.map((p) => (
                  <td key={p.id}>{p.parking ? `${p.parking} space(s)` : "None"}</td>
                ))}
              </tr>
              <tr>
                <td className="feature-col">Availability</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    <span
                      className={`compare-status-badge ${
                        p.availability === "Available" ? "status-ok" : "status-pending"
                      }`}
                    >
                      {p.availability}
                    </span>
                  </td>
                ))}
              </tr>

              <tr className="section-divider-row">
                <td colSpan={properties.length + 1}>
                  <b>KEY AMENITIES CHECKLIST</b>
                </td>
              </tr>

              {AMENITY_OPTIONS.slice(0, 10).map((amenity) => (
                <tr key={amenity}>
                  <td className="feature-col">{amenity}</td>
                  {properties.map((p) => {
                    const hasAmenity = (p.amenities || []).includes(amenity);
                    return (
                      <td key={p.id} className="text-center">
                        {hasAmenity ? (
                          <span className="amenity-check" title="Available">
                            <Check size={16} />
                          </span>
                        ) : (
                          <span className="amenity-cross" title="Not available">
                            <Minus size={14} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="feature-col">Action</td>
                {properties.map((p) => (
                  <td key={p.id}>
                    <Link
                      to={`/properties/${p.slug}`}
                      className="dark-btn full small"
                    >
                      Enquire <ArrowRight size={14} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}


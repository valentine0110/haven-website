import React, { useState, useEffect, useMemo } from "react";
import { Image as ImageIcon, MapPin, Save, Sparkles, Upload, X, Globe, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useSEO } from "../../lib/seo";
import { getSiteSettings, updateSiteSettings, uploadMedia } from "../../lib/store";
import { useAsync } from "../../lib/hooks";
import { PageLoading, PageError } from "../../components/DataState";
import { useToast } from "../../components/Toast";

function SettingsCard({ icon: Icon, title, description, children, accent }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon" style={accent ? { background: accent + "18", color: accent } : {}}>
          {Icon && <Icon size={16} />}
        </div>
        <div>
          <h3 className="settings-card-title">{title}</h3>
          {description && <p className="settings-card-desc">{description}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, onUpload, previewHeight = 160, hint }) {
  return (
    <div className="img-field">
      {label && <span className="img-field-label">{label}</span>}
      <div className="img-field-preview" style={{ height: previewHeight }}>
        {value ? (
          <>
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
            <button type="button" className="img-remove-btn" onClick={() => onChange("")} aria-label="Remove image">
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="img-field-empty">
            <ImageIcon size={24} />
            <span>No image set</span>
          </div>
        )}
      </div>
      <div className="img-field-controls">
        <input
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label || "Image"} URL`}
        />
        <label className="outline-btn small img-upload-btn">
          <Upload size={13} /> Upload
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onUpload} />
        </label>
      </div>
      {hint && <p className="img-field-hint">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  useSEO({ title: "Site Settings", path: "/admin/settings", noindex: true });

  const { data: initialSettings, loading, error, refetch } = useAsync(getSiteSettings, []);

  const [settings, setSettings] = useState({
    hero_image: "",
    offer_enabled: false,
    offer_image: "",
    offer_link: "",
    cities: null,
  });

  const [citiesInput, setCitiesInput] = useState("");
  const [singleCityInput, setSingleCityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (initialSettings) {
      const initialCities = initialSettings.cities || [];
      setSettings({
        hero_image: initialSettings.hero_image || "",
        offer_enabled: !!initialSettings.offer_enabled,
        offer_image: initialSettings.offer_image || "",
        offer_link: initialSettings.offer_link || "",
        cities: initialSettings.cities || null,
      });
      setCitiesInput(initialCities.join(", "));
    }
  }, [initialSettings]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialSettings) return false;
    const initialCities = initialSettings.cities || [];
    const currentCities = settings.cities || [];
    const citiesChanged = JSON.stringify(currentCities) !== JSON.stringify(initialCities);

    return (
      settings.hero_image !== (initialSettings.hero_image || "") ||
      settings.offer_enabled !== !!initialSettings.offer_enabled ||
      settings.offer_image !== (initialSettings.offer_image || "") ||
      settings.offer_link !== (initialSettings.offer_link || "") ||
      citiesChanged
    );
  }, [settings, initialSettings]);

  function handleCitiesChange(e) {
    const rawVal = e.target.value;
    setCitiesInput(rawVal);
    const parsed = rawVal
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setSettings((s) => ({ ...s, cities: parsed }));
  }

  function handleCitiesBlur() {
    const parsed = citiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const unique = [];
    const seen = new Set();
    for (const c of parsed) {
      const lower = c.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(c);
      }
    }
    setSettings((s) => ({ ...s, cities: unique }));
    setCitiesInput(unique.join(", "));
  }

  function handleRemoveCity(cityToRemove) {
    setSettings((s) => {
      const next = (s.cities || []).filter((x) => x !== cityToRemove);
      setCitiesInput(next.join(", "));
      return { ...s, cities: next };
    });
  }

  function handleAddSingleCity(e) {
    if (e) e.preventDefault();
    const trimmed = singleCityInput.trim();
    if (!trimmed) return;
    const additions = trimmed
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const current = settings.cities || [];
    const updated = [...current];
    for (const item of additions) {
      if (!updated.some((c) => c.toLowerCase() === item.toLowerCase())) {
        updated.push(item);
      }
    }
    setSettings((s) => ({ ...s, cities: updated }));
    setCitiesInput(updated.join(", "));
    setSingleCityInput("");
  }

  async function handleImageUpload(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const url = await uploadMedia(file, "site");
      setSettings((prev) => ({ ...prev, [field]: url }));
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  }

  function isValidUrl(s) {
    if (!s) return true;
    try { new URL(s); return true; } catch { return false; }
  }

  async function save(e) {
    e.preventDefault();
    setSaveError("");
    if (settings.hero_image && !isValidUrl(settings.hero_image)) { setSaveError("Hero image must be a valid URL."); return; }
    if (settings.offer_enabled) {
      if (settings.offer_image && !isValidUrl(settings.offer_image)) { setSaveError("Offer image must be a valid URL."); return; }
      if (settings.offer_link && !isValidUrl(settings.offer_link)) { setSaveError("Offer link must be a valid URL."); return; }
    }

    const parsedCities = citiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const uniqueCities = [];
    const seen = new Set();
    for (const c of parsedCities) {
      const lower = c.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueCities.push(c);
      }
    }

    setSaving(true);
    try {
      await updateSiteSettings({
        ...settings,
        cities: uniqueCities,
      });
      setSettings((s) => ({ ...s, cities: uniqueCities }));
      setCitiesInput(uniqueCities.join(", "));
      toast.success("Settings saved.");
      refetch();
    } catch (err) {
      setSaveError(err.message || "Failed to save.");
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminLayout title="Site Settings"><PageLoading /></AdminLayout>;
  if (error) return <AdminLayout title="Site Settings"><PageError error={error} onRetry={refetch} /></AdminLayout>;

  return (
    <AdminLayout
      title="Site Settings"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasUnsavedChanges && (
            <span className="unsaved-dot-badge">● Unsaved</span>
          )}
          <button
            aria-label="Save settings"
            form="settings-form"
            type="submit"
            disabled={saving || !hasUnsavedChanges}
            className="dark-btn small"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      }
    >
      {saveError && (
        <div className="admin-notice error" role="alert" style={{ marginBottom: 20 }}>{saveError}</div>
      )}

      <form id="settings-form" onSubmit={save} className="settings-form-layout">

        {/* ── HERO BANNER ── */}
        <SettingsCard
          icon={ImageIcon}
          title="Home Page Banner"
          description="The hero image shown at the top of the home page. Leave blank to use the first property photo automatically."
          accent="#435c4c"
        >
          <ImageUploadField
            label="Banner image"
            value={settings.hero_image}
            onChange={(val) => setSettings((s) => ({ ...s, hero_image: val }))}
            onUpload={(e) => handleImageUpload(e, "hero_image")}
            previewHeight={180}
            hint="Recommended: 1920×800px, JPG or WebP. Images are auto-optimised on upload."
          />
        </SettingsCard>

        {/* ── OFFER POPUP ── */}
        <SettingsCard
          icon={Sparkles}
          title="Offer Popup"
          description="Show a promotional poster to visitors when they land on the home page."
          accent="#c07a2c"
        >
          <button
            type="button"
            className={`toggle-switch ${settings.offer_enabled ? "on" : ""}`}
            onClick={() => setSettings((s) => ({ ...s, offer_enabled: !s.offer_enabled }))}
            aria-pressed={settings.offer_enabled}
            aria-label="Enable offer popup"
          >
            {settings.offer_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            <span>{settings.offer_enabled ? "Popup is enabled" : "Popup is disabled"}</span>
          </button>

          {settings.offer_enabled && (
            <div className="offer-popup-fields">
              <ImageUploadField
                label="Poster image"
                value={settings.offer_image}
                onChange={(val) => setSettings((s) => ({ ...s, offer_image: val }))}
                onUpload={(e) => handleImageUpload(e, "offer_image")}
                previewHeight={140}
                hint="Portrait format works best — e.g. 600×800px."
              />

              <div className="settings-field-group">
                <label className="settings-label">
                  <Globe size={12} /> Click destination (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={settings.offer_link}
                  onChange={(e) => setSettings((s) => ({ ...s, offer_link: e.target.value }))}
                  aria-label="Offer click link"
                />
                <p className="img-field-hint">Where users go when they click the poster. Leave blank for display-only.</p>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* ── LOCATIONS ── */}
        <SettingsCard
          icon={MapPin}
          title="Active Locations"
          description="The cities or neighbourhoods where you operate. These drive the city filter and property form dropdowns."
          accent="#3a7ca5"
        >
          <div className="settings-field-group">
            <label className="settings-label" htmlFor="cities-input">Cities (comma-separated)</label>
            <input
              id="cities-input"
              type="text"
              placeholder="e.g. Mumbai, Pune, Bengaluru, Alibaug"
              value={citiesInput}
              onChange={handleCitiesChange}
              onBlur={handleCitiesBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCitiesBlur();
                }
              }}
              aria-label="Active cities (comma-separated)"
            />

            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <input
                type="text"
                placeholder="Or type a city to add (e.g. Goa)"
                value={singleCityInput}
                onChange={(e) => setSingleCityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSingleCity();
                  }
                }}
                style={{ flex: 1, margin: 0 }}
                aria-label="Quick add city"
              />
              <button
                type="button"
                className="outline-btn small"
                onClick={handleAddSingleCity}
                disabled={!singleCityInput.trim()}
                style={{ whiteSpace: "nowrap", height: "40px" }}
              >
                + Add City
              </button>
            </div>

            {settings.cities?.length > 0 && (
              <div className="city-tags" style={{ marginTop: "10px" }}>
                {settings.cities.map((c) => (
                  <span key={c} className="city-tag">
                    {c}
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(c)}
                      aria-label={`Remove ${c}`}
                      title={`Remove ${c}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="img-field-hint" style={{ marginTop: "6px" }}>
              Separate cities with commas or use "+ Add City". Saved locations drive the website search filters and property dropdowns.
            </p>
          </div>
        </SettingsCard>

      </form>
    </AdminLayout>
  );
}

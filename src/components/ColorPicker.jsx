import { useState,  } from "react"

// Color conversion helpers
function hexToRgb(hex) {
  const cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  } else if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 79, g: 70, b: 229 }; // default Indigo fallback
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  const y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return y > 186 ? "#0f172a" : "#ffffff";
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber/Gold
  '#f43f5e', // Rose/Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b'  // Slate Gray
];

export default function ColorPicker() {
  const [color, setColor] = useState("#4f46e5");
  const [hexInput, setHexInput] = useState("#4f46e5");
  const [copiedKey, setCopiedKey] = useState(null);
  
  const [savedSwatches, setSavedSwatches] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_color_swatches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const selectColor = (newColor) => {
    setColor(newColor);
    setHexInput(newColor);
  };

  const handleColorPickerChange = (e) => {
    const newColor = e.target.value;
    selectColor(newColor);
  };

  const handleHexTextChange = (e) => {
    const value = e.target.value;
    setHexInput(value);
    
    const cleaned = value.trim();
    if (/^#[0-9A-F]{6}$/i.test(cleaned) || /^#[0-9A-F]{3}$/i.test(cleaned)) {
      setColor(cleaned);
    } else if (/^[0-9A-F]{6}$/i.test(cleaned) || /^[0-9A-F]{3}$/i.test(cleaned)) {
      setColor(`#${cleaned}`);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 1500);
    });
  };

  const saveSwatch = () => {
    const formattedColor = color.toLowerCase();
    if (savedSwatches.map(s => s.toLowerCase()).includes(formattedColor)) return;
    const updated = [formattedColor, ...savedSwatches].slice(0, 24); // Limit to 24 swatches
    setSavedSwatches(updated);
    localStorage.setItem('custom_color_swatches', JSON.stringify(updated));
  };

  const deleteSwatch = (e, swatchToDelete) => {
    e.stopPropagation(); // Avoid triggering color selection
    const updated = savedSwatches.filter(s => s.toLowerCase() !== swatchToDelete.toLowerCase());
    setSavedSwatches(updated);
    localStorage.setItem('custom_color_swatches', JSON.stringify(updated));
  };

  // Calculations for current color
  const rgbObj = hexToRgb(color);
  const rgbString = `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`;
  const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
  const hslString = `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`;
  
  const textContrastColor = getContrastColor(color);
  
  // Contrast testing ratios
  const whiteContrast = getContrastRatio(color, '#ffffff');
  const blackContrast = getContrastRatio(color, '#0f172a');

  const getWcagRating = (ratio) => {
    if (ratio >= 7) return { text: "AAA Pass", class: "pass-aaa" };
    if (ratio >= 4.5) return { text: "AA Pass", class: "pass-aa" };
    if (ratio >= 3) return { text: "Large Only", class: "pass-large" };
    return { text: "Fail", class: "fail" };
  };

  const whiteRating = getWcagRating(whiteContrast);
  const blackRating = getWcagRating(blackContrast);

  return (
    <div className="colorPickerApp">
      <div className="colorPickerContainer">
        
        {/* Header section */}
        <header className="pickerHeader">
          <div className="logoGroup">
            <span className="logoIcon">🎨</span>
            <h1>Pro Color Palette</h1>
          </div>
          <p className="subtitle">The professional color palette utility & contrast tool</p>
        </header>

        {/* Dashboard Grid */}
        <div className="dashboardGrid">
          
          {/* Left Column: Visuals & Primary Input */}
          <section className="dashboardColumn visualColumn">
            
            {/* Color Display Canvas */}
            <div 
              className="colorDisplay" 
              style={{ backgroundColor: color, color: textContrastColor }}
            >
              <div className="displayOverlay">
                <span className="contrastBadge" style={{ borderColor: textContrastColor }}>
                  {hslObj.l > 60 ? 'Light Background' : 'Dark Background'}
                </span>
                <span className="selectedColorHex">{color.toUpperCase()}</span>
                <button 
                  className="canvasCopyButton"
                  onClick={() => copyToClipboard(color.toUpperCase(), 'canvas')}
                  style={{ color: textContrastColor, borderColor: textContrastColor + '40' }}
                  title="Copy Hex Code"
                >
                  {copiedKey === 'canvas' ? (
                    <>
                      <span className="icon">✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copy HEX</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selector and Text Input */}
            <div className="controlsRow">
              <div className="pickerControlWrapper">
                <label className="controlLabel">Select Color</label>
                <div className="pickerInputContainer">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={handleColorPickerChange}
                    className="nativeColorPicker"
                    id="colorInput"
                  />
                  <label htmlFor="colorInput" className="customPickerBtn" style={{ backgroundColor: color }}>
                    <span className="pickerPip" style={{ borderColor: textContrastColor }}></span>
                  </label>
                </div>
              </div>

              <div className="textControlWrapper">
                <label className="controlLabel" htmlFor="hexTextInput">HEX Value</label>
                <div className="textInputContainer">
                  <span className="inputHash">#</span>
                  <input 
                    id="hexTextInput"
                    type="text" 
                    value={hexInput.replace('#', '')} 
                    onChange={handleHexTextChange}
                    maxLength="7"
                    placeholder="4f46e5"
                    className="hexTextfield"
                  />
                </div>
              </div>

              <button className="saveSwatchButton" onClick={saveSwatch} title="Save to custom swatches">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Save</span>
              </button>
            </div>

          </section>

          {/* Right Column: Calculations & Collections */}
          <section className="dashboardColumn infoColumn">
            
            {/* Color Values Formats */}
            <div className="infoCard formatsCard">
              <h2 className="sectionTitle">Color Formats</h2>
              <div className="formatList">
                
                {/* Hex Row */}
                <div className="formatRow">
                  <span className="formatLabel">HEX</span>
                  <code className="formatValue">{color.toUpperCase()}</code>
                  <button 
                    className="rowCopyButton" 
                    onClick={() => copyToClipboard(color.toUpperCase(), 'hex')}
                    title="Copy HEX"
                  >
                    {copiedKey === 'hex' ? 'Copied!' : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>

                {/* RGB Row */}
                <div className="formatRow">
                  <span className="formatLabel">RGB</span>
                  <code className="formatValue">{rgbString}</code>
                  <button 
                    className="rowCopyButton" 
                    onClick={() => copyToClipboard(rgbString, 'rgb')}
                    title="Copy RGB"
                  >
                    {copiedKey === 'rgb' ? 'Copied!' : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>

                {/* HSL Row */}
                <div className="formatRow">
                  <span className="formatLabel">HSL</span>
                  <code className="formatValue">{hslString}</code>
                  <button 
                    className="rowCopyButton" 
                    onClick={() => copyToClipboard(hslString, 'hsl')}
                    title="Copy HSL"
                  >
                    {copiedKey === 'hsl' ? 'Copied!' : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* Accessibility Contrast Checker */}
            <div className="infoCard contrastCard">
              <h2 className="sectionTitle">WCAG Accessibility Contrast</h2>
              <div className="contrastTestGrid">
                
                {/* On White background */}
                <div className="contrastTestItem">
                  <div className="contrastPreview" style={{ backgroundColor: color, color: '#ffffff' }}>
                    <span className="previewText">Aa</span>
                    <span className="previewSub">White Text</span>
                  </div>
                  <div className="contrastMeta">
                    <span className="contrastRatioValue">{whiteContrast.toFixed(1)}:1</span>
                    <span className={`ratingBadge ${whiteRating.class}`}>{whiteRating.text}</span>
                  </div>
                </div>

                {/* On Black background */}
                <div className="contrastTestItem">
                  <div className="contrastPreview" style={{ backgroundColor: color, color: '#0f172a' }}>
                    <span className="previewText">Aa</span>
                    <span className="previewSub">Dark Text</span>
                  </div>
                  <div className="contrastMeta">
                    <span className="contrastRatioValue">{blackContrast.toFixed(1)}:1</span>
                    <span className={`ratingBadge ${blackRating.class}`}>{blackRating.text}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Preset Palettes */}
            <div className="infoCard presetCard">
              <h2 className="sectionTitle">Curated Presets</h2>
              <div className="swatchesGrid">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    className={`swatchBtn ${color.toLowerCase() === preset.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: preset }}
                    onClick={() => setColor(preset)}
                    title={preset}
                  >
                    <span className="swatchIndicator"></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Custom Palettes */}
            <div className="infoCard savedCard">
              <div className="cardHeaderRow">
                <h2 className="sectionTitle">Saved Swatches</h2>
                <span className="savedCount">{savedSwatches.length}/24</span>
              </div>
              {savedSwatches.length === 0 ? (
                <div className="emptySaved">
                  <p>No custom swatches saved yet. Click the "Save" button to start building your custom palette.</p>
                </div>
              ) : (
                <div className="swatchesGrid">
                  {savedSwatches.map((swatch) => (
                    <button
                      key={swatch}
                      className={`swatchBtn customSwatch ${color.toLowerCase() === swatch.toLowerCase() ? 'active' : ''}`}
                      style={{ backgroundColor: swatch }}
                      onClick={() => setColor(swatch)}
                      title={swatch}
                    >
                      <button 
                        className="deleteSwatchBtn" 
                        onClick={(e) => deleteSwatch(e, swatch)}
                        title="Delete Swatch"
                      >
                        ×
                      </button>
                      <span className="swatchIndicator"></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </section>

        </div>

      </div>
    </div>
  )
}

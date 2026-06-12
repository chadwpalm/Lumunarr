// Converts sRGB values (0-255) to CIE 1931 x,y coordinates
// Follows the same math that was originally inline in setLightsToPoster
// red, green, blue: numbers between 0 and 255

function _linearize(channel) {
  const c = channel / 255;
  return c > 0.04045 ? Math.pow((c + 0.055) / (1.0 + 0.055), 2.4) : c / 12.92;
}

function rgbToXy(red, green, blue) {
  const r = _linearize(red);
  const g = _linearize(green);
  const b = _linearize(blue);

  const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const x = X / (X + Y + Z);
  const y = Y / (X + Y + Z);

  return { x, y, brightness: Y };
}

module.exports = {
  rgbToXy,
};

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: camera;

// Scriptable: Einfaches Fotowebcam Widget
// edit by GSG
// usecase: Widget Scriptable for Foto-Webcam.eu
// Version 0.72: (zwei weitere kameras)

const FORCE_IMAGE_UPDATE = true;

const imageUrls = [
  "https://www.foto-webcam.eu/webcam/stveit/current/1920.jpg",
  "https://www.foto-webcam.eu/webcam/stjakob/current/1920.jpg",
  "https://www.foto-webcam.eu/webcam/hopfgarten/current/1920.jpg",
  "https://www.foto-webcam.eu/webcam/adlersruhe/current/1920.jpg",
  "https://www.foto-webcam.eu/webcam/lienz/current/1920.jpg"
];
const refreshInterval = 1 * 60 * 1000; // 1 Minute in Millisekunden
const cacheKey = "lastImageUpdate";
const imageCacheKeyPrefix = "cachedImage_";

// Funktion, um ein Widget zu erstellen
async function createWidget() {
  const widget = new ListWidget();

  // Bildindex basierend auf der Zeit
  const imageIndex = getNextImageIndex(imageUrls.length);
  const imageUrl = imageUrls[imageIndex];
  let image;
  let usedCache = false;

  try {
    image = await loadCachedImage(imageUrl, imageIndex);
  } catch (error) {
    // Fallback auf den Cache
    image = await loadCachedImageFallback(imageIndex);
    usedCache = true;
  }

  const widgetSize = new Size(400, 190); // Angepasste Größe für das Widget
  widget.backgroundImage = cropImageToTop(image, widgetSize);

  // Abstand, um den Text an den unteren Rand zu bringen
  widget.addSpacer();

  // Hinweis hinzufügen
  const footer = widget.addText(`Mit ❤️ von Scriptable | Bild ${imageIndex + 1} von ${imageUrls.length}${usedCache ? " (aus Cache)" : ""}`);
  footer.font = Font.italicSystemFont(10);

  // Textfarbe basierend auf der Tageszeit
  const hour = new Date().getHours();
  footer.textColor = (hour >= 6 && hour < 18) ? Color.black() : Color.white();

  footer.centerAlignText();

  return widget;
}

// Funktion, um den nächsten Bildindex basierend auf 5-Minuten-Intervallen zu erhalten
function getNextImageIndex(totalImages) {
  const now = new Date();
  const fiveMinuteBlock = Math.floor((now.getHours() * 60 + now.getMinutes()) / 5);
  return fiveMinuteBlock % totalImages;
}

// Hilfsfunktion zum Zuschneiden des Bildes oben mit Skalierung
function cropImageToTop(image, size) {
  const context = new DrawContext();
  context.size = size;
  context.respectScreenScale = true;

  // Bild auf die Zielgröße skalieren
  context.drawImageInRect(image, new Rect(0, 0, size.width, size.height));

  return context.getImage();
}

// Hilfsfunktion zum Laden eines zwischengespeicherten Bildes
async function loadCachedImage(url, index) {
  const now = Date.now();
  const imageCacheKey = `${imageCacheKeyPrefix}${index}`;

  // Initialisieren von Keychain-Einträgen, falls nicht vorhanden
  if (!Keychain.contains(cacheKey)) {
    Keychain.set(cacheKey, "0");
  }
  if (!Keychain.contains(imageCacheKey) || FORCE_IMAGE_UPDATE) {
    const initialImage = await loadImage(url);
    Keychain.set(imageCacheKey, Data.fromPNG(initialImage).toBase64String());
    Keychain.set(cacheKey, now.toString());
    return initialImage;
  }

  const lastUpdate = parseInt(Keychain.get(cacheKey));

  if (now - lastUpdate > refreshInterval || FORCE_IMAGE_UPDATE) {
    const image = await loadImage(url);
    Keychain.set(cacheKey, now.toString());
    Keychain.set(imageCacheKey, Data.fromPNG(image).toBase64String());
    return image;
  }

  const cachedImage = Data.fromBase64String(Keychain.get(imageCacheKey));
  return Image.fromData(cachedImage);
}

// Fallback-Funktion, um ein zwischengespeichertes Bild zu laden
async function loadCachedImageFallback(index) {
  const imageCacheKey = `${imageCacheKeyPrefix}${index}`;
  if (Keychain.contains(imageCacheKey)) {
    const cachedImage = Data.fromBase64String(Keychain.get(imageCacheKey));
    return Image.fromData(cachedImage);
  }
  throw new Error("Kein zwischengespeichertes Bild verfügbar.");
}

// Hilfsfunktion zum Laden eines Bildes
async function loadImage(url) {
  const request = new Request(url);
  return await request.loadImage();
}

// Widget initialisieren
if (config.runsInWidget) {
  const widget = await createWidget();
  Script.setWidget(widget);
} else {
  const widget = await createWidget();
  widget.presentMedium();
}

Script.complete();

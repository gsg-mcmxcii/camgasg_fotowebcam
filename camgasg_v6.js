// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: camera;

// edit by GSG
// usecase: Widget Scriptable for Foto-Webcam.eu
// Version 0.6: (Image Update every 1 minute)
// description: All 3 webcams, offline mode, and image switch every 1 minute.

// SCRIPT

var camURLs = [
  "https://www.foto-webcam.eu/webcam/stveit/",
  "https://www.foto-webcam.eu/webcam/hopfgarten/",
  "https://www.foto-webcam.eu/webcam/stjakob/"
];

// iCloud FileManager einrichten
let fm = FileManager.iCloud();
let pathBase = fm.documentsDirectory() + "/webcam_";

// Array für die Bilder-Pfade
let imagePaths = [
  pathBase + "stveit.jpg",
  pathBase + "hopfgarten.jpg",
  pathBase + "stjakob.jpg"
];

// Dateipfad für den nächsten Ausführungszeitpunkt
let nextRunFilePath = fm.documentsDirectory() + "/nextRun.txt";

// Funktion zum Herunterladen und Speichern des Bildes
async function downloadAndSaveImage(url, path) {
  try {
    let fullSizeImage = await new Request(url + "/current/400.jpg").loadImage();
    fm.writeImage(path, fullSizeImage); // Bild in iCloud speichern
    return fullSizeImage; // Bild zurückgeben
  } catch (error) {
    console.error("Fehler beim Herunterladen des Bildes:", error);
    return null;
  }
}

// Funktion, um das Bild zu aktualisieren
async function updateImage() {
  var randomIndex = Math.floor(Math.random() * camURLs.length);
  var selectedCamURL = camURLs[randomIndex];
  var selectedPath = imagePaths[randomIndex];

  let image;
  try {
    // Bild herunterladen und speichern
    console.log("Lade Bild herunter...");
    image = await downloadAndSaveImage(selectedCamURL, selectedPath);
  } catch (error) {
    // Wenn das Bild nicht heruntergeladen werden konnte, Fehlermeldung
    console.error("Fehler beim Verarbeiten des Bildes:", error);
    return null;
  }

  if (image) {
    let croppedImage = await processImage(image);
    return croppedImage;
  }
  return null;
}

// Funktion, die den nächsten Ausführungszeitpunkt berechnet
async function getNextRunTime() {
  let currentTime = new Date().getTime();
  let nextRunTime = currentTime + 1 * 60 * 1000; // 1 Minute später

  fm.writeString(nextRunFilePath, nextRunTime.toString()); // Speichern der nächsten Ausführungszeit

  return nextRunTime;
}

// Initiales Bild oder aktualisiertes Bild laden
let updatedImage = await updateImage();

// Überprüfen, ob die nächste Ausführung geplant ist
let nextRunTime = parseInt(fm.readString(nextRunFilePath) || "0");
let currentTime = new Date().getTime();

// Wenn die nächste Ausführung erreicht ist, Widget aktualisieren
if (currentTime >= nextRunTime) {
  await getNextRunTime(); // Nächste Ausführung auf 1 Minute setzen
}

if (updatedImage) {
  var widget = new ListWidget();
  widget.backgroundImage = updatedImage;
  widget.spacing = 0;

  let stack = widget.addStack();
  stack.layoutVertically();

  // Das Widget jedes Mal neu laden, wenn es in der App läuft
  if (config.runsInApp) {
    widget.presentMedium();
  } else {
    Script.setWidget(widget);
  }
}

Script.complete();

// Funktionen

// Diese Funktion nimmt ein Bild und gibt ein verarbeitetes Bild zurück.
async function processImage(image) {
    const imageId = "imageId";
    const canvasId = "canvasId";

    const js = `
    // Set up the canvas.
    const img = document.getElementById("${imageId}");
    const canvas = document.getElementById("${canvasId}");

    // Widget-Größe (Breite und Höhe)
    const w = 400;
    const h = 190;

    // Berechnung des Seitenverhältnisses des Bildes
    const aspectRatio = img.width / img.height;

    // Bild skalieren, um ins Widget zu passen, ohne Verzerrung
    let newWidth, newHeight;

    if (w / h > aspectRatio) {
        // Skalieren nach Höhe
        newHeight = h;
        newWidth = newHeight * aspectRatio;
    } else {
        // Skalieren nach Breite
        newWidth = w;
        newHeight = newWidth / aspectRatio;
    }

    // Canvas-Größe an die neue Bildgröße anpassen
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w;
    canvas.height = h;

    // Kontext abrufen und Bild zeichnen
    const context = canvas.getContext("2d");
    context.clearRect( 0, 0, w, h );
    context.drawImage( img, 0, 0, w, h, 0,0, w,h );

    // Base64-Repräsentation des Bildes zurückgeben
    canvas.toDataURL();
    `;

    // Bild in Base64 umwandeln
    let inputData = Data.fromPNG(image).toBase64String();
    let html = `
    <img id="${imageId}" src="data:image/png;base64,${inputData}" />
    <canvas id="${canvasId}" />
    `;

    // WebView erstellen und das verarbeitete Bild abrufen
    let view = new WebView();
    await view.loadHTML(html);
    let returnValue = await view.evaluateJavaScript(js);

    // Entfernen des Datentyps aus der Zeichenkette und in Data umwandeln
    let outputDataString = returnValue.slice(returnValue.indexOf(",") + 1);
    let outputData = Data.fromBase64String(outputDataString);

    // Das verarbeitete Bild zurückgeben
    return Image.fromData(outputData);
}

// v0613

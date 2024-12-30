// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: camera;

// edit by GSG
// usecase: Widget Scriptable for Foto-Webcam.eu
// Version 0.6: (three webcam)
// description: all 3 webcams, offline mode and image switch

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

// Zufälliges Bild auswählen
var randomIndex = Math.floor(Math.random() * camURLs.length);
var selectedCamURL = camURLs[randomIndex];
var selectedPath = imagePaths[randomIndex];

// Versuchen, das Bild von iCloud herunterzuladen oder das Bild neu herunterladen
let image;
try {
  // Versuche, das Bild aus iCloud zu lesen
  await fm.downloadFileFromiCloud(selectedPath);
  image = fm.readImage(selectedPath); // Bild aus iCloud lesen
} catch (error) {
  // Wenn das Bild nicht lokal vorhanden ist, Bild von der Webcam herunterladen
  let fullSizeImage = await new Request(selectedCamURL + "/current/400.jpg").loadImage();
  fm.writeImage(selectedPath, fullSizeImage); // Bild in iCloud speichern
  image = fullSizeImage; // Verwende das heruntergeladene Bild
}

// Bild verarbeiten
let croppedImage = await processImage(image);

// Erstelle das Widget
var widget = new ListWidget();
widget.backgroundImage = croppedImage;
widget.spacing = 0;  // Kein Abstand zwischen den Elementen

// Erstelle einen Stack, um Text unter dem Bild anzuzeigen
let stack = widget.addStack();
stack.layoutVertically(); // Layout vertikal, Bild oben und Text unten

// Widget anzeigen
if (config.runsInApp) {
    // display-preview-widget
    widget.presentMedium(); // andere Optionen sind '.presentSmall()' oder '.presentLarge()'
} else {
    // finalize-widget
    Script.setWidget(widget);
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

//v0603

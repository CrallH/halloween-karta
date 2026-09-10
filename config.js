// Inställningar för Halloween-kartan
window.HALLOWEEN = {
  // Klistra in webbapp-länken från Apps Script (Distribuera → Webbapp → URL som slutar på /exec)
  API_URL: 'https://script.google.com/macros/s/AKfycbzTx3pMNEnAMt0Hjd51kQoGKY9ImDJw-Ivp1QMT6WmmO7oJ9aVtvXHkfnmFn1CZRTZN/exec',
  TOWN: 'Kungsbacka',
  // Visas i texten "Anmäl ditt hus i ..." på startsidan. TOWN ovan används
  // fortfarande vid adressökningen (geokodningen), så den måste vara en
  // riktig ort för att adresser ska hittas korrekt.
  AREA_LABEL: 'Varla villaområde',
  CENTER: { lat: 57.487, lng: 12.076, zoom: 13 }
};

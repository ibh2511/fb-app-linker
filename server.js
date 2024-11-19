const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Håndter Facebook-lenker som query-parameter
app.get("/open-facebook", (req, res) => {
  const fbLink = req.query.link; // Lenken sendes som query-parameter, f.eks. ?link=https://facebook.com/somepage

  if (!fbLink || !fbLink.startsWith("https://facebook.com/")) {
    return res.status(400).send("Invalid or missing Facebook link. Make sure it starts with 'https://facebook.com/'.");
  }

  // URL-encode lenken for bruk i Facebook-appen
  const encodedLink = encodeURIComponent(fbLink);
  const facebookAppLink = `fb://facewebmodal/f?href=${encodedLink}`;

  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <script>
          // Prøv å åpne Facebook-appen
          setTimeout(() => {
            window.location.href = "${facebookAppLink}";
          }, 100);

          // Etter en liten forsinkelse (2 sek), fallback til vanlig Facebook-lenke
          setTimeout(() => {
            window.location.href = "${fbLink}";
          }, 2000);
        </script>
      </head>
      <body>
        <p>Redirecting to the Facebook app...</p>
      </body>
    </html>
  `);
});

// Root route for usage instructions with dynamic server URL
app.get("/", (req, res) => {
  // Dynamically fetch the current server URL
  const protocol = req.protocol;
  const host = req.get("host");
  const serverUrl = `${protocol}://${host}`;

  res.send(`
    <html>
      <head>
        <title>Facebook Link Opener</title>
      </head>
      <body>
        <h1>Welcome to Facebook Link Opener</h1>
        <p>To use this service, provide a Facebook link as a query parameter:</p>
        <code>${serverUrl}/open-facebook?link=https://facebook.com/somepage</code>
        <small>IBH 🌱</small>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

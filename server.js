const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Handle Facebook links as a query parameter
app.get("/fb-app-linker", (req, res) => {
  const fbLink = req.query.link; // Link sent as a query parameter, e.g., ?link=https://facebook.com/somelink

  // Validate and allow both `facebook.com` and `www.facebook.com`
  if (
    !fbLink ||
    (!fbLink.startsWith("https://facebook.com/") &&
      !fbLink.startsWith("https://www.facebook.com/"))
  ) {
    return res
      .status(400)
      .send(
        "Invalid or missing Facebook link. Make sure it starts with 'https://facebook.com/' or 'https://www.facebook.com/'."
      );
  }

  // URL-encode the link for use in the Facebook app
  const encodedLink = encodeURIComponent(fbLink);
  const facebookAppLink = `fb://facewebmodal/f?href=${encodedLink}`;

  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <script>
          // Attempt to open the Facebook app
          setTimeout(() => {
            console.log("Attempting to redirect to the Facebook app...");
            window.location.href = "${facebookAppLink}";
          }, 100);

          // Fallback to the original Facebook link after 2 seconds
          setTimeout(() => {
            console.log("Redirecting to the original Facebook link as fallback...");
            window.location.href = "${fbLink}";
          }, 2000);
        </script>
      </head>
      <body>
        <p>Redirecting to the Facebook app...</p>
        <p>If it doesn't work, you will be redirected to the link in your browser.</p>
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
        <title>Facebook App Link Opener</title>
      </head> 
      <body>
        <h1>Welcome to Facebook App Link Opener</h1>
        <p>To use this service, provide a Facebook link as a query parameter:</p>
        <code>${serverUrl}/fb-app-linker?link=https://facebook.com/somelink</code>
        <br/><br/>
        <small>IBH 🌱</small>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

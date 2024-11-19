const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Handle Facebook links as a query parameter
app.get("/fb-link", (req, res) => {
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

  // Detect platform using User-Agent
  const userAgent = req.get("User-Agent");
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  // URL-encode the link for use in the Facebook app
  const encodedLink = encodeURIComponent(fbLink);

  // The custom URI scheme `fb://facewebmodal/f?` is used to open web content inside the Facebook app.
  // The `f?href=` parameter allows embedding a URL (e.g., https://facebook.com/events/...) 
  // for deep linking into specific Facebook content directly within the app.
  const facebookAppLink = `fb://facewebmodal/f?href=${encodedLink}`;

  // HTML response with conditional redirection based on the platform
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <script>
          // Check if the platform is iOS or Android
          const isAndroid = ${isAndroid};
          const isIOS = ${isIOS};

          if (isAndroid || isIOS) {
            // Attempt to open the Facebook app
            setTimeout(() => {
              console.log("Attempting to redirect to the Facebook app...");
              window.location.href = "${facebookAppLink}";
            }, 100);

            // Fallback to the original Facebook link after 1.5 seconds
            setTimeout(() => {
              console.log("Redirecting to the original Facebook link as fallback...");
              window.location.href = "${fbLink}";
            }, 1500);
          } else {
            // Directly fallback to the original Facebook link for non-mobile platforms
            console.log("Non-mobile platform detected. Redirecting to the original Facebook link...");
            window.location.href = "${fbLink}";
          }
        </script>
      </head>
      <body>
        <p>Redirecting to the Facebook app if supported...</p>
        <p>If not, you'll be redirected to the link in your browser.</p>
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
        <code>${serverUrl}/fb-link?link=https://facebook.com/somelink</code>
        <br/><br/>
        <p>IBH 🌱</p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

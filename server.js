const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Handle Facebook links via query parameter or environment variables
app.get("/fb-link", (req, res) => {
  const fbLink = req.query.link; // Query parameter for direct URL
  const storedUrlKey = req.query.stored_url; // Query parameter for environment variable key, e.g., ?stored_url=1

  // Ensure both `link` and `stored_url` are not used simultaneously
  if (fbLink && storedUrlKey) {
    return res
      .status(400)
      .send(
        "Invalid request. Use either `link` or `stored_url`, but not both at the same time."
      );
  }

  let resolvedLink;

  // If `link` is provided, validate it
  if (fbLink) {
    if (
      !fbLink.startsWith("https://facebook.com/") &&
      !fbLink.startsWith("https://www.facebook.com/")
    ) {
      return res
        .status(400)
        .send(
          "Invalid Facebook link. Make sure it starts with 'https://facebook.com/' or 'https://www.facebook.com/'."
        );
    }
    resolvedLink = fbLink;
  }

  // If `stored_url` is provided, fetch the corresponding dynamic environment variable
  if (storedUrlKey) {
    const envVariableName = `TARGET_FB_URL_${storedUrlKey}`;
    resolvedLink = process.env[envVariableName];
    if (!resolvedLink) {
      return res
        .status(400)
        .send(
          `Environment variable '${envVariableName}' is not defined on the server.`
        );
    }
    if (
      !resolvedLink.startsWith("https://facebook.com/") &&
      !resolvedLink.startsWith("https://www.facebook.com/")
    ) {
      return res
        .status(400)
        .send(
          `The URL in environment variable '${envVariableName}' is invalid. It must start with 'https://facebook.com/' or 'https://www.facebook.com/'.`
        );
    }
  }

  // If neither `link` nor `stored_url` are provided, return an error
  if (!resolvedLink) {
    return res
      .status(400)
      .send(
        "Missing required parameter. Provide either `link` query parameter or a `stored_url` query parameter to use an environment variable."
      );
  }

  // Detect platform using User-Agent
  const userAgent = req.get("User-Agent");
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  // URL-encode the link for use in the Facebook app
  const encodedLink = encodeURIComponent(resolvedLink);

  // The custom URI scheme for Facebook app
  const facebookAppLink = `fb://facewebmodal/f?href=${encodedLink}`;

  // HTML response with conditional redirection
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <script>
          const isAndroid = ${isAndroid};
          const isIOS = ${isIOS};

          if (isAndroid || isIOS) {
            setTimeout(() => {
              console.log("Attempting to redirect to the Facebook app...");
              window.location.href = "${facebookAppLink}";
            }, 100);

            setTimeout(() => {
              console.log("Redirecting to the original Facebook link as fallback...");
              window.location.href = "${resolvedLink}";
            }, 1500);
          } else {
            console.log("Non-mobile platform detected. Redirecting to the original Facebook link...");
            window.location.href = "${resolvedLink}";
          }
        </script>
      </head>
      <body>
        // <p>Redirecting to the Facebook app if supported...</p>
        // <p>If not, you'll be redirected to the link in your browser.</p>

        <p>Du blir sendt Facebook-appen hvis den støttes...</p>
        <p>Hvis ikke, blir du omdirigert til lenken i nettleseren din.</p>

      </body>
    </html>
  `);
});

// Root route for usage instructions with dynamic server URL
app.get("/", (req, res) => {
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
        <p>Or use an environment variable by specifying its key:</p>
        <code>${serverUrl}/fb-link?stored_url=1</code>
        <p>This will use the environment variable <code>TARGET_FB_URL_1</code>.</p>
        <p>Note: Do not use both <code>link</code> and <code>stored_url</code> in the same request.</p>
        <p>Made by IBH 🌱 </p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


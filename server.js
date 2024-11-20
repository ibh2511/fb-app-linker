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
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facebook App Link Opener</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
        }
        h1 {
            color: #3b5998;
            font-size: 2.5em;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            font-size: 1.1em;
            line-height: 1.6;
            margin: 10px 0;
            text-align: center;
        }
        code {
            background-color: #eef2f7;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px 10px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 1em;
            display: block;
            margin: 10px 0;
            color: #333;
            word-wrap: break-word;
        }
        a {
            color: #3b5998;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        footer {
            margin-top: 20px;
            font-size: 0.9em;
            color: #666;
        }
        /* Responsive styling for mobile screens */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <h1>Welcome to Facebook App Link Opener</h1>
    <p>To use this service, provide a Facebook link as a query parameter:</p>
    <code>${serverUrl}/fb-link?link=https://facebook.com/somelink</code>
    <p>Or use an environment variable by specifying its key:</p>
    <code>${serverUrl}/fb-link?stored_url=1</code>
    <p>This will use the environment variable <code>TARGET_FB_URL_1</code>.</p>
    <p><b>Note:</b> Do not use both <i>link</i> and <i>stored_url</i> in the same request.</p>
    <footer>
        <p>Made by IBH 🌱</p>
    </footer>
</body>
</html>

  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


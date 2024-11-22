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
  const isFacebookApp = /FBAV|FBAN/i.test(userAgent); // Checks if it's Facebook App

  // URL-encode the resolved link for safe usage
  const encodedLink = encodeURIComponent(resolvedLink);

  // Dynamically construct Facebook deep link based on the resolved link
  let facebookAppLink;
  if (resolvedLink.includes("/events/")) {
    facebookAppLink = resolvedLink.replace(
      "https://facebook.com/events/",
      "fb://event/"
    );
  } else if (resolvedLink.includes("/groups/")) {
    facebookAppLink = resolvedLink.replace(
      "https://facebook.com/groups/",
      "fb://group/"
    );
  } else if (resolvedLink.includes("/pages/")) {
    facebookAppLink = resolvedLink.replace(
      "https://facebook.com/pages/",
      "fb://page/"
    );
  } else {
    facebookAppLink = resolvedLink.replace("https://facebook.com", "fb://");
  }

  // HTML response with conditional redirection
res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redirecting...</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
        }
        a {
          color: #007bff;
          text-decoration: none;
          font-weight: bold;
        }
        a:hover {
          text-decoration: underline;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <script>
        const isAndroid = ${JSON.stringify(isAndroid)};
        const isIOS = ${JSON.stringify(isIOS)};
        const isFacebookApp = ${JSON.stringify(isFacebookApp)};
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const resolvedLink = "${resolvedLink}";
        const facebookAppLink = "${facebookAppLink}";

        if (/Instagram/i.test(userAgent)) {
          // Instagram in-app browser detected
          document.body.innerHTML = \`
            <p>Du er i Instagram-appen.</p>
            <p>Trykk på en av lenkene nedenfor for å åpne:</p>
            <a href="\${facebookAppLink}" class="button">Åpne i Facebook-appen</a>
            <br />
            <a href="\${resolvedLink}" target="_blank" class="button">Åpne i nettleseren</a>
          \`;
        } else if ((isAndroid || isIOS) && !isFacebookApp) {
          // Redirect to the Facebook app
          setTimeout(() => {
            console.log("Attempting to redirect to the Facebook app...");
            window.location.href = facebookAppLink;
          }, 100);

          // Fallback to the original link if Facebook app doesn't open
          setTimeout(() => {
            console.log("Redirecting to the original Facebook link as fallback...");
            window.location.href = resolvedLink;
          }, 10000);
        } else {
          // Non-mobile platforms
          console.log("Redirecting to the original Facebook link...");
          window.location.href = resolvedLink;
        }
      </script>
    </body>
  </html>
`);



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
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
          }
          .content {
              max-width: 800px; /* Limit content width */
              width: 90%; /* Ensure it adapts for smaller screens */
              margin: 0 auto;
              text-align: center;
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
              font-weight: 600; /* Darker font, but not bold */
              font-size: 1em;
              display: block;
              margin: 10px 0;
              color: #777;
              word-wrap: break-word;
          }
          .highlight {
              font-family: 'Courier New', Courier, monospace;
              color: #777;
              font-weight: bold;
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
        <body>
            <div class="content">
                <h1>Welcome to Facebook App Link Opener</h1>
                <p>This service allows users to open Facebook links in the Facebook app by providing a FB link as a query parameter or referencing a 
                   pre-configured environment variable. It ensures seamless redirection and simplifies access to specific Facebook pages or content.</p>
                <br/>
                <p>To use this service, provide a Facebook link as a query parameter:</p>
                <code>${serverUrl}/fb-link?link=https://facebook.com/somelink</code>
                <p>Or use an environment variable by specifying its key:</p>
                <code>${serverUrl}/fb-link?stored_url=1</code>
                <p>This will use the environment variable <code>TARGET_FB_URL_1</code>.</p>
                <p><b>Note:</b> Do not use both <span class="highlight">link</span> and <span class="highlight">stored_url</span> in the same request.</p>
                <footer>
                  <p>Made by IBH 🌱</p>
                </footer>
            </div>
        </body>
      </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

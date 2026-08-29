IMPORTANT FOR iPAD / iOS

The workflow file is included TWICE:

1. attach-did-tools.yml
   - Visible copy at the ZIP root so you can see/open it on iPad.

2. .github/workflows/attach-did-tools.yml
   - Correct GitHub repository path.

If iPad Files hides the .github folder, use the visible root copy and upload it
to your GitHub repository at:

.github/workflows/attach-did-tools.yml

Do NOT commit your private D-ID API key. Store it as the GitHub Actions secret:
DID_API_KEY

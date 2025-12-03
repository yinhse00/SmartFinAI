# IPO AI Assistant - Word Add-in

AI-powered IPO prospectus drafting assistant for Microsoft Word with HKEX compliance checking.

## Features

- **Document Analysis**: Analyzes IPO prospectus content for regulatory compliance
- **Track Changes**: Applies suggested amendments as Word Track Changes (redlines)
- **Comments**: Adds regulatory citations as Word comments
- **Bilingual Support**: Works with English and Chinese documents
- **Real-time Compliance Score**: Shows overall document compliance status

## Installation

### Development Setup

1. Install dependencies:
   ```bash
   cd word-addin
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Sideload the add-in in Word:
   - Open Word
   - Go to Insert > Get Add-ins > My Add-ins
   - Click "Upload My Add-in"
   - Select the `manifest.xml` file

### Production Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your web server

3. Update URLs in `manifest.xml` to point to your production server

4. Deploy via:
   - **Office 365 Admin Center**: For organization-wide deployment
   - **AppSource**: For public distribution

## Usage

1. Open an IPO prospectus document in Word
2. Click "IPO AI Assistant" in the Home ribbon
3. Sign in with your credentials
4. Select the document section type (Business, Risk Factors, etc.)
5. Click "Analyze for Compliance"
6. Review suggested amendments
7. Click "Apply" to insert Track Changes and comments

## Architecture

```
word-addin/
├── manifest.xml          # Office Add-in manifest
├── src/
│   └── taskpane/
│       ├── index.tsx           # Main React entry
│       ├── WordService.ts      # Office.js wrapper
│       ├── BackendClient.ts    # Supabase API client
│       └── components/
│           ├── LoginPanel.tsx
│           ├── AnalysisPanel.tsx
│           ├── AmendmentCard.tsx
│           ├── ComplianceScore.tsx
│           └── ReasoningSteps.tsx
└── webpack.config.js     # Build configuration
```

## API Endpoints

The add-in connects to the following Supabase edge function:

- `POST /functions/v1/word-addon-analyze` - Analyze document content

## Security

- User authentication via Supabase Auth
- JWT tokens for API authorization
- No document content stored permanently on servers
- Analysis results cached per session only

## Troubleshooting

### Add-in doesn't appear in Word
- Ensure you're using Word 2016 or later
- Check that the manifest.xml URLs are correct
- Try clearing Office cache

### Analysis fails
- Check your internet connection
- Verify you're signed in
- Check browser console for errors

### Track Changes not appearing
- Ensure Track Changes is enabled in Word
- Check that the searched text exists exactly in document

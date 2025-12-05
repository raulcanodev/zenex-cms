This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (for translation features)

### Environment Setup

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:4444`)
   - `NEXTAUTH_SECRET`: A random secret for NextAuth
   - `OPENAI_API_KEY`: Your OpenAI API key (required for translation features)

### OpenAI Configuration

To enable automatic post translation features, you need to configure OpenAI:

1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

The translation service uses `gpt-4o-mini` model for cost-effective translations. You can translate:
- Post titles
- Post content (Editor.js blocks)
- Excerpts
- SEO metadata (meta titles, descriptions, OG tags, keywords)

### Database Setup

1. Run Prisma migrations:
```bash
npx prisma migrate dev
```

2. Generate Prisma client:
```bash
npx prisma generate
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:4444](http://localhost:4444) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Multilingual Posts

Posts can be translated to multiple languages using OpenAI. All translations of the same post are grouped using a `translationGroupId`, allowing you to:

- View available languages for each post
- Switch between language versions
- Automatically translate posts to new languages
- Maintain the same slug across all language versions

### Translation Service

The `TranslationService` class provides reusable methods for translating content:

- `translateText()`: Translate simple text strings
- `translatePostContent()`: Translate Editor.js content blocks while preserving structure

The service automatically handles:
- Different block types (headers, paragraphs, lists, quotes, etc.)
- Preserving non-translatable content (images, code blocks)
- Language validation

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# zenex-cms

<img width="1967" height="1227" alt="image" src="https://github.com/user-attachments/assets/98987271-8a13-4592-8d72-4c392ebb8d91" />
<img width="1972" height="1224" alt="image" src="https://github.com/user-attachments/assets/467c6efb-76b6-4e5e-9cac-f8c74b7bae42" />


<div align="center">
  <h1>🚀 Zenex CMS</h1>
  <p><strong>A modern, multilingual content management system built with Next.js</strong></p>
  <p><em>Highly inspired by <a href="https://www.zenblog.com/">Zenblog</a>. I have always admired the Zenblog project and the design philosophy of Jordi Enric. This is not a fork, as you can observe by comparing both codebases. The resemblance lies mainly in some UI elements and the shared minimalist, headless concept.</em></p>

  [![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🌟 About

**Zenex CMS** is a powerful, open-source content management system designed for modern web applications. Built with Next.js 16, it provides a seamless experience for managing multilingual content with built-in AI-powered translation capabilities.

Perfect for developers and content creators who need:
- 🌍 **Multilingual support** with automatic translations
- ✍️ **Rich content editing** powered by Editor.js
- 🔐 **Secure authentication** with NextAuth.js
- 📊 **Multi-blog management** from a single dashboard
- 🎨 **Modern UI** with Tailwind CSS and Radix UI
- 🚀 **API-first architecture** for headless CMS capabilities

---

## ✨ Features

### Core Capabilities

- **🔐 User Authentication**
  - Secure authentication with NextAuth.js
  - Support for credentials and OAuth providers
  - Role-based access control

- **📝 Content Management**
  - Multi-blog support (manage multiple blogs from one account)
  - Rich text editor powered by Editor.js
  - Support for various content blocks (headers, paragraphs, lists, quotes, tables, code, images)
  - Draft and publish workflow
  - Featured posts
  - SEO optimization (meta tags, OG tags, canonical URLs)

- **🌍 Multilingual Support**
  - AI-powered automatic translation using OpenAI GPT-4o-mini
  - Translation grouping for managing content across languages
  - Support for multiple languages per post
  - Language-specific slugs and routing

- **🏷️ Content Organization**
  - Categories and tags
  - Author management with profiles
  - Custom slugs for SEO-friendly URLs
  - Content filtering and search

- **👥 Collaboration**
  - Multi-user blog management
  - Author profiles with bio and avatar
  - Blog member roles and permissions

- **🖼️ Media Management**
  - Image upload and management
  - S3-compatible storage (Cloudflare R2)
  - Cover image support for posts

- **🔌 API Access**
  - RESTful API for all operations
  - Blog-specific API keys (`blogId`)
  - Pagination and filtering
  - Query parameters for sorting and language selection

### Developer Features

- **TypeScript** for type safety
- **Prisma ORM** for database management
- **Server Components** for optimal performance
- **API Routes** for backend functionality
- **Docker support** for easy deployment
- **Dark mode** support

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma 6](https://www.prisma.io/)
- **Authentication:** [NextAuth.js v5](https://next-auth.js.org/)
- **Editor:** [Editor.js](https://editorjs.io/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **AI Translation:** [OpenAI API](https://platform.openai.com/)
- **Storage:** [AWS S3 SDK](https://aws.amazon.com/sdk-for-javascript/) (Cloudflare R2)
- **Deployment:** Docker ready

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**
- **PostgreSQL** database (local or remote)
- **OpenAI API key** (optional, for translation features)
- **S3-compatible storage** (optional, for image uploads)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/raulcanodev/zenex-cms.git
cd zenex-cms
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup

1. **Create environment file**

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zenex_cms"

# NextAuth
NEXTAUTH_URL="http://localhost:4444"
NEXTAUTH_SECRET="your-random-secret-key-here"

# OpenAI (optional - for translation features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Cloudflare R2 / S3 (optional - for image uploads)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
```

2. **Generate secrets**

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Database Setup

1. **Run database migrations**

```bash
npx prisma migrate dev
```

2. **Generate Prisma Client**

```bash
npx prisma generate
```

3. **(Optional) Open Prisma Studio to view your database**

```bash
npx prisma studio
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:4444](http://localhost:4444) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## 📖 Usage

### Creating Your First Blog

1. Sign up for an account at `/`
2. Navigate to the dashboard
3. Click "Create Blog"
4. Fill in your blog details (name, slug, description)
5. Start creating posts!

### Managing Content

- **Posts:** Create, edit, and manage blog posts with the rich Editor.js interface
- **Categories:** Organize posts with categories
- **Tags:** Add tags for better content discovery
- **Authors:** Create author profiles for attribution
- **Translations:** Use the translate feature to create multilingual content

### Using the API

Access your blog's content via the REST API:

```bash
GET /api/blogs/{blogId}/posts
GET /api/blogs/{blogId}/posts/{slug}
GET /api/blogs/{blogId}/categories
GET /api/blogs/{blogId}/tags
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (`published`, `draft`)
- `language`: Filter by language code (e.g., `en`, `es`)
- `category`: Filter by category ID
- `orderBy`: Sort field (`publishedAt`, `createdAt`, `title`)
- `order`: Sort direction (`asc`, `desc`)

Example:
```bash
curl https://your-domain.com/api/blogs/your-blog-id/posts?language=en&status=published&limit=20
```

---

## 📚 API Reference

### Posts API

#### Get all posts
```http
GET /api/blogs/{blogId}/posts
```

#### Get single post
```http
GET /api/blogs/{blogId}/posts/{slug}?language=en
```

### Categories API

#### Get all categories
```http
GET /api/blogs/{blogId}/categories
```

### Tags API

#### Get all tags
```http
GET /api/blogs/{blogId}/tags
```

For detailed API documentation, see the [API Documentation](docs/api).

---

## 📁 Project Structure

```
zenex-cms/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── docs/              # Documentation pages
│   └── ...
├── components/            # React components
│   ├── Auth/             # Authentication components
│   ├── Editor/           # Editor.js integration
│   ├── ui/               # UI components (Radix UI)
│   └── ...
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── ...
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── src/
│   └── server/
│       └── services/     # Business logic layer
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

---

## 🤝 Contributing

We love contributions! Whether it's bug reports, feature requests, or code contributions, all are welcome.

### How to Contribute

1. **Fork the repository**
2. **Create your feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Reporting Bugs

Found a bug? Please open an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment details

### Feature Requests

Have an idea? Open an issue with:
- A clear description of the feature
- Use cases and benefits
- Any relevant examples or mockups

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Documentation:** Check out our [docs](docs/)
- **Issues:** [GitHub Issues](https://github.com/raulcanodev/zenex-cms/issues)
- **Discussions:** [GitHub Discussions](https://github.com/raulcanodev/zenex-cms/discussions)

---

## 🙏 Acknowledgments

Built with these amazing open-source projects:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Editor.js](https://editorjs.io/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  <p>Made with ❤️ by the Zenex CMS team</p>
  <p>
    <a href="https://github.com/raulcanodev/zenex-cms">⭐ Star us on GitHub</a> •
    <a href="https://github.com/raulcanodev/zenex-cms/issues">🐛 Report Bug</a> •
    <a href="https://github.com/raulcanodev/zenex-cms/issues">✨ Request Feature</a>
  </p>
</div>

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# zenex-cms

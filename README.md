# Qiniu Storage Manager

A Next.js application for managing Qiniu storage buckets and files.

## Features

- View all Qiniu buckets
- List files in buckets
- Get file information
- Download files
- Upload files to buckets

## Technologies

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Qiniu SDK

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Qiniu Access Key and Secret Key

4. Run the development server:
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

The following environment variables are required:

```bash
QINIU_ACCESS_KEY=your_access_key_here
QINIU_SECRET_KEY=your_secret_key_here
```

You can obtain these from your Qiniu account dashboard.

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Project Structure

```
src/
  ├── app/              # Next.js app router pages
  ├── components/       # React components
  └── lib/             # Utility functions and services
```

## License

MIT
# NX Missing

A modern web application for tracking missing Nintendo Switch content, including games, DLCs, and updates.

![NX Missing Demo Video]()

## Features

- 📱 Responsive design that works on desktop and mobile
- 🌓 Light and dark mode support
- 🔍 Advanced search functionality across all content
- 📊 Sortable tables with multiple viewing options
- 🎮 Real-time game icon loading
- 📱 Pagination and items per page selection
- 🔄 Auto-formatting for dates and file sizes
- 🎯 Intelligent title ID handling for base games, updates, and DLCs

## Content Types

The application tracks four types of missing content:

- **Missing Titles**: Base games that are not yet available
- **Missing DLCs**: Downloadable content for existing games
- **Missing Updates**: Latest game updates
- **Missing Old Updates**: Historical update versions

## Data Format

### Missing Titles
```
TitleID|Release Date|Title Name|Size
```

### Missing DLCs
```
TitleID|Release Date|DLC Name|Base Game|Size
```

### Missing Updates
```
TitleID|Game Name|Version|Release Date
```

### Missing Old Updates
```json
{
  "TitleID": [
    {
      "Version": "version_number",
      "Release Date": "date"
    }
  ]
}
```

## Development

### Prerequisites

- Node.js 18 or higher
- npm, yarn or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ghost-land/nx-missing
cd nx-missing
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icons provided by [Lucide](https://lucide.dev/)
- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
# Hacker News UI

A modern, responsive web interface for browsing Hacker News content with real-time updates and enhanced user experience.

## Authors

- **Aandriko**
- **Cemvalot**
- **Ychaniot**

## 🚀 Features

### Core Functionality

- **Multiple Post Types**: Stories, Jobs, and Polls with visual type indicators
- **Category Navigation**: Top Stories, New, Best, Ask HN, Show HN, and Jobs
- **Infinite Scrolling**: Load more posts on demand with pagination
- **Modal Post Viewer**: Full post details with comments in an overlay
- **Nested Comments**: Expandable comment threads with proper threading
- **Live Updates**: Real-time sidebar with newest posts updated every 5 seconds

### User Experience

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean interface inspired by Hacker News with improved aesthetics
- **Loading States**: Visual feedback with spinners during data fetching
- **Keyboard Support**: ESC key to close modals
- **Interactive Comments**: Click on any comment to expand/collapse its replies
- **Visual Indicators**: Orange buttons clearly show expandable comments with reply counts
- **Error Handling**: Graceful degradation when API calls fail

### Performance

- **API Rate Limiting Protection**: 200ms spacing between requests to prevent abuse
- **Throttled Live Updates**: 5-second throttling on live update requests specifically
- **Efficient Loading**: Only fetch data when needed
- **Memory Management**: Limited live updates to prevent memory bloat
- **Optimized Rendering**: Minimal DOM manipulation for better performance
- **Progressive Comment Loading**: Comments load on-demand when expanded

## 🛠️ Technology Stack

- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Modern styling with Grid, Flexbox, and animations
- **Vanilla JavaScript (ES6+)**: No frameworks or libraries required
- **Hacker News API**: Official Firebase-hosted API

## 📁 Project Structure

```
clonernews/
├── index.html          # Main HTML structure
├── styles.css          # Complete CSS styling
├── script.js           # JavaScript functionality
└── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, but recommended for development)

### Installation

1. **Clone or download the project files**

   ```bash
   git clone <repository-url>
   cd hackernews-ui
   ```

2. **Serve the files locally** (recommended):

   **Using Python:**

   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js:**

   ```bash
   npx http-server
   ```

   **Using PHP:**

   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Direct File Access

You can also open `index.html` directly in your browser, though some features may be limited due to CORS restrictions.

## 🎯 Usage

### Navigation

- **Tab Selection**: Click category tabs to switch between different post types
- **Post Viewing**: Click any post to open it in a modal with full details
- **Load More**: Click "Load More" button to fetch additional posts
- **Live Updates**: Monitor the sidebar for real-time new posts

### Comments

- **View Comments**: Open any post to see its comment thread
- **Expand Replies**: Click the orange button (▶ X replies) or anywhere on a comment to view nested replies
- **Thread Navigation**: Comments are sorted newest first within each thread
- **Recursive Expansion**: Each reply can have its own sub-replies that can also be expanded
- **Visual Threading**: Proper indentation shows conversation hierarchy

### Live Updates

- **Real-time Feed**: New posts appear in the sidebar every 5 seconds
- **Quick Access**: Click any live update item to view the full post
- **Update Indicator**: Green pulse indicator shows live status

## 🔧 Configuration

### API Settings

The application uses the official Hacker News API:

- **Base URL**: `https://hacker-news.firebaseio.com/v0`
- **Rate Limiting**: 2-second throttle between requests
- **Posts per Page**: 20 (configurable in `script.js`)

### Customization

You can modify these settings in `script.js`:

```javascript
class HackerNewsApp {
  constructor() {
    this.POSTS_PER_PAGE = 20; // Posts loaded per page
    // ... other settings
  }
}
```

### Live Update Frequency

To change the live update interval, modify the timer in `startLiveUpdates()`:

```javascript
setInterval(() => {
  this.updateLiveData();
}, 5000); // Change 5000 to desired milliseconds
```

## 🎨 Styling

The application uses a modern design system:

- **Primary Color**: `#ff6600` (Hacker News orange)
- **Background**: `#f6f6ef` (Warm off-white)
- **Typography**: System fonts for optimal readability
- **Responsive Breakpoints**: Mobile-first design with 768px breakpoint

### Custom Styling

Modify `styles.css` to customize the appearance:

```css
:root {
  --primary-color: #ff6600;
  --background-color: #f6f6ef;
  --text-color: #000;
  --border-color: #eee;
}
```

## 🔌 API Reference

### Endpoints Used

- `GET /topstories.json` - Top stories IDs
- `GET /newstories.json` - New stories IDs
- `GET /beststories.json` - Best stories IDs
- `GET /askstories.json` - Ask HN stories IDs
- `GET /showstories.json` - Show HN stories IDs
- `GET /jobstories.json` - Job stories IDs
- `GET /item/{id}.json` - Individual item details

### Rate Limiting

The application implements client-side throttling to respect the API:

- **Throttle Delay**: 2 seconds between similar requests
- **Live Updates**: Limited to every 5 seconds
- **Batch Processing**: Multiple items fetched efficiently

## 📱 Browser Support

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## 🐛 Troubleshooting

### Common Issues

**Posts not loading:**

- Check browser console for network errors
- Ensure internet connection is stable
- Try refreshing the page

**Live updates not working:**

- Verify the page has been open for at least 5 seconds
- Check if the API is accessible
- Look for JavaScript errors in console

**Modal not opening:**

- Ensure JavaScript is enabled
- Check for conflicting CSS or scripts
- Try a different browser

### Performance Tips

- **For large comment threads**: Collapse unused comment branches
- **For slow connections**: Disable live updates temporarily
- **For mobile**: Use portrait orientation for better layout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Test across different browsers
5. Submit a pull request

### Code Style Guidelines

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Maintain separation of concerns

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Hacker News**: For providing the excellent API
- **Y Combinator**: For creating and maintaining Hacker News
- **Firebase**: For hosting the API infrastructure

## 📞 Support

For issues, questions, or contributions, please contact the development team:

- Aandriko
- Cemvalot
- Ychaniot

---

**Built with ❤️ using Vanilla JavaScript**

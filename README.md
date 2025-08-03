# FIR Designer 🎛️

A professional FIR (Finite Impulse Response) filter design tool built with Electron, Vue 3, and Vite. This application provides comprehensive tools for analyzing TRF (Transfer Response Function) files and designing high-quality FIR filters with real-time visualization.

![FIR Designer](https://img.shields.io/badge/Electron-25.0.0-blue)
![Vue](https://img.shields.io/badge/Vue-3.3.4-green)
![Vite](https://img.shields.io/badge/Vite-4.4.5-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📁 File Operations
- **TRF File Support**: Parse and validate TRF (Transfer Response Function) files
- **Drag & Drop**: Intuitive file import with drag and drop support
- **Paste Functionality**: Paste TRF data directly from clipboard
- **Multiple Formats**: Support for various TRF file formats including TTA DM3 with coherence data

### 🎛️ Filter Design
- **Multiple Algorithms**: Window method, least squares, and Parks-McClellan algorithms
- **Configurable Parameters**: Filter length, cutoff frequency, passband ripple, stopband attenuation
- **Real-time Processing**: Instant filter design with live feedback
- **Advanced Options**: Multiple window types (Hamming, Hanning, Blackman, Rectangular)

### 📊 Professional Visualization
- **Bode Plots**: Frequency response with magnitude and phase
- **Impulse Response**: Time-domain visualization of filter coefficients
- **Interactive Controls**: Zoom, pan, and toggle display options
- **Logarithmic Scaling**: Professional frequency scaling (15 Hz - 20 kHz)
- **Real-time Updates**: Live graph updates as data changes

### 💾 Export Capabilities
- **Multiple Formats**: Text, CSV, MATLAB, Python
- **Copy to Clipboard**: Quick coefficient copying
- **File Export**: Save coefficients to disk
- **Validation**: Automatic coefficient validation and formatting

### 🖥️ Desktop Application
- **Cross-platform**: Windows, macOS, and Linux support
- **Native Performance**: Electron-based desktop application
- **Modern UI**: Dark theme with professional styling
- **Responsive Design**: Adapts to different screen sizes

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yogaraihan60/firfilter.git
   cd firfilter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Launch Electron app**
   ```bash
   npm run electron:dev
   ```

### Building for Production

```bash
# Build the application
npm run build

# Build Electron app
npm run electron:build
```

## 📖 Usage

### 1. Import TRF Data
- **File Import**: Drag and drop TRF files or use the file browser
- **Paste Data**: Use Ctrl/Cmd + V to paste TRF data from clipboard
- **Sample Data**: Use the demo data button for testing

### 2. Configure Filter
- **Filter Type**: Choose low-pass, high-pass, band-pass, or band-stop
- **Parameters**: Set filter length, cutoff frequency, and window type
- **Advanced Options**: Configure passband ripple and stopband attenuation

### 3. Design Filter
- Click "Design Filter" to generate coefficients
- View real-time progress and results
- Analyze filter performance through visualizations

### 4. Export Results
- **Copy to Clipboard**: Quick coefficient copying
- **File Export**: Save in multiple formats (TXT, CSV, MATLAB, Python)
- **Visualization**: Export graphs and analysis results

## 🏗️ Architecture

### Frontend (Vue 3)
- **Composition API**: Modern Vue 3 reactive system
- **Pinia Store**: State management for application data
- **Component-based**: Modular, reusable components
- **TypeScript Ready**: Full TypeScript support available

### Backend (Electron)
- **Main Process**: File system operations and heavy computations
- **Renderer Process**: UI rendering and user interactions
- **IPC Communication**: Secure inter-process communication
- **Native APIs**: Access to system-level functionality

### Build System
- **Vite**: Fast development server and build tool
- **Electron Builder**: Cross-platform desktop app packaging
- **Hot Reload**: Instant development feedback
- **Optimized Builds**: Production-ready optimizations

## 📁 Project Structure

```
firfilter/
├── electron/                 # Electron main process
│   ├── main.js              # Main process entry point
│   ├── preload.js           # Preload script for IPC
│   ├── fileManager.js       # File operations
│   ├── firProcessor.js      # FIR filter algorithms
│   └── trfParser.js         # TRF file parser
├── src/                     # Vue application
│   ├── components/          # Vue components
│   │   ├── FileImporter.vue # File import interface
│   │   ├── FilterDesign.vue # Filter configuration
│   │   ├── Visualization.vue # Graph rendering
│   │   └── ExportPanel.vue  # Export functionality
│   ├── stores/              # Pinia stores
│   │   └── filterStore.js   # Application state
│   ├── utils/               # Utility functions
│   └── main.js              # Vue app entry point
├── scripts/                 # Build and utility scripts
├── sample.trf              # Sample TRF file for testing
└── package.json            # Project configuration
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run electron:dev     # Start Electron with dev server
npm run electron:build   # Build Electron app
npm run build           # Build Vue app for production
npm run preview         # Preview production build

# Testing
npm run test            # Run unit tests

# Utilities
npm run setup-git       # Setup Git repository
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Launch Electron**
   ```bash
   npm run electron:dev
   ```

3. **Make Changes**
   - Edit Vue components in `src/components/`
   - Modify Electron logic in `electron/`
   - Update styles in `src/style.css`

4. **Test Changes**
   - Hot reload will automatically update the application
   - Use the sample TRF file for testing
   - Check console for any errors

## 📊 TRF File Format

The application supports TRF (Transfer Response Function) files with the following format:

```
TTA DM3 10-9
Frequency (Hz)	Magnitude (dB)	Phase (degrees)	Coherence
1.464844	-20.36	-170.58	0.24
2.929688	-19.92	-171.24	0.01
4.394531	-20.22	-174.49	0.02
...
```

### Supported Formats
- **Standard TRF**: Frequency, magnitude, phase
- **Extended TRF**: Includes coherence data
- **TTA DM3**: Specialized format with header information
- **Custom Formats**: Configurable parser for different formats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Vue 3 Composition API patterns
- Use TypeScript for new features
- Maintain consistent code formatting
- Add tests for new functionality
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team**: For the amazing reactive framework
- **Electron Team**: For cross-platform desktop capabilities
- **Vite Team**: For the fast build tool
- **DSP Community**: For FIR filter algorithms and techniques

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yogaraihan60/firfilter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yogaraihan60/firfilter/discussions)
- **Email**: Contact through GitHub profile

---

**Made with ❤️ by the FIR Designer Team** 